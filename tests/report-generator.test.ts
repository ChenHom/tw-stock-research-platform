import test from 'node:test';
import assert from 'node:assert/strict';
import { ReportGenerator } from '../src/modules/reporting/ReportGenerator.js';

test('ReportGenerator: 應能產出中文化的 Markdown 報告', (t) => {
  const generator = new ReportGenerator();
  
  const featureSet: any = { stockId: '2330', tradeDate: '2026-04-06' };
  const thesis: any = { statement: '營收展望樂觀' };
  const valuation: any = { fairValueBase: 1000 };
  const decision: any = { action: 'BUY', summary: '具備投資價值', confidence: 0.85 };

  const report = generator.buildPositionReport(featureSet, thesis, valuation, decision);

  assert.ok(report.includes('# 個股持股/追蹤報告 - 2330'), '應包含正確標題');
  assert.ok(report.includes('## 投資論點 (Thesis)'), '應包含論點章節');
  assert.ok(report.includes('信心程度: 85.0%'), '應包含正確信心度');
});
