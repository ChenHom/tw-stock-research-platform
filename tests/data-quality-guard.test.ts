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
import { BuySetupRule } from '../src/modules/rules/StrategyRules.js';

test('DataQualityGuardRule: 關鍵資料不足時應降為 WATCH 並說明原因', async () => {
  const mockProvider = new MockProvider({
    'market_daily_latest': [{ stockId: '2330', close: 120, open: 95, volume: 3000 }],
    'daily_valuation': [{ stockId: '2330', peRatio: 12, pbRatio: 1.5, dividendYield: 4 }],
    'month_revenue': [{ stockId: '2330', revenueYoy: 0.25, revenueMom: 0.1 }],
    'institutional_flow': [{ stockId: '2330', totalNet: 500, foreignNet: 300, trustNet: 200 }]
  });
  const providerRegistry = new ProviderRegistry([mockProvider]);
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new DataQualityGuardRule());
  ruleRegistry.register(new BuySetupRule());

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

  assert.strictEqual(result.finalDecision.action, 'WATCH');
  assert.ok(result.finalDecision.summary.includes('資料品質不足'));
  assert.ok(result.ruleResults.some(rule => rule.ruleId === 'filter.data_quality_guard' && rule.triggered));
});
