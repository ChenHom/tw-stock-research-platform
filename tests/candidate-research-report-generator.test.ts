import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchReportGenerator } from '../src/modules/reporting/CandidateResearchReportGenerator.js';
import { CandidateResearchResult } from '../src/app/services/CandidateResearchService.js';

test('CandidateResearchReportGenerator: 應能產出正確的 Markdown 表格與 JSON 摘要', (t) => {
  const generator = new CandidateResearchReportGenerator();
  
  const mockResults: CandidateResearchResult[] = [
    {
      stockId: '2330',
      preliminaryScore: 80,
      research: {
        stockId: '2330',
        tradeDate: '2024-04-03',
        featureSnapshot: { payload: { totalScore: 85 } },
        finalDecision: { action: 'BUY', confidence: 0.9, summary: '強勢成長' }
      } as any
    }
  ];

  // 1. 驗證 Markdown 格式
  const md = generator.buildMarkdownTable(mockResults);
  assert.ok(md.includes('| 排名 | 代號 | 初篩分 | 研究總分 |'), '表格標題應完整');
  assert.ok(md.includes('| 1 | 2330 | 80 | 85 | **BUY** | 90% |'), '表格資料行內容應正確');

  // 2. 驗證 JSON 結構
  const json = generator.buildSummaryJson(mockResults);
  assert.strictEqual(json.length, 1);
  assert.strictEqual(json[0].stockId, '2330');
  assert.strictEqual(json[0].scores.research, 85);
  assert.strictEqual(json[0].decision.action, 'BUY');
});
