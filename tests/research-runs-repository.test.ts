import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresResearchRunRepository } from '../src/modules/storage/PostgresRepositories.js';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';
import { randomUUID } from 'node:crypto';

test('ResearchRun Repository (全功能驗證): 應正確執行寫入、狀態更新與多維度查詢', async (t) => {
  const sql = createSqlContext();
  const repo = new PostgresResearchRunRepository(sql);
  const runId = randomUUID();
  const tradeDate = '2024-04-03';

  try {
    // 1. 測試 save()
    await repo.save({
      runId,
      tradeDate,
      criteria: { minVolume: 2000 },
      topN: 5,
      accountTier: 'free',
      status: 'running'
    });

    // 2. 測試 updateStatus()
    await repo.updateStatus(runId, 'completed');

    // 3. 測試 saveResults()
    const mockResults = [
      {
        runId,
        stockId: '2330',
        preliminaryScore: 80,
        researchTotalScore: 85,
        finalAction: 'BUY',
        confidence: 0.9,
        summary: '優質股'
      }
    ];
    await repo.saveResults(mockResults);

    // 4. 驗證 getLatestRun()
    const latest = await repo.getLatestRun();
    assert.ok(latest, '應能查到最近一筆');
    assert.strictEqual(latest?.runId, runId);

    // 5. 驗證 findRunsByDate()
    const runsOnDate = await repo.findRunsByDate(tradeDate);
    assert.ok(runsOnDate.length > 0);
    // 將 Date 物件轉為 YYYY-MM-DD 字串再比較
    const actualDate = new Date(runsOnDate[0].tradeDate).toISOString().split('T')[0];
    assert.strictEqual(actualDate, tradeDate);

    // 6. 驗證 getRunResults()
    const results = await repo.getRunResults(runId);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].stockId, '2330');
    assert.strictEqual(Number(results[0].researchTotalScore), 85);

    console.log(`[SmokeTest] ResearchRun Repository 所有方法驗證成功 (RunId: ${runId})`);

  } catch (error) {
    console.error('[SmokeTest] Repository 驗證失敗:', error);
    throw error;
  } finally {
    await sql.end();
  }
});
