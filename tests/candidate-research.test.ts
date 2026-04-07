import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchService } from '../src/app/services/CandidateResearchService.js';

test('CandidateResearchService: 應能串接篩選與研究流程並正確排序', async (t) => {
  // 1. Mock ScreeningService
  const mockScreeningService: any = {
    screen: async () => [
      { stockId: '2330', preliminaryScore: 80 },
      { stockId: '2317', preliminaryScore: 70 },
      { stockId: '2454', preliminaryScore: 60 }
    ]
  };

  // 2. Mock ResearchPipelineService
  const mockPipeline: any = {
    run: async (input: { stockId: string }) => {
      const scores: Record<string, number> = {
        '2330': 50,
        '2317': 90, // 研究後分數最高
        '2454': 40
      };
      return {
        stockId: input.stockId,
        featureSnapshot: { payload: { totalScore: scores[input.stockId] } },
        finalDecision: { action: 'BUY', confidence: 0.8 }
      };
    }
  };

  const service = new CandidateResearchService(mockScreeningService, mockPipeline);

  // 3. 執行測試
  const results = await service.run({ 
    criteria: {}, 
    tradeDate: '2024-04-03',
    topN: 2 
  });

  // 4. 驗證
  assert.strictEqual(results.length, 2, '應只研究前 2 檔');
  assert.strictEqual(results[0].stockId, '2317', '第一名應為研究後總分最高的 2317');
  assert.strictEqual(results[1].stockId, '2330', '第二名應為 2330');
  assert.strictEqual(results[0].research.featureSnapshot.payload.totalScore, 90);
});
