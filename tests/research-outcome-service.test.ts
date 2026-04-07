import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchOutcomeService } from '../src/app/services/ResearchOutcomeService.js';
import { InMemoryResearchRunRepository, InMemoryResearchOutcomeRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { MockProvider } from './mocks/MockProvider.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';

test('ResearchOutcomeService: 應能根據正確的起始日期與進場價計算報酬', async (t) => {
  const runRepo = new InMemoryResearchRunRepository();
  const outcomeRepo = new InMemoryResearchOutcomeRepository();
  
  // 1. 準備 Mock 資料：設定 2024-04-03 為進場日 ($100)，2024-04-08 (T+5) 為 $110
  const mockProvider = new MockProvider({
    'market_daily_latest': [
      { stockId: '2330', tradeDate: '2024-04-03', close: 100 },
      { stockId: '2330', tradeDate: '2024-04-08', close: 110 }
    ]
  });
  (mockProvider as any).providerName = 'twse';
  const providerRegistry = new ProviderRegistry([mockProvider]);

  const service = new ResearchOutcomeService(outcomeRepo, runRepo, providerRegistry);

  // 2. 準備任務與結果
  const runId = 'run-123';
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
    researchTotalScore: 0,
    finalAction: 'BUY',
    confidence: 1,
    summary: 'TEST'
  }]);

  // 3. 執行回填
  await service.backfillOutcomes(runId);

  // 4. 驗證結果
  const outcomes = await outcomeRepo.findByRunId(runId);
  assert.strictEqual(outcomes.length, 1);
  const result = outcomes[0];

  assert.strictEqual(result.entryReferencePrice, 100, '應抓到 4/3 的價格 100');
  // T+5 報酬: (110 - 100) / 100 = 0.1
  assert.strictEqual(result.tPlus5Return, 0.1, 'T+5 報酬應為 10%');
  assert.strictEqual(result.isCorrectDirection, true, 'BUY 且漲價，方向應為正確');
});
