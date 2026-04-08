import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresResearchRunRepository, PostgresFeatureSnapshotRepository } from '../src/modules/storage/PostgresRepositories.js';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';
import { randomUUID } from 'node:crypto';

test('Postgres Repositories (嚴格驗證): 應能成功寫入並讀回研究結果', async (t) => {
  const sql = createSqlContext();
  const runRepo = new PostgresResearchRunRepository(sql);
  const featureRepo = new PostgresFeatureSnapshotRepository(sql);

  const runId = randomUUID();
  const stockId = '2330';

  try {
    // 1. 測試儲存 Run
    await runRepo.save({
      runId,
      tradeDate: '2024-04-03',
      criteria: { test: true },
      topN: 1,
      accountTier: 'free',
      status: 'running',
      startedAt: new Date()
    });

    // 2. 測試儲存 Feature Snapshot (UUID 型別)
    const snapshotId = randomUUID();
    await featureRepo.save({
      id: snapshotId,
      stockId,
      snapshotAt: new Date(),
      featureSetVersion: '1.0.0',
      payload: { totalScore: 85 }
    });

    // 3. 測試儲存 Results
    await runRepo.saveResults([{
      runId,
      stockId,
      preliminaryScore: 80,
      researchTotalScore: 85,
      finalAction: 'BUY',
      confidence: 0.9,
      summary: 'Test',
      ruleResults: [],
      thesisStatus: 'met'
    }]);

    // 4. 讀回驗證
    const results = await runRepo.getRunResults(runId);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].stockId, stockId);
    assert.strictEqual(Number(results[0].researchTotalScore), 85);

    console.log('[SmokeTest] Postgres 儲存驗證成功。');

  } catch (error) {
    console.error('[SmokeTest] 資料庫測試失敗，任務終止:', error);
    throw error;
  } finally {
    await sql.end();
  }
});
