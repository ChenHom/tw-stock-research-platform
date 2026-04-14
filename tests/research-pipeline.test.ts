import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchPipelineService } from '../src/app/services/ResearchPipelineService.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../src/modules/rules/RuleEngine.js';
import { ThesisTracker } from '../src/modules/research/ThesisTracker.js';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';
import { InMemoryFeatureSnapshotRepository, InMemoryFinalDecisionRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { MockProvider } from './mocks/MockProvider.js';
import { DataQualityGuardRule } from '../src/modules/rules/FilterRules.js';
import { BuySetupRule, HoldTrendRule } from '../src/modules/rules/StrategyRules.js';

test('ResearchPipeline (可信度驗證): 應能使用 Mock 資料完整產出具備計分的決策', async (t) => {
  const start = new Date('2026-03-08');
  const history = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      stockId: '2330',
      tradeDate: date.toISOString().slice(0, 10),
      close: 90 + index,
      volume: 1500 + index * 10
    };
  });
  const mockProvider = new MockProvider({
    'market_daily_latest': [{ stockId: '2330', close: 120, open: 95, volume: 3000 }],
    'daily_valuation': [{ stockId: '2330', peRatio: 12, pbRatio: 1.5, dividendYield: 4 }],
    'month_revenue': [{ stockId: '2330', revenueYoy: 0.25, revenueMom: 0.1 }],
    'institutional_flow': [{ stockId: '2330', totalNet: 500, foreignNet: 300, trustNet: 200 }],
    'market_daily_history': history,
    'financial_statements': [
      { stockId: '2330', date: '2025-12-31', revenue: 1000, grossProfit: 400, operatingIncome: 200, eps: 6, roe: 18 },
      { stockId: '2330', date: '2025-09-30', revenue: 950, grossProfit: 350, operatingIncome: 180, eps: 5, roe: 16 },
      { stockId: '2330', date: '2025-06-30', revenue: 900, grossProfit: 320, operatingIncome: 160, eps: 5, roe: 15 },
      { stockId: '2330', date: '2025-03-31', revenue: 850, grossProfit: 300, operatingIncome: 150, eps: 5, roe: 14 }
    ]
  });
  const providerRegistry = new ProviderRegistry([mockProvider]);
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new DataQualityGuardRule());
  ruleRegistry.register(new BuySetupRule());
  ruleRegistry.register(new HoldTrendRule());

  // Mock Router：強迫所有 Dataset 都走 mock provider
  const mockRouter: any = {
    decide: (dataset: string) => ({
      dataset,
      finalProviderOrder: ['mock'],
      canProceed: true,
      queryMode: 'per_stock',
      estimatedCost: { estimatedCalls: 0, estimatedCostUnits: 0 }
    })
  };

  const pipeline = new ResearchPipelineService({
    router: mockRouter,
    providerRegistry,
    featureBuilder: new FeatureBuilder(),
    ruleEngine: new DefaultRuleEngine(ruleRegistry),
    thesisTracker: new ThesisTracker(),
    decisionComposer: new DecisionComposer(),
    featureSnapshotRepository: new InMemoryFeatureSnapshotRepository(),
    finalDecisionRepository: new InMemoryFinalDecisionRepository()
  });

  const result = await pipeline.run({
    stockId: '2330',
    tradeDate: '2026-04-06',
    accountTier: 'free'
  });

  assert.strictEqual(result.stockId, '2330');
  const score = result.featureSnapshot.payload.totalScore;
  assert.ok(score > 0, `特徵計分應大於 0 (應包含估值與營收加分), 實際為: ${score}`);
  assert.strictEqual(result.finalDecision.action, 'BUY');
  assert.ok(result.thesisEvaluation, '應產出 evidence-driven thesis evaluation');
  assert.ok((result.finalDecision.explanation?.thesisSignals?.length ?? 0) > 0, '決策說明應包含論點訊號');
  assert.ok(!result.ruleResults.some(rule => rule.ruleId === 'filter.data_quality_guard' && rule.triggered), '資料完整時不應被品質防線攔下');
});
