import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchInsightsService } from '../src/app/services/ResearchInsightsService.js';

test('ResearchInsightsService: 應能根據績效數據產出優化建議', (t) => {
  const service = new ResearchInsightsService();
  const runId = 'test-run-insight';
  
  const stats = { totalCount: 20, evaluableCount: 20, correctDirectionCount: 12, accuracy: 0.6, averageReturn5D: 0.02 };
  const actionBreakdown = [
    { action: 'BUY', count: 12, evaluableCount: 12, accuracy: 0.4, avgReturn: -0.01 }, 
    { action: 'SELL', count: 8, evaluableCount: 8, accuracy: 0.9, avgReturn: 0.05 }
  ];
  const ruleBreakdown = [
    { ruleId: 'rule-high', hitCount: 15, evaluableCount: 15, correctCount: 15, accuracy: 1.0, avgReturn: 0.08 },
    { ruleId: 'rule-low', hitCount: 12, evaluableCount: 12, correctCount: 3, accuracy: 0.25, avgReturn: -0.03 } 
  ];
  const thesisBreakdown = [
    { status: 'thesis_met', count: 15, evaluableCount: 15, accuracy: 0.45, avgReturn: 0.01 } 
  ];

  const insights = service.analyze(runId, stats, actionBreakdown, ruleBreakdown, thesisBreakdown);

  assert.strictEqual(insights.topEffectiveRules[0].ruleId, 'rule-high');
  assert.strictEqual(insights.lowEffectiveRules[0].ruleId, 'rule-low');

  const ruleSuggestion = insights.optimizationSuggestions.find(s => s.type === 'RULE');
  assert.ok(ruleSuggestion);
  assert.strictEqual(ruleSuggestion?.id, 'rule-low');
});