import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchPipelineService } from '../src/app/services/ResearchPipelineService.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../src/modules/rules/RuleEngine.js';
import { ThesisTracker } from '../src/modules/research/ThesisTracker.js';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';
import { InMemoryFeatureSnapshotRepository, InMemoryFinalDecisionRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { DataQualityGuardRule } from '../src/modules/rules/FilterRules.js';
import { BuySetupRule } from '../src/modules/rules/StrategyRules.js';

class EmptyPrimaryProvider {
  readonly providerName = 'twse';
  supports(dataset: string): boolean {
    return ['market_daily_latest', 'daily_valuation'].includes(dataset);
  }
  async fetch(query: { dataset: string }) {
    return {
      data: [],
      source: {
        provider: 'twse',
        dataset: query.dataset,
        fetchedAt: new Date().toISOString(),
        normalizationVersion: '1.0.0',
        isFallback: false,
        isCacheHit: false,
        isStale: false,
        queryMode: 'bulk' as const
      }
    };
  }
}

class FallbackFinMindProvider {
  readonly providerName = 'finmind';
  supports(): boolean {
    return true;
  }
  async fetch(query: { dataset: string; stockId?: string }) {
    const stockId = query.stockId || '6761';
    const start = new Date('2024-03-05');
    const history = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        stockId,
        tradeDate: date.toISOString().slice(0, 10),
        close: 80 + index,
        volume: 1000 + index * 20
      };
    });
    const benchmark = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        stockId: '0050',
        tradeDate: date.toISOString().slice(0, 10),
        close: 100 + index,
        volume: 3000
      };
    });

    const map: Record<string, any[]> = {
      market_daily_latest: [{ stockId, tradeDate: '2024-04-03', close: 110, open: 106, volume: 4000 }],
      daily_valuation: [{ stockId, tradeDate: '2024-04-03', peRatio: 14, pbRatio: 2, dividendYield: 2 }],
      institutional_flow: [{ stockId, tradeDate: '2024-04-03', totalNet: 500, foreignNet: 300, trustNet: 200 }],
      month_revenue: [{ stockId, yearMonth: '2024-03', revenueYoy: 0.3, revenueMom: 0.1 }],
      financial_statements: [
        { stockId, date: '2023-12-31', revenue: 1000, grossProfit: 400, operatingIncome: 210, eps: 6, roe: 17 },
        { stockId, date: '2023-09-30', revenue: 920, grossProfit: 340, operatingIncome: 170, eps: 5, roe: 15 },
        { stockId, date: '2023-06-30', revenue: 900, grossProfit: 330, operatingIncome: 160, eps: 5, roe: 14 },
        { stockId, date: '2023-03-31', revenue: 860, grossProfit: 300, operatingIncome: 145, eps: 4, roe: 13 }
      ],
      market_daily_history: stockId === '0050' ? benchmark : history,
      stock_news: []
    };

    return {
      data: map[query.dataset] || [],
      source: {
        provider: 'finmind',
        dataset: query.dataset,
        fetchedAt: new Date().toISOString(),
        normalizationVersion: '1.0.0',
        isFallback: true,
        isCacheHit: false,
        isStale: false,
        queryMode: 'per_stock' as const
      }
    };
  }
}

test('ResearchPipeline: primary provider 空資料時應 fallback 到下一個來源', async () => {
  const providerRegistry = new ProviderRegistry([new EmptyPrimaryProvider() as any, new FallbackFinMindProvider() as any]);
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new DataQualityGuardRule());
  ruleRegistry.register(new BuySetupRule());

  const mockRouter: any = {
    decide: (dataset: string) => ({
      dataset,
      finalProviderOrder: dataset === 'market_daily_latest' || dataset === 'daily_valuation' ? ['twse', 'finmind'] : ['finmind'],
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
    stockId: '6761',
    tradeDate: '2024-04-03',
    accountTier: 'free'
  });

  assert.strictEqual(result.rawData.marketDaily?.stockId, '6761');
  assert.strictEqual(result.rawData.valuationDaily?.stockId, '6761');
  assert.ok(!result.featureSnapshot.payload.missingFields.includes('market_daily'));
  assert.ok(!result.featureSnapshot.payload.missingFields.includes('daily_valuation'));
});

test('ResearchPipeline: 歷史日期不應使用 TWSE 最新快照覆寫 point-in-time 結果', async () => {
  let twseCalls = 0;

  class HistoricalTwseProvider {
    readonly providerName = 'twse';
    supports(dataset: string): boolean {
      return ['market_daily_latest', 'daily_valuation'].includes(dataset);
    }
    async fetch() {
      twseCalls += 1;
      return {
        data: [{ stockId: '6761', tradeDate: '2099-01-01', close: 999, open: 999, volume: 999999, peRatio: 99, pbRatio: 9, dividendYield: 9 }],
        source: {
          provider: 'twse',
          dataset: 'market_daily_latest',
          fetchedAt: new Date().toISOString(),
          normalizationVersion: '1.0.0',
          isFallback: false,
          isCacheHit: false,
          isStale: false,
          queryMode: 'bulk' as const
        }
      };
    }
  }

  class HistoricalFinMindProvider extends FallbackFinMindProvider {
    override async fetch(query: { dataset: string; stockId?: string; startDate?: string }) {
      if (query.dataset === 'market_daily_history') {
        const rows = Array.from({ length: 30 }, (_, index) => ({
          stockId: query.stockId || '6761',
          tradeDate: index === 29 ? '2024-04-03' : `2024-03-${String(index + 1).padStart(2, '0')}`,
          close: 80 + index,
          volume: 1000 + index * 20
        }));
        return {
          data: rows,
          source: {
            provider: 'finmind',
            dataset: query.dataset,
            fetchedAt: new Date().toISOString(),
            normalizationVersion: '1.0.0',
            isFallback: false,
            isCacheHit: false,
            isStale: false,
            queryMode: 'per_stock' as const
          }
        };
      }

      if (query.dataset === 'daily_valuation') {
        return {
          data: [{ stockId: '6761', tradeDate: query.startDate || '2024-04-03', peRatio: 14, pbRatio: 2, dividendYield: 2 }],
          source: {
            provider: 'finmind',
            dataset: query.dataset,
            fetchedAt: new Date().toISOString(),
            normalizationVersion: '1.0.0',
            isFallback: false,
            isCacheHit: false,
            isStale: false,
            queryMode: 'per_stock' as const
          }
        };
      }

      return super.fetch(query);
    }
  }

  const providerRegistry = new ProviderRegistry([new HistoricalTwseProvider() as any, new HistoricalFinMindProvider() as any]);
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new DataQualityGuardRule());
  ruleRegistry.register(new BuySetupRule());

  const mockRouter: any = {
    decide: (dataset: string) => ({
      dataset,
      finalProviderOrder: dataset === 'market_daily_latest' || dataset === 'daily_valuation' ? ['twse', 'finmind'] : ['finmind'],
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
    stockId: '6761',
    tradeDate: '2024-04-03',
    accountTier: 'free'
  });

  assert.strictEqual(twseCalls, 0, '歷史日期不應呼叫 TWSE 最新快照資料源');
  assert.strictEqual(result.rawData.marketDaily?.tradeDate, '2024-04-03');
  assert.strictEqual(result.rawData.marketDaily?.close, 109);
  assert.strictEqual(result.rawData.valuationDaily?.tradeDate, '2024-04-03');
  assert.strictEqual(result.diagnostics.isHistoricalPointInTime, true);
  assert.strictEqual(result.diagnostics.isNonTradingDay, false);
});
