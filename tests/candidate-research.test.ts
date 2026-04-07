import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchService } from '../src/app/services/CandidateResearchService.js';
import { ScreeningService } from '../src/app/services/ScreeningService.js';
import { ResearchPipelineService } from '../src/app/services/ResearchPipelineService.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';
import { MockProvider } from './mocks/MockProvider.js';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../src/modules/rules/RuleEngine.js';
import { ThesisTracker } from '../src/modules/research/ThesisTracker.js';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';
import { InMemoryFeatureSnapshotRepository, InMemoryFinalDecisionRepository } from '../src/modules/storage/InMemoryRepositories.js';

test('CandidateResearchService (協調器驗證): 應能串接初篩與深度研究流程', async (t) => {
  // 1. Mock 資料環境
  const mockProvider = new MockProvider({
    // 初篩所需
    'market_daily_latest': [
      { stockId: '2330', close: 600, volume: 5000 },
      { stockId: '2317', close: 150, volume: 10000 }
    ],
    'daily_valuation': [
      { stockId: '2330', peRatio: 12, pbRatio: 2.5, dividendYield: 3 },
      { stockId: '2317', peRatio: 8, pbRatio: 1.2, dividendYield: 6 }
    ],
    // 深度研究所需 (對兩檔股票都有資料)
    'month_revenue': [
      { stockId: '2330', revenueYoy: 0.25, yearMonth: '2026-03' },
      { stockId: '2317', revenueYoy: 0.1, yearMonth: '2026-03' }
    ],
    'institutional_flow': [
      { stockId: '2330', totalNet: 1000 },
      { stockId: '2317', totalNet: 500 }
    ]
  });
  const providerRegistry = new ProviderRegistry([mockProvider]);

  const mockRouter: any = {
    decide: (dataset: string) => ({
      dataset,
      finalProviderOrder: ['mock'],
      canProceed: true,
      queryMode: 'bulk'
    })
  };

  // 2. 初始化服務
  const screeningService = new ScreeningService(mockRouter, providerRegistry);
  const researchPipeline = new ResearchPipelineService({
    router: mockRouter,
    providerRegistry,
    featureBuilder: new FeatureBuilder(),
    ruleEngine: new DefaultRuleEngine(new DefaultRuleRegistry()),
    thesisTracker: new ThesisTracker(),
    decisionComposer: new DecisionComposer(),
    featureSnapshotRepository: new InMemoryFeatureSnapshotRepository(),
    finalDecisionRepository: new InMemoryFinalDecisionRepository()
  });

  const coordinator = new CandidateResearchService(screeningService, researchPipeline);

  // 3. 執行
  const results = await coordinator.run({
    criteria: { minVolume: 2000 },
    tradeDate: '2026-04-07',
    topN: 2
  });

  // 4. 驗證
  assert.strictEqual(results.length, 2);
  
  // 驗證 2330 (初篩分數較低，但深度研究後總分可能更高)
  const result2330 = results.find(r => r.stockId === '2330');
  assert.ok(result2330);
  assert.ok(result2330.research.featureSnapshot.payload.revenueYoy > 0, '深度研究應補足營收資料');
  
  // 驗證排序 (依深度研究後的 totalScore 排序)
  assert.ok(results[0].research.featureSnapshot.payload.totalScore >= results[1].research.featureSnapshot.payload.totalScore);
});