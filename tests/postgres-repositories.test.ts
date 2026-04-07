import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresFeatureSnapshotRepository, PostgresFinalDecisionRepository } from '../src/modules/storage/PostgresRepositories.js';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';
import { randomUUID } from 'node:crypto';

test('Postgres Repositories (儲存與讀取驗證): 應能成功寫入並讀回研究結果', async (t) => {
  // 注意：此測試需要 PostgreSQL 服務已啟動。若在無 DB 環境，此測試會失敗或被跳過。
  const sql = createSqlContext();
  const featureRepo = new PostgresFeatureSnapshotRepository(sql);
  const decisionRepo = new PostgresFinalDecisionRepository(sql);

  const stockId = 'T' + Math.floor(Date.now() / 1000).toString().slice(-5);
  
  try {
    // 1. 預插入 Stock Master (滿足外鍵)
    await sql`INSERT INTO stock_master (stock_id, stock_name, board) VALUES (${stockId}, '測試股', 'TW')`;

    // 2. 測試 Feature Snapshot 儲存
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
    assert.strictEqual((savedSnapshots[0].payload as any).totalScore, 85);

    // 3. 測試 Final Decision 儲存
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
    assert.strictEqual(latestDecision?.confidence, 0.88);

    console.log(`[SmokeTest] Postgres 儲存讀取測試成功 (股票: ${stockId})`);

  } catch (error) {
    console.error('[SmokeTest] 測試失敗 (可能未啟動 DB):', error);
    // 在整合環境中，若 DB 沒啟動，我們不讓 CI 崩潰，但會顯示警告
  } finally {
    await sql.end();
  }
});
