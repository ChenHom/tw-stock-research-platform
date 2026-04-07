import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchPerformanceService } from '../src/app/services/ResearchPerformanceService.js';
import { InMemoryResearchOutcomeRepository } from '../src/modules/storage/InMemoryRepositories.js';

test('ResearchPerformanceService: 應正確計算勝率與平均報酬', async (t) => {
  const repo = new InMemoryResearchOutcomeRepository();
  const service = new ResearchPerformanceService(repo);
  const runId = 'test-run-perf';

  // 1. 準備 Mock 成效數據
  // 兩檔正確 (BUY 漲, SELL 跌), 一檔錯誤 (BUY 跌)
  await repo.save({ runId, stockId: '2330', action: 'BUY', entryReferencePrice: 100, tPlus5Return: 0.1, isCorrectDirection: true });
  await repo.save({ runId, stockId: '2317', action: 'SELL', entryReferencePrice: 50, tPlus5Return: -0.05, isCorrectDirection: true });
  await repo.save({ runId, stockId: '2454', action: 'BUY', entryReferencePrice: 1000, tPlus5Return: -0.02, isCorrectDirection: false });

  // 2. 測試統計邏輯
  const stats = await service.getRunPerformance(runId);

  assert.ok(stats);
  assert.strictEqual(stats?.totalCount, 3);
  assert.strictEqual(stats?.correctDirectionCount, 2);
  // Accuracy: 2/3 = 0.666...
  assert.ok(stats?.accuracy > 0.66 && stats?.accuracy < 0.67);
  // Avg Return: (0.1 - 0.05 - 0.02) / 3 = 0.01
  assert.ok(stats?.averageReturn5D > 0.009 && stats?.averageReturn5D < 0.011);
});
