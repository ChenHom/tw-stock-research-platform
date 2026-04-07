import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresFeatureSnapshotRepository, PostgresFinalDecisionRepository } from '../src/modules/storage/PostgresRepositories.js';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';
import { randomUUID } from 'node:crypto';

test('Postgres Repositories (嚴格驗證): 應能成功寫入並讀回研究結果', async (t) => {
  const sql = createSqlContext();
  const featureRepo = new PostgresFeatureSnapshotRepository(sql);
  const decisionRepo = new PostgresFinalDecisionRepository(sql);

  const stockId = 'T' + Math.floor(Date.now() / 1000).toString().slice(-5);
  
  try {
    // 1. 預插入 Stock Master (滿足外鍵)
    await sql`INSERT INTO stock_master (stock_id, stock_name, board) VALUES (${stockId}, '測試股', 'TW')`;

    // 2. 測試 Feature Snapshot
    const mockSnapshot = {
      id: randomUUID(),
      stockId,
      snapshotAt: new Date().toISOString(),
      featureSetVersion: '1.0.0',
      payload: { closePrice: 100, totalScore: 85 } as any
    };
    await featureRepo.save(mockSnapshot);
    
    const savedSnapshots = await featureRepo.findByStockId(stockId, 1);
    assert.strictEqual(savedSnapshots.length, 1);
    assert.strictEqual(savedSnapshots[0].stockId, stockId);

    // 3. 測試 Final Decision
    const mockDecision = {
      stockId,
      decisionDate: '2024-04-03',
      action: 'BUY' as any,
      confidence: 0.88,
      summary: '測試決策',
      thesisStatus: 'active' as any,
      supportingRules: ['rule1'],
      blockingRules: [],
      composerVersion: '1.3.1'
    };
    await decisionRepo.save(mockDecision);
    
    const latestDecision = await decisionRepo.getLatest(stockId);
    assert.ok(latestDecision);
    assert.strictEqual(latestDecision?.action, 'BUY');
    // 注意：Postgres NUMERIC 轉 JS 可能為 string 或精度問題，此處使用比較運算
    assert.strictEqual(Number(latestDecision?.confidence), 0.88);

    console.log(`[SmokeTest] Postgres 儲存驗證成功。`);

  } catch (error) {
    console.error('[SmokeTest] 資料庫測試失敗，任務終止:', error);
    // 強制測試失敗 (Fail-fast)
    throw error;
  } finally {
    await sql.end();
  }
});
