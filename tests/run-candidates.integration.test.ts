import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrap } from '../src/app/bootstrap.js';
import { MockProvider } from './mocks/MockProvider.js';

test('RunCandidates (端到端整合驗證): 應能完整執行篩選至報表輸出的鏈路', async (t) => {
  // 1. 初始化系統並注入 Mock Provider
  // 注意：MockProvider 回傳的是 normalize 後的資料，欄位應符合 MarketDailyRow 等
  const mockData = {
    'market_daily_latest': [
      { stockId: '2330', close: 100, volume: 5000 },
      { stockId: '2317', close: 50, volume: 3000 }
    ],
    'daily_valuation': [
      { stockId: '2330', peRatio: 12, pbRatio: 1.5, dividendYield: 3 },
      { stockId: '2317', peRatio: 10, pbRatio: 1.2, dividendYield: 4 }
    ],
    'market_daily_history': [],
    'month_revenue': [],
    'institutional_flow': [],
    'stock_news': [],
    'financial_statements': []
  };

  const mockProvider = new MockProvider(mockData);
  (mockProvider as any).providerName = 'twse'; 

  const app = bootstrap({ providers: [mockProvider] });

  // 2. 執行任務 (Mock 掉資料庫儲存以避免連線依賴)
  (app as any).researchPipeline.deps.featureSnapshotRepository = { save: async () => {} };
  (app as any).researchPipeline.deps.finalDecisionRepository = { save: async () => {} };

  const results = await app.candidateResearchService.run({
    criteria: { minVolume: 1000 },
    tradeDate: '2024-04-03',
    topN: 2,
    accountTier: 'free'
  });

  // 3. 驗證整條鏈路產出
  assert.ok(results.length > 0, '應至少篩選出一檔股票');
  assert.strictEqual(results[0].stockId, '2330', '第一檔應為 2330');
  
  // 4. 驗證報表產生
  const md = app.candidateResearchReportGenerator.buildMarkdownTable(results);
  assert.ok(md.includes('# 候選池研究綜整報告'), '應成功產出 Markdown 標題');
  assert.ok(md.includes('2330'), '報表中應包含研究對象代號');
});
