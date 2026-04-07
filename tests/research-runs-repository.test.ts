import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresResearchRunRepository } from '../src/modules/storage/PostgresRepositories.js';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';
import { randomUUID } from 'node:crypto';

test('ResearchRun Repository (任務層級驗證): 應正確記錄研究任務與候選池結果', async (t) => {
  const sql = createSqlContext();
  const runRepo = new PostgresResearchRunRepository(sql);
  const runId = randomUUID();

  try {
    // 1. 測試 Run Head 儲存
    await runRepo.save({
      runId,
      tradeDate: '2024-04-03',
      criteria: { minVolume: 1000 },
      topN: 5,
      accountTier: 'free',
      status: 'running'
    });

    // 2. 測試 Results 批次儲存
    const mockResults = [
      {
        runId,
        stockId: '2330',
        preliminaryScore: 80,
        researchTotalScore: 85,
        finalAction: 'BUY',
        confidence: 0.9,
        summary: '強勢股'
      }
    ];
    await runRepo.saveResults(mockResults);

    // 3. 測試狀態更新 (含 completed_at)
    await runRepo.updateStatus(runId, 'completed');

    // 4. 讀回驗證
    const [run] = await sql`SELECT status, completed_at FROM research_runs WHERE run_id = ${runId}`;
    assert.strictEqual(run.status, 'completed');
    assert.ok(run.completed_at !== null, 'completed_at 應已填寫');

    const [result] = await sql`SELECT research_total_score FROM candidate_research_results WHERE run_id = ${runId}`;
    assert.strictEqual(Number(result.research_total_score), 85);

    console.log('[SmokeTest] ResearchRun 任務層級儲存驗證成功。');

  } catch (error) {
    throw error;
  } finally {
    await sql.end();
  }
});
