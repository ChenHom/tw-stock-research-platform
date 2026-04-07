import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchService } from '../src/app/services/CandidateResearchService.js';

test('CandidateResearchService: 應能串接篩選與研究流程，並具備錯誤容錯與排序能力', async (t) => {
  // 1. Mock ScreeningService (回傳 3 檔)
  const mockScreeningService: any = {
    screen: async () => [
      { stockId: '2330', preliminaryScore: 80 },
      { stockId: '2317', preliminaryScore: 70 },
      { stockId: 'FAIL_STOCK', preliminaryScore: 60 }
    ]
  };

  // 2. Mock ResearchPipelineService
  const mockPipeline: any = {
    run: async (input: { stockId: string }) => {
      if (input.stockId === 'FAIL_STOCK') throw new Error('研究失敗');
      
      const scores: Record<string, number> = {
        '2330': 50,
        '2317': 90 // 總分最高
      };
      return {
        stockId: input.stockId,
        featureSnapshot: { payload: { totalScore: scores[input.stockId] } },
        finalDecision: { action: 'BUY', confidence: 0.8, summary: 'OK' }
      };
    }
  };

  const service = new CandidateResearchService(mockScreeningService, mockPipeline);

  // 3. 執行測試：取前 3 檔研究，預期 FAIL_STOCK 會跳過，剩下 2 檔
  const results = await service.run({ 
    criteria: {}, 
    tradeDate: '2024-04-03',
    topN: 3 
  });

  // 4. 驗證
  assert.strictEqual(results.length, 2, 'FAIL_STOCK 失敗後應保留其餘 2 檔');
  assert.strictEqual(results[0].stockId, '2317', '應依研究總分排序 (2317 最高)');
  assert.strictEqual(results[1].stockId, '2330', '2330 第二');
  assert.strictEqual(results[0].preliminaryScore, 70, '應保留初篩分');
  assert.strictEqual(results[0].research.featureSnapshot.payload.totalScore, 90, '應保留研究分');
});
