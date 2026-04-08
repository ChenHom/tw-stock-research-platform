import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchInsightsService } from '../src/app/services/ResearchInsightsService.js';

test('ResearchInsightsService: 應能根據績效數據產出優化建議', (t) => {
  const service = new ResearchInsightsService();
  const runId = 'test-run-insight';
  
  const stats = { totalCount: 10, correctDirectionCount: 6, accuracy: 0.6, averageReturn5D: 0.02 };
  const actionBreakdown = [
    { action: 'BUY', count: 6, accuracy: 0.4, avgReturn: -0.01 }, 
    { action: 'SELL', count: 4, accuracy: 0.9, avgReturn: 0.05 }
  ];
  const ruleBreakdown = [
    { ruleId: 'rule-high', hitCount: 5, correctCount: 5, accuracy: 1.0, avgReturn: 0.08 },
    { ruleId: 'rule-low', hitCount: 4, correctCount: 1, accuracy: 0.25, avgReturn: -0.03 } 
  ];
  const thesisBreakdown = [
    { status: 'thesis_met', count: 8, accuracy: 0.45, avgReturn: 0.01 } 
  ];

  const insights = service.analyze(runId, stats, actionBreakdown, ruleBreakdown, thesisBreakdown);

  assert.strictEqual(insights.topEffectiveRules[0].ruleId, 'rule-high');
  assert.strictEqual(insights.lowEffectiveRules[0].ruleId, 'rule-low');

  const ruleSuggestion = insights.optimizationSuggestions.find(s => s.type === 'RULE');
  assert.ok(ruleSuggestion);
  assert.strictEqual(ruleSuggestion?.id, 'rule-low');
});