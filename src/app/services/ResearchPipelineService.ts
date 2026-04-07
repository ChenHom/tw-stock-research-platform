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
import { ThesisTracker, type ThesisSnapshot } from '../../modules/research/ThesisTracker.js';
import { DecisionComposer } from '../../modules/research/DecisionComposer.js';
import { getDaysAgo } from '../../core/utils/date.js';

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

    // 1. 抓取多維度資料
    const marketDaily = await this.fetchSingle('market_daily_latest', input, budget);
    const valuationDaily = await this.fetchSingle('daily_valuation', input, budget);
    const institutionalFlow = await this.fetchSingle('institutional_flow', input, budget);
    const marginShort = await this.fetchSingle('margin_short', input, budget);
    
    // 財報抓取 (TTM 需 4 季)
    const financialStatements = await this.fetchRange('financial_statements', input.stockId, getDaysAgo(365, new Date(input.tradeDate)), input.tradeDate, input, budget);
    
    // 營收往前推 400 天確保能計算 YoY
    const monthRevenue = await this.fetchRange('month_revenue', input.stockId, getDaysAgo(400, new Date(input.tradeDate)), input.tradeDate, input, budget);
    
    // 抓取近 30 日歷史資料
    const history = await this.fetchRange('market_daily_history', input.stockId, getDaysAgo(30, new Date(input.tradeDate)), input.tradeDate, input, budget);

    // 抓取新聞 (P0-3)
    const news = await this.fetchRange('stock_news', input.stockId, getDaysAgo(7, new Date(input.tradeDate)), input.tradeDate, input, budget);

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
      history: history?.data || []
    };

    const featureSet = this.deps.featureBuilder.build(featureInput);

    const featureSnapshot: FeatureSnapshot = {
      id: randomUUID(),
      stockId: input.stockId,
      snapshotAt: new Date().toISOString(),
      featureSetVersion: '1.0.0',
      payload: featureSet
    };

    // 3. 評估論點狀態
    const thesisStatus = thesis
      ? this.deps.thesisTracker.evaluateStatus(thesis, {
          stockId: input.stockId,
          asOf: input.tradeDate,
          features: featureSet,
          thesis: {
            id: thesis.thesisId,
            version: thesis.version,
            status: thesis.status,
            direction: thesis.direction
          }
        })
      : 'none';

    // 4. 執行規則引擎
    const ruleResults = await this.deps.ruleEngine.evaluate({
      stockId: input.stockId,
      asOf: input.tradeDate,
      features: featureSet,
      thesis: thesis
        ? {
            id: thesis.thesisId,
            version: thesis.version,
            status: thesisStatus === 'none' ? thesis.status : thesisStatus,
            direction: thesis.direction
          }
        : undefined
    });

    // 5. 合成最終決策
    const finalDecision = this.deps.decisionComposer.compose({
      stockId: input.stockId,
      asOf: input.tradeDate,
      ruleResults,
      thesisStatus: thesisStatus,
      valuationGap: undefined
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
        monthRevenue: monthRevenue?.data?.[0],
        marginShort: marginShort?.data?.[0],
        news: news?.data || []
      },
      featureSnapshot,
      thesisSnapshot: thesis,
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
    budget?: BudgetSnapshot
  ) {
    const routing = this.deps.router.decide(dataset, input.accountTier, budget, stockId);
    if (!routing.canProceed) return null;

    for (const providerName of routing.finalProviderOrder) {
      const provider = this.deps.providerRegistry.getByName(providerName);
      if (!provider || !provider.supports(dataset)) continue;

      try {
        return await provider.fetch({
          dataset,
          stockId,
          startDate,
          endDate
        }, {
          accountTier: input.accountTier,
          useCache: input.useCache ?? true
        });
      } catch (error) {
        console.error(`[Pipeline] Provider ${providerName} 抓取 ${dataset} 失敗`);
      }
    }
    return null;
  }
}
