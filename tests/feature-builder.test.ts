import test from 'node:test';
import assert from 'node:assert/strict';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';

test('FeatureBuilder: 應能計算正確的評分與缺失欄位', (t) => {
  const builder = new FeatureBuilder();
  
  // 測試完全缺失狀態
  const emptyInput = { stockId: '2330', tradeDate: '2026-04-06' };
  const emptyResult = builder.build(emptyInput);
  assert.strictEqual(emptyResult.totalScore, 0);
  assert.ok(emptyResult.missingFields.includes('market_daily'));
  assert.ok(emptyResult.missingFields.includes('month_revenue'));

  // 測試具備基本面與估值優勢的狀態
  const goodInput = {
    stockId: '2330',
    tradeDate: '2026-04-06',
    marketDaily: { stockId: '2330', tradeDate: '2026-04-06', close: 100, open: 90, high: 110, low: 80, volume: 1000, turnover: 100000, transactionCount: 100 },
    valuationDaily: { stockId: '2330', tradeDate: '2026-04-06', peRatio: 12, pbRatio: 1.5, dividendYield: 4 },
    monthRevenue: { stockId: '2330', yearMonth: '2026-03', revenue: 500, revenueYoy: 0.25, revenueMom: 0.1 },
    history: [
      { close: 90, volume: 500 }, { close: 92, volume: 600 } // 用於測試均線計算
    ]
  };

  const goodResult = builder.build(goodInput as any);
  
  // 12 PE (<15) +10分
  // 25% Revenue YoY (>20%) +30分
  // Close 100 > MA20 (假設均線計算正確) +15分
  assert.ok(goodResult.totalScore >= 40, `總分應反映基本面優勢, got ${goodResult.totalScore}`);
  assert.strictEqual(goodResult.missingFields.includes('institutional_flow'), true, '應標示缺失籌碼資料');
});
