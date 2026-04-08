import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchReportGenerator } from '../src/modules/reporting/CandidateResearchReportGenerator.js';

test('CandidateResearchReportGenerator: 應能產出正確的 Markdown 表格與 JSON 摘要', (t) => {
  const generator = new CandidateResearchReportGenerator();
  const mockResults: any[] = [
    {
      stockId: '2330',
      tradeDate: '2024-04-03',
      preliminaryScore: 80,
      featureSnapshot: { payload: { totalScore: 85 } },
      finalDecision: { action: 'BUY', confidence: 0.9, summary: 'Good' },
      thesisStatus: 'met'
    }
  ];

  const md = generator.buildMarkdownTable(mockResults);
  assert.ok(md.includes('# 候選池研究綜整報告'));
  assert.ok(md.includes('2330'));
  assert.ok(md.includes('80'));
  assert.ok(md.includes('85'));
  assert.ok(md.includes('BUY'));

  const json = generator.buildSummaryJson(mockResults);
  assert.strictEqual(json[0].stockId, '2330');
  assert.strictEqual(json[0].action, 'BUY');
});
