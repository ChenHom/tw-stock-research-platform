import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchReportGenerator } from '../src/modules/reporting/CandidateResearchReportGenerator.js';

test('CandidateResearchReportGenerator: 應輸出條件詳解附表', () => {
  const generator = new CandidateResearchReportGenerator();

  const report = generator.buildMarkdownTableFromModels([
    {
      stockId: '2330',
      preliminaryScore: 80,
      totalScore: 88,
      action: 'BUY',
      confidence: 0.82,
      summary: '條件成熟',
      thesisStatus: 'active',
      triggeredConditions: ['總分 >= 70'],
      missingConditions: ['量能比 > 1'],
      blockingConditions: [],
      thesisSignals: ['論點支持: 法人未翻空']
    }
  ], '2026-04-06');

  assert.ok(report.includes('## 條件詳解'));
  assert.ok(report.includes('已達：總分 >= 70'));
  assert.ok(report.includes('未達：量能比 > 1'));
  assert.ok(report.includes('論點：論點支持: 法人未翻空'));
});
