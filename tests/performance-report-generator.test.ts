import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceReportGenerator } from '../src/modules/reporting/PerformanceReportGenerator.js';

test('PerformanceReportGenerator: 應正確格式化 Markdown 報表', (t) => {
  const generator = new PerformanceReportGenerator();
  const runId = 'test-run-md';
  const stats = {
    totalCount: 10,
    evaluableCount: 8,
    correctDirectionCount: 7,
    accuracy: 0.7,
    averageReturn5D: 0.025,
    validReturnCount: 8,
    averageBaselineReturn: 0.01,
    averageAlpha: 0.015
  };
  const actionBreakdown = [
    { action: 'BUY', count: 6, evaluableCount: 5, accuracy: 0.8, avgReturn: 0.04 },
    { action: 'SELL', count: 4, evaluableCount: 3, accuracy: 0.55, avgReturn: 0.002 }
  ];
  const ruleBreakdown = [
    { ruleId: 'rule-1', hitCount: 5, evaluableCount: 5, correctCount: 4, accuracy: 0.8, avgReturn: 0.05, consistency: 0.9 }
  ];
  const thesisBreakdown = [
    { status: 'thesis_met', count: 8, evaluableCount: 8, accuracy: 0.75, avgReturn: 0.03, consistency: 0.88 }
  ];

  const report = generator.buildPerformanceMarkdown(runId, stats, actionBreakdown, ruleBreakdown, thesisBreakdown);

  // 驗證標題與關鍵數據
  assert.ok(report.includes('# 研究任務成效分析報告'));
  assert.ok(report.includes('70.0%'), '應包含整體準確率');
  assert.ok(report.includes('2.50%'), '應包含平均報酬率');
  assert.ok(report.includes('80.0%'), '應包含 5D 報酬覆蓋率');
  assert.ok(report.includes('1.00%'), '應包含大盤平均報酬');
  assert.ok(report.includes('1.50%'), '應包含平均 Alpha');
  
  // 驗證動作拆解表格
  assert.ok(report.includes('## 2. 決策動作拆解'));
  assert.ok(report.includes('**BUY**'));
  assert.ok(report.includes('80.0%'));
  assert.ok(report.includes('4.00%'), '應正確格式化 0.04 為 4.00%');
  
  // 驗證規則拆解表格
  assert.ok(report.includes('## 3. 判斷規則 (Rules) 成效'));
  assert.ok(report.includes('`rule-1`'));
  assert.ok(report.includes('5.00%'), '規則報酬應正確格式化');
  assert.ok(report.includes('90%'), '規則穩定度應正確格式化');
  
  // 驗證論點拆解表格
  assert.ok(report.includes('## 4. 論點狀態 (Thesis) 成效'));
  assert.ok(report.includes('**thesis_met**'));
  assert.ok(report.includes('75.0%'));
});
