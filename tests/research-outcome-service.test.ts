import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchOutcomeService } from '../src/app/services/ResearchOutcomeService.js';
import { InMemoryResearchRunRepository, InMemoryResearchOutcomeRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { MockProvider } from './mocks/MockProvider.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';

test('ResearchOutcomeService (可信度驗證): 應能根據任務 tradeDate 準確推算 T+N 日期與報酬', async (t) => {
  const runRepo = new InMemoryResearchRunRepository();
  const outcomeRepo = new InMemoryResearchOutcomeRepository();
  
  // 1. 準備 Mock 資料：
  // 研究日 (T+0): 2024-04-03, 價格 100
  // 五日後 (T+5): 2024-04-08, 價格 110
  const mockProvider = new MockProvider({
    'market_daily_latest': [
      { stockId: '2330', tradeDate: '2024-04-03', close: 100 },
      { stockId: '2330', tradeDate: '2024-04-08', close: 110 }
    ]
  });
  (mockProvider as any).providerName = 'twse';
  const providerRegistry = new ProviderRegistry([mockProvider]);

  const service = new ResearchOutcomeService(outcomeRepo, runRepo, providerRegistry);

  // 2. 建立一個歷史任務 (4/3)
  const runId = 'historical-run-001';
  await runRepo.save({
    runId,
    tradeDate: '2024-04-03',
    criteria: {},
    topN: 1,
    accountTier: 'free',
    status: 'completed'
  });

  await runRepo.saveResults([{
    runId,
    stockId: '2330',
    preliminaryScore: 0,
    researchTotalScore: 1, // 確保非 0 以觸發計算
    finalAction: 'BUY',
    confidence: 1,
    summary: 'TEST'
  }]);

  // 3. 執行成效回填
  await service.backfillOutcomes(runId);

  // 4. 驗證
  const outcomes = await outcomeRepo.findByRunId(runId);
  assert.strictEqual(outcomes.length, 1);
  const result = outcomes[0];

  assert.strictEqual(result.entryReferencePrice, 100, '進場參考價應為 4/3 的收盤價 100');
  // T+5 報酬: (110 - 100) / 100 = 0.1
  assert.strictEqual(result.tPlus5Return, 0.1, 'T+5 報酬應正確計算為 10%');
  assert.strictEqual(result.isCorrectDirection, true, 'BUY 且上漲，方向正確應為 true');
});
