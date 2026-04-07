import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchRunQueryService } from '../src/app/services/ResearchRunQueryService.js';
import { InMemoryResearchRunRepository } from '../src/modules/storage/InMemoryRepositories.js';
import { randomUUID } from 'node:crypto';

test('ResearchRunQuery (服務層驗證): 應能成功查回任務摘要', async (t) => {
  const repo = new InMemoryResearchRunRepository();
  const queryService = new ResearchRunQueryService(repo);
  const runId = randomUUID();

  // 1. 手動存入一筆資料
  await repo.save({
    runId,
    tradeDate: '2024-04-03',
    criteria: {},
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
    summary: 'OK'
  }]);

  // 2. 執行查詢
  const summary = await queryService.getLatestRunSummary();
  
  assert.ok(summary);
  assert.strictEqual(summary?.run.runId, runId);
  assert.strictEqual(summary?.results.length, 1);
  assert.strictEqual(summary?.results[0].stockId, '2330');
});
