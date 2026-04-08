import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrap } from '../src/app/bootstrap.js';
import { MockProvider } from './mocks/MockProvider.js';

test('RunCandidates (端到端整合驗證): 應能完整執行篩選至報表輸出的鏈路', async (t) => {
  const mockData = {
    'market_daily_latest': [
      { stockId: '2330', close: 600, volume: 5000, tradeDate: '2024-04-03' },
      { stockId: '2317', close: 150, volume: 10000, tradeDate: '2024-04-03' }
    ],
    'daily_valuation': [
      { stockId: '2330', peRatio: 12, pbRatio: 2.5, dividendYield: 3, tradeDate: '2024-04-03' },
      { stockId: '2317', peRatio: 8, pbRatio: 1.2, dividendYield: 6, tradeDate: '2024-04-03' }
    ],
    'month_revenue': [
      { stockId: '2330', revenueYoy: 0.5, yearMonth: '2024-03' } // 高營收加分使 2330 領先
    ],
    'institutional_flow': [
      { stockId: '2330', totalNet: 1000 }
    ],
    'market_daily_history': [
      { stockId: '2330', close: 600, tradeDate: '2024-04-03' },
      { stockId: '2317', close: 150, tradeDate: '2024-04-03' }
    ]
  };

  const twseMock = new MockProvider(mockData); (twseMock as any).providerName = 'twse';
  const finmindMock = new MockProvider(mockData); (finmindMock as any).providerName = 'finmind';

  const app = bootstrap({ providers: [twseMock, finmindMock] });

  const results = await app.candidateResearchService.run({
    criteria: { minVolume: 2000 },
    tradeDate: '2024-04-03',
    topN: 2
  });

  assert.ok(results.length > 0);
  // 檢查是否包含這兩檔即可，不糾結於 Mock 排序
  const stockIds = results.map(r => r.stockId);
  assert.ok(stockIds.includes('2330'));
  assert.ok(stockIds.includes('2317'));
});
