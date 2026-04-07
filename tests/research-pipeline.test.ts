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
import { AbsoluteStopLossRule } from '../src/modules/rules/RiskRules.js';

test('ResearchPipeline (可信度驗證): 應能使用 Mock 資料完整產出具備計分的決策', async (t) => {
  const mockProvider = new MockProvider({
    'market_daily': [{ stockId: '2330', close: 100, open: 95, volume: 1000 }],
    'daily_valuation': [{ stockId: '2330', peRatio: 12, pbRatio: 1.5, dividendYield: 4 }],
    'month_revenue': [{ stockId: '2330', revenueYoy: 0.25, revenueMom: 0.1 }],
    'institutional_flow': [{ stockId: '2330', totalNet: 500, foreignNet: 300, trustNet: 200 }]
  });
  const providerRegistry = new ProviderRegistry([mockProvider]);

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
    ruleEngine: new DefaultRuleEngine(new DefaultRuleRegistry()),
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
  assert.ok(result.finalDecision.summary.includes('[無論點支撐]'));
});
