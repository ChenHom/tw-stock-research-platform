import test from 'node:test';
import assert from 'node:assert/strict';
import { ThesisTracker } from '../src/modules/research/ThesisTracker.js';

test('ThesisTracker: 應能建立與更新版本，並正確評估狀態', (t) => {
  const tracker = new ThesisTracker();
  
  // 1. 建立初始版本
  const initial = tracker.createThesis({
    stockId: '2330',
    statement: '營收加速成長',
    direction: 'long',
    evidence: [
      { type: 'feature_snapshot', refId: 'feat_1', pillarKey: 'revenueAcceleration', polarity: 'support', comparison: 'eq_true' }
    ]
  });

  assert.strictEqual(initial.version, 1);
  assert.strictEqual(initial.status, 'active');

  // 2. 更新版本
  const updated = tracker.appendVersion(initial, { convictionScore: 80 });
  assert.strictEqual(updated.thesisId, initial.thesisId, 'thesisId 應保持一致');
  assert.strictEqual(updated.version, 2);
  assert.strictEqual(updated.convictionScore, 80);

  // 3. 評估狀態 - 正常
  const contextNormal: any = { features: { revenueAcceleration: true } };
  assert.strictEqual(tracker.evaluateStatus(updated, contextNormal), 'active');

  // 4. 評估狀態 - 論點破壞
  const contextBroken: any = { features: { revenueAcceleration: false } };
  assert.strictEqual(tracker.evaluateStatus(updated, contextBroken), 'weakened', '單項支持失效應為 weakened');
});
