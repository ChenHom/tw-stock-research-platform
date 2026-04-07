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
    const marketDaily = await this.fetchSingle('market_daily', input, budget);
    const valuationDaily = await this.fetchSingle('daily_valuation', input, budget);
    const institutionalFlow = await this.fetchSingle('institutional_flow', input, budget);
    const monthRevenue = await this.fetchSingle('month_revenue', input, budget);

    // 2. 構建特徵集
    const featureInput: FeatureBuildInput = {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      marketDaily: marketDaily?.data?.[0],
      valuationDaily: valuationDaily?.data?.[0],
      institutionalFlow: institutionalFlow?.data?.[0],
      monthRevenue: monthRevenue?.data?.[0],
      history: [] // 基礎版先空，之後可擴充歷史序列
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
      thesisStatus: thesisStatus === 'none' ? 'active' : thesisStatus,
      valuationGap: undefined
    });

    // 6. 持久化
    await this.deps.featureSnapshotRepository.save(featureSnapshot);
    await this.deps.finalDecisionRepository.save(finalDecision);

    console.log(`[Pipeline] 研究完成。決策: ${finalDecision.action}, 信心度: ${(finalDecision.confidence * 100).toFixed(1)}%`);

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      rawData: {
        marketDaily: marketDaily?.data?.[0],
        valuationDaily: valuationDaily?.data?.[0],
        institutionalFlow: institutionalFlow?.data?.[0],
        monthRevenue: monthRevenue?.data?.[0]
      },
      featureSnapshot,
      thesisSnapshot: thesis,
      thesisStatus,
      ruleResults,
      finalDecision
    };
  }

  private async fetchSingle(
    dataset: string,
    input: RunResearchInput,
    budget?: BudgetSnapshot
  ) {
    const routing = this.deps.router.decide(dataset, input.accountTier, budget, input.stockId);

    if (!routing.canProceed) {
      console.warn(`[Pipeline] 跳過資料集 ${dataset}: 路由不可行 (${routing.degradeMode})`);
      return null;
    }

    let lastError: unknown;

    for (const providerName of routing.finalProviderOrder) {
      const provider = this.deps.providerRegistry.getByName(providerName);
      if (!provider || !provider.supports(dataset)) continue;

      const query: DatasetQuery = {
        dataset,
        stockId: input.stockId,
        startDate: dataset === 'month_revenue' ? input.tradeDate.slice(0, 7) + '-01' : input.tradeDate
      };

      try {
        return await provider.fetch(query, {
          accountTier: input.accountTier,
          useCache: input.useCache ?? true,
          allowFallback: routing.supportsFallback
        });
      } catch (error) {
        console.error(`[Pipeline] Provider ${providerName} 抓取 ${dataset} 失敗:`, error);
        lastError = error;
      }
    }

    return null;
  }
}
