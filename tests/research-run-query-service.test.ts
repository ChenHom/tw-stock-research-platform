import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchRunQueryService } from '../src/app/services/ResearchRunQueryService.js';
import { InMemoryResearchRunRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { randomUUID } from 'node:crypto';

test('ResearchRunQueryService: 應能正確聚合與查回任務摘要', async (t) => {
  const repo = new InMemoryResearchRunRepository();
  const queryService = new ResearchRunQueryService(repo);
  const runId = randomUUID();
  const runningId = randomUUID();

  // 1. 模擬存入一筆完整任務
  await repo.save({
    runId,
    tradeDate: '2024-04-03',
    criteria: { minVolume: 2000 },
    topN: 5,
    accountTier: 'free',
    status: 'completed'
  });

  await repo.saveResults([{
    runId,
    stockId: '2330',
    preliminaryScore: 80,
    researchTotalScore: 85,
    finalAction: 'BUY',
    confidence: 0.9,
    summary: 'OK',
    ruleResults: [],
    thesisStatus: 'none'
  }]);

  await repo.save({
    runId: runningId,
    tradeDate: '2024-04-03',
    criteria: { minVolume: 1000 },
    topN: 3,
    accountTier: 'free',
    status: 'running'
  });

  // 2. 測試 getLatestRunSummary
  const summary = await queryService.getLatestRunSummary();
  assert.ok(summary, '應能查到最近一筆 completed');
  assert.strictEqual(summary?.run.runId, runId);
  assert.strictEqual(summary?.results.length, 1);
  assert.strictEqual(summary?.results[0].stockId, '2330');

  // 3. 測試 findRunsByDate
  const runs = await queryService.findRunsByDate('2024-04-03');
  assert.strictEqual(runs.length, 2);
  const completedRuns = await queryService.findCompletedRunsByDate('2024-04-03');
  assert.strictEqual(completedRuns.length, 1);
  assert.strictEqual(completedRuns[0].runId, runId);

  // 4. 測試 getRunDetail
  const details = await queryService.getRunDetail(runId);
  assert.strictEqual(details.length, 1);
  assert.strictEqual(details[0].researchTotalScore, 85);
});
