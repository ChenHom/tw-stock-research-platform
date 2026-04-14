import test from 'node:test';
import assert from 'node:assert/strict';
import { InsightsReportGenerator } from '../src/modules/reporting/InsightsReportGenerator.js';

test('InsightsReportGenerator: 應正確格式化優化建議 Markdown 報表', (t) => {
  const generator = new InsightsReportGenerator();
  
  const mockInsights: any = {
    runId: 'test-run-report',
    sampleAssessment: {
      stage: 'observation',
      message: '可做 early observation',
      evaluableCount: 12,
      coverage: 0.8
    },
    topEffectiveRules: [{ ruleId: 'rule-high', accuracy: 0.9, hitCount: 10, evaluableCount: 10, confidenceLevel: 'Medium' }],
    lowEffectiveRules: [{ ruleId: 'rule-low', accuracy: 0.2, hitCount: 5, evaluableCount: 5, confidenceLevel: 'Low' }],
    thesisPerformance: [{ status: 'thesis_met', accuracy: 0.45, count: 15, evaluableCount: 15, confidenceLevel: 'Medium' }],
    actionPerformance: [{ action: 'BUY', accuracy: 0.4, count: 10, evaluableCount: 10, confidenceLevel: 'Medium' }],
    optimizationSuggestions: [{
      type: 'RULE',
      id: 'rule-low',
      finding: '規則命中率低',
      recommendation: '建議降權',
      severity: 'high'
    }]
  };

  const report = generator.buildInsightsMarkdown(mockInsights);

  assert.ok(report.includes('# 🧠 研究任務優化建議報告'));
  assert.ok(report.includes('rule-high'));
  assert.ok(report.includes('90.0%'));
  assert.ok(report.includes('Medium'));
  assert.ok(report.includes('🔴 **[高風險]**'));
});
