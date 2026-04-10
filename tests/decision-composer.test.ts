import test from 'node:test';
import assert from 'node:assert/strict';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';
import { RuleResult } from '../src/core/types/rule.js';

test('DecisionComposer (決策合成驗證): 應正確處理衝突與特殊狀態', (t) => {
  const composer = new DecisionComposer();
  const stockId = '2330';
  const asOf = '2024-04-03';

  // 1. 測試 BUY/SELL 衝突 (研究模式 !hasPosition)
  const conflictResults: RuleResult[] = [
    { ruleId: 'r1', ruleName: '多頭排列', category: 'entry', action: 'BUY', triggered: true, severity: 'info', reason: 'ok' },
    { ruleId: 'r2', ruleName: '乖離過高', category: 'exit', action: 'SELL', triggered: true, severity: 'warning', reason: 'high' }
  ];
  const conflictDecision = composer.compose({ stockId, asOf, ruleResults: conflictResults, thesisStatus: 'active', hasPosition: false });
  assert.strictEqual(conflictDecision.action, 'BLOCK', '研究模式下 SELL 應轉換為 BLOCK');
  assert.ok(conflictDecision.confidence < 0.6, '衝突應導致信心度下降');

  // 1.1 測試 BUY/SELL 衝突 (持倉模式 hasPosition)
  const positionDecision = composer.compose({ stockId, asOf, ruleResults: conflictResults, thesisStatus: 'active', hasPosition: true });
  assert.strictEqual(positionDecision.action, 'SELL', '持倉模式下應保留 SELL');

  // 2. 測試 thesisStatus = none
  const noThesisDecision = composer.compose({ stockId, asOf, ruleResults: [], thesisStatus: 'none' });
  assert.strictEqual(noThesisDecision.confidence, 0.4, '無論點時基礎信心度應為 0.4');
  assert.ok(noThesisDecision.summary.includes('[無論點支撐]'));

  // 3. 測試 broken -> BLOCK/EXIT 強制覆寫
  const brokenResults: RuleResult[] = [
    { ruleId: 'r1', ruleName: '強勢買入', category: 'entry', action: 'BUY', triggered: true, severity: 'info', reason: 'ok' }
  ];
  const brokenDecisionResearch = composer.compose({ stockId, asOf, ruleResults: brokenResults, thesisStatus: 'broken', hasPosition: false });
  assert.strictEqual(brokenDecisionResearch.action, 'BLOCK', '研究模式下論點破壞應強制 BLOCK');

  const brokenDecisionPosition = composer.compose({ stockId, asOf, ruleResults: brokenResults, thesisStatus: 'broken', hasPosition: true });
  assert.strictEqual(brokenDecisionPosition.action, 'EXIT', '持倉模式下論點破壞應強制 EXIT');
});
