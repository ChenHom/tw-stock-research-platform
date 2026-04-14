import { randomUUID } from 'node:crypto';
import type { RunResearchInput, RunResearchOutput } from '../../core/contracts/pipeline.js';
import type { FeatureBuildInput } from '../../core/contracts/feature.js';
import type { DatasetRouter } from '../../core/contracts/router.js';
import type { DatasetQuery } from '../../core/contracts/provider.js';
import type { FeatureSnapshot } from '../../core/types/feature.js';
import type { RuleEngine } from '../../core/contracts/rule.js';
import type { FeatureBuilder } from '../../core/contracts/feature.js';
import type { FeatureSnapshotRepository, FinalDecisionRepository } from '../../core/contracts/storage.js';
import type { BudgetSnapshot } from '../../modules/budget/RateBudgetGuard.js';
import { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';
import { ThesisTracker, type ThesisSnapshot, type ThesisEvaluation, type CreateThesisInput } from '../../modules/research/ThesisTracker.js';
import { DecisionComposer } from '../../modules/research/DecisionComposer.js';
import { getDaysAgo, toTaipeiDateString } from '../../core/utils/date.js';

export interface ResearchPipelineDeps {
  router: DatasetRouter;
  providerRegistry: ProviderRegistry;
  featureBuilder: FeatureBuilder;
  ruleEngine: RuleEngine;
  thesisTracker: ThesisTracker;
  decisionComposer: DecisionComposer;
  featureSnapshotRepository: FeatureSnapshotRepository;
  finalDecisionRepository: FinalDecisionRepository;
}

export class ResearchPipelineService {
  constructor(private readonly deps: ResearchPipelineDeps) {}

  async run(
    input: RunResearchInput,
    budget?: BudgetSnapshot,
    thesis?: ThesisSnapshot
  ): Promise<RunResearchOutput> {
    console.log(`[Pipeline] 開始研究任務: ${input.stockId} @ ${input.tradeDate}`);
    const isHistoricalPointInTime = input.tradeDate !== toTaipeiDateString();

    // 1. 抓取多維度資料
    const history = await this.fetchRange('market_daily_history', input.stockId, getDaysAgo(30, new Date(input.tradeDate)), input.tradeDate, input, budget);

    // 抓取 0050 基準資料用於 Alpha 計算 (P0-3)
    const benchmark = await this.fetchRange('market_daily_history', '0050', getDaysAgo(30, new Date(input.tradeDate)), input.tradeDate, input, budget);

    const marketDaily = isHistoricalPointInTime
      ? this.buildExactDateResponse(history, input.tradeDate)
      : await this.fetchSingle('market_daily_latest', input, budget);

    const valuationDaily = isHistoricalPointInTime
      ? await this.fetchRange('daily_valuation', input.stockId, input.tradeDate, input.tradeDate, input, budget, { preferredProviders: ['finmind'] })
      : await this.fetchSingle('daily_valuation', input, budget);

    const institutionalFlow = await this.fetchSingle('institutional_flow', input, budget);
    const marginShort = await this.fetchSingle('margin_short', input, budget);
    
    // 財報抓取 (TTM 需 4 季)
    const financialStatements = await this.fetchRange('financial_statements', input.stockId, getDaysAgo(365, new Date(input.tradeDate)), input.tradeDate, input, budget);
    
    // 營收往前推 400 天確保能計算 YoY 與趨勢 (P0-3)
    const monthRevenue = await this.fetchRange('month_revenue', input.stockId, getDaysAgo(400, new Date(input.tradeDate)), input.tradeDate, input, budget);

    // 抓取新聞 (FinMind Free Tier 建議單日查詢以避免 400)
    const news = await this.fetchRange('stock_news', input.stockId, input.tradeDate, input.tradeDate, input, budget);
    const isNonTradingDay = isHistoricalPointInTime && !marketDaily?.data?.[0];

    // 2. 構建特徵集
    const latestRevenue = monthRevenue?.data 
      ? [...monthRevenue.data].sort((a: any, b: any) => b.yearMonth.localeCompare(a.yearMonth))[0] 
      : undefined;

    const featureInput: FeatureBuildInput = {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      marketDaily: marketDaily?.data?.[0],
      valuationDaily: valuationDaily?.data?.[0],
      institutionalFlow: institutionalFlow?.data?.[0],
      monthRevenue: latestRevenue,
      marginShort: marginShort?.data?.[0],
      financialStatements: financialStatements?.data || [],
      news: news?.data || [],
      history: history?.data || [],
      benchmarkHistory: benchmark?.data || [], // 補傳 benchmark 歷史
      monthRevenueHistory: monthRevenue?.data || [] // 補傳營收完整歷史
    };

    const featureSet = this.deps.featureBuilder.build(featureInput);

    const featureSnapshot: FeatureSnapshot = {
      id: randomUUID(),
      stockId: input.stockId,
      snapshotAt: new Date().toISOString(),
      featureSetVersion: '1.0.0',
      payload: featureSet
    };

    // 2.5 自動合成初始論點
    let activeThesis = thesis;
    if (!activeThesis) {
      activeThesis = this.deps.thesisTracker.createThesis(this.buildSystemThesis(featureSet));
    }

    // 3. 評估論點狀態 (evidence-driven)
    let thesisStatus: import('../../core/types/common.js').ThesisStatus | 'none' = 'none';
    let thesisEvaluation: ThesisEvaluation | undefined;
    if (activeThesis) {
      thesisEvaluation = this.deps.thesisTracker.evaluateDetailed(activeThesis, {
        stockId: input.stockId,
        asOf: input.tradeDate,
        features: featureSet,
        config: {
          hasPosition: input.hasPosition ?? false
        },
        thesis: {
          id: activeThesis.thesisId,
          version: activeThesis.version,
          status: activeThesis.status,
          direction: activeThesis.direction
        }
      });
      thesisStatus = thesisEvaluation.status;
      activeThesis = {
        ...activeThesis,
        status: thesisEvaluation.status,
        lastEvaluation: thesisEvaluation
      };
    }

    // 4. 執行規則引擎
    const ruleResults = await this.deps.ruleEngine.evaluate({
      stockId: input.stockId,
      asOf: input.tradeDate,
      features: featureSet,
      config: {
        hasPosition: input.hasPosition ?? false
      },
      thesis: activeThesis
        ? {
            id: activeThesis.thesisId,
            version: activeThesis.version,
            status: thesisStatus === 'none' ? activeThesis.status : thesisStatus,
            direction: activeThesis.direction
          }
        : undefined
    });

    // 5. 合成最終決策
    const finalDecision = this.deps.decisionComposer.compose({
      stockId: input.stockId,
      asOf: input.tradeDate,
      ruleResults,
      thesisStatus: thesisStatus,
      valuationGap: undefined,
      features: featureSet,
      hasPosition: input.hasPosition,
      thesisEvaluation
    });

    // 6. 持久化
    await this.deps.featureSnapshotRepository.save(featureSnapshot);
    await this.deps.finalDecisionRepository.save(finalDecision);

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      rawData: {
        marketDaily: marketDaily?.data?.[0],
        valuationDaily: valuationDaily?.data?.[0],
        institutionalFlow: institutionalFlow?.data?.[0],
        monthRevenue: latestRevenue,
        marginShort: marginShort?.data?.[0],
        news: news?.data || []
      },
      diagnostics: {
        isHistoricalPointInTime,
        isNonTradingDay
      },
      featureSnapshot,
      thesisSnapshot: activeThesis,
      thesisEvaluation,
      thesisStatus,
      ruleResults,
      finalDecision
    };
  }

  private async fetchSingle(dataset: string, input: RunResearchInput, budget?: BudgetSnapshot) {
    return this.fetchRange(dataset, input.stockId, input.tradeDate, input.tradeDate, input, budget);
  }

  private async fetchRange(
    dataset: string,
    stockId: string,
    startDate: string,
    endDate: string,
    input: RunResearchInput,
    budget?: BudgetSnapshot,
    options?: {
      preferredProviders?: string[];
    }
  ) {
    const routing = this.deps.router.decide(dataset, input.accountTier, budget, stockId);
    if (!routing.canProceed) return null;

    const preferredOrder = options?.preferredProviders?.length
      ? options.preferredProviders.filter(providerName => routing.finalProviderOrder.includes(providerName))
      : [];

    const providerOrder = preferredOrder.length > 0
      ? preferredOrder
      : routing.finalProviderOrder;

    if (providerOrder.length === 0) return null;

    for (const providerName of providerOrder) {
      const provider = this.deps.providerRegistry.getByName(providerName);
      if (!provider || !provider.supports(dataset)) continue;

      try {
        const response = await provider.fetch({
          dataset,
          stockId,
          startDate,
          endDate
        }, {
          accountTier: input.accountTier,
          useCache: input.useCache ?? true
        });

        if (Array.isArray(response?.data) && response.data.length === 0) {
          console.warn(`[Pipeline] Provider ${providerName} 回傳空資料，嘗試下一個來源 (${dataset}:${stockId})`);
          continue;
        }

        return response;
      } catch (error) {
        console.error(`[Pipeline] Provider ${providerName} 抓取 ${dataset} 失敗`);
      }
    }
    return null;
  }

  private buildExactDateResponse(response: any, tradeDate: string) {
    if (!Array.isArray(response?.data)) return null;
    const exactRow = response.data.find((row: any) => row.tradeDate === tradeDate);
    if (!exactRow) return null;

    return {
      data: [exactRow],
      source: {
        ...response.source,
        asOf: tradeDate
      },
      warnings: response.warnings
    };
  }

  private buildSystemThesis(featureSet: FeatureSnapshot['payload']): CreateThesisInput {
    const direction =
      featureSet.totalScore >= 60 ? 'long'
      : featureSet.totalScore < 40 ? 'short'
      : 'watch';

    const statement =
      direction === 'long'
        ? '系統生成：基本面、趨勢與籌碼偏多'
        : direction === 'short'
          ? '系統生成：趨勢轉弱且風險升高'
          : '系統生成：條件未齊，先以觀察為主';

    return {
      stockId: featureSet.stockId,
      statement,
      direction,
      convictionScore: Math.max(20, Math.min(90, Math.round(featureSet.totalScore))),
      evidence: [
        {
          type: 'feature_snapshot',
          refId: 'score-floor',
          pillarKey: 'totalScore',
          polarity: 'support',
          comparison: 'gte',
          threshold: 60,
          label: '總分 >= 60'
        },
        {
          type: 'feature_snapshot',
          refId: 'trend-above-ma20',
          pillarKey: 'bias20',
          polarity: 'support',
          comparison: 'gte',
          threshold: 0,
          label: '股價站上 MA20'
        },
        {
          type: 'feature_snapshot',
          refId: 'chip-positive',
          pillarKey: 'institutionalNet',
          polarity: 'support',
          comparison: 'gte',
          threshold: 0,
          label: '法人未翻空'
        },
        {
          type: 'feature_snapshot',
          refId: 'revenue-yoy',
          pillarKey: 'revenueYoy',
          polarity: 'support',
          comparison: 'gte',
          threshold: 0.15,
          label: '營收 YoY >= 15%'
        },
        {
          type: 'feature_snapshot',
          refId: 'event-neutral',
          pillarKey: 'eventScore',
          polarity: 'support',
          comparison: 'gte',
          threshold: 50,
          label: '事件分數 >= 50'
        },
        {
          type: 'feature_snapshot',
          refId: 'margin-risk',
          pillarKey: 'marginRiskScore',
          polarity: 'risk',
          comparison: 'gte',
          threshold: 80,
          label: '融資風險過高'
        },
        {
          type: 'feature_snapshot',
          refId: 'trend-breakdown',
          pillarKey: 'bias20',
          polarity: 'disconfirm',
          comparison: 'lte',
          threshold: -5,
          label: '股價跌破 MA20 5% 以上'
        },
        {
          type: 'feature_snapshot',
          refId: 'chip-reversal',
          pillarKey: 'institutionalNet',
          polarity: 'disconfirm',
          comparison: 'lte',
          threshold: -200,
          label: '法人顯著翻空'
        }
      ]
    };
  }
}
