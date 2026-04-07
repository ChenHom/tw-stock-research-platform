import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrap } from '../src/app/bootstrap.js';
import { MockProvider } from './mocks/MockProvider.js';

test('ResearchRunQuery: 應能成功查回最近一次研究任務的摘要', async (t) => {
  // 1. 初始化 (使用 In-memory 以進行純邏輯測試)
  const mockProvider = new MockProvider({
    'market_daily_latest': [{ stockId: '2330', close: 100, volume: 5000 }],
    'daily_valuation': [{ stockId: '2330', peRatio: 12, pbRatio: 1.5, dividendYield: 3 }]
  });
  (mockProvider as any).providerName = 'twse'; // 欺騙 Router

  const app = bootstrap({
    providers: [mockProvider]
  });

  // 2. 先執行一次任務
  await app.candidateResearchService.run({
    criteria: { minVolume: 1000 },
    tradeDate: '2024-04-03',
    topN: 1,
    accountTier: 'free'
  });

  // 3. 測試查詢層
  const summary = await app.researchRunQueryService.getLatestResearchSummary();
  
  assert.ok(summary);
  assert.strictEqual(summary?.run.tradeDate, '2024-04-03');
  assert.strictEqual(summary?.results.length, 1);
  assert.strictEqual(summary?.results[0].stockId, '2330');
  assert.strictEqual(summary?.run.status, 'completed');
});
