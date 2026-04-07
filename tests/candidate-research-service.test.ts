import test from 'node:test';
import assert from 'node:assert/strict';
import { CandidateResearchService, CandidateResearchResult } from '../src/app/services/CandidateResearchService.js';

test('CandidateResearchService (核心鏈路驗證): 應正確執行 TopN、錯誤容錯與計分排序', async (t) => {
  // 1. Mock ScreeningService (回傳 3 檔)
  const mockScreeningService: any = {
    screen: async () => [
      { stockId: '2330', preliminaryScore: 80 },
      { stockId: '2317', preliminaryScore: 70 },
      { stockId: 'FAIL_STOCK', preliminaryScore: 60 }
    ]
  };

  // 2. Mock ResearchPipelineService (模擬一檔失敗，兩檔成功且分數不同)
  const mockPipeline: any = {
    run: async (input: { stockId: string }) => {
      if (input.stockId === 'FAIL_STOCK') throw new Error('網路超時');
      
      const scores: Record<string, number> = {
        '2330': 50,
        '2317': 90 // 2317 雖然初篩分低，但研究總分高，應排第一
      };
      return {
        stockId: input.stockId,
        featureSnapshot: { payload: { totalScore: scores[input.stockId] } },
        finalDecision: { action: 'BUY', confidence: 0.8, summary: 'OK' }
      };
    }
  };

  const service = new CandidateResearchService(mockScreeningService, mockPipeline);

  // 3. 執行測試：取前 3 檔 (TopN=3)
  const results = await service.run({ 
    criteria: {}, 
    tradeDate: '2024-04-03',
    topN: 3 
  });

  // 4. 驗證 4 大核心點
  assert.strictEqual(results.length, 2, 'FAIL_STOCK 失敗後應保留其餘 2 檔 (容錯驗證)');
  assert.strictEqual(results[0].stockId, '2317', '應依研究後 totalScore 排序 (排序驗證)');
  assert.strictEqual(results[0].preliminaryScore, 70, '應保留原始初篩分 (資料保留驗證)');
  assert.strictEqual(results[1].stockId, '2330', '2330 應排第二');
  
  // 5. 驗證 TopN 限制
  const top1Result = await service.run({ criteria: {}, tradeDate: '2024-04-03', topN: 1 });
  assert.strictEqual(top1Result.length, 1, 'TopN=1 應只研究 1 檔');
});
