import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceReportGenerator } from '../src/modules/reporting/PerformanceReportGenerator.js';

test('PerformanceReportGenerator: 應正確格式化 Markdown 報表', (t) => {
  const generator = new PerformanceReportGenerator();
  const runId = 'test-run-md';
  const stats = {
    totalCount: 10,
    correctDirectionCount: 7,
    accuracy: 0.7,
    averageReturn5D: 0.025
  };
  const actionBreakdown = [
    { action: 'BUY', count: 6, accuracy: 0.8, avgReturn: 0.04 },
    { action: 'SELL', count: 4, accuracy: 0.55, avgReturn: 0.002 }
  ];
  const ruleBreakdown = [
    { ruleId: 'rule-1', hitCount: 5, correctCount: 4, accuracy: 0.8, avgReturn: 0.05 }
  ];
  const thesisBreakdown = [
    { status: 'thesis_met', count: 8, accuracy: 0.75, avgReturn: 0.03 }
  ];

  const report = generator.buildPerformanceMarkdown(runId, stats, actionBreakdown, ruleBreakdown, thesisBreakdown);

  // 驗證標題與關鍵數據
  assert.ok(report.includes('# 研究任務成效分析報告'));
  assert.ok(report.includes('70.0%'));
  assert.ok(report.includes('2.50%'));
  
  // 驗證動作拆解表格
  assert.ok(report.includes('## 2. 決策動作拆解'));
  assert.ok(report.includes('BUY'));
  assert.ok(report.includes('80.0%'));
  
  // 驗證規則拆解表格
  assert.ok(report.includes('## 3. 判斷規則 (Rules) 成效'));
  assert.ok(report.includes('`rule-1`'));
  
  // 驗證論點拆解表格
  assert.ok(report.includes('## 4. 論點狀態 (Thesis) 成效'));
});