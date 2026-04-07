import test from 'node:test';
import assert from 'node:assert/strict';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';

test('FeatureBuilder (可信度驗證): 應正確計算歷史序列與財報 TTM', (t) => {
  const builder = new FeatureBuilder();
  
  // 1. 建立 20 日真實價格序列 (由 100 漲到 119)
  const history = Array.from({ length: 20 }, (_, i) => ({
    close: 100 + i,
    volume: 1000
  }));

  // 2. 建立 4 季財報序列 (每季 EPS = 2.0)
  const financials = [
    { date: '2023-12-31', eps: 2.0 },
    { date: '2023-09-30', eps: 2.0 },
    { date: '2023-06-30', eps: 2.0 },
    { date: '2023-03-31', eps: 2.0 }
  ];

  const input = {
    stockId: '2330',
    tradeDate: '2024-04-03',
    marketDaily: { close: 120, volume: 2000 },
    history,
    financialStatements: financials
  };

  const result = builder.build(input as any);
  
  // 驗證 MA20: (100 + 119) / 2 = 109.5
  assert.strictEqual(result.ma20, 109.5);
  // 驗證 EPS TTM: 2.0 * 4 = 8.0
  assert.strictEqual(result.epsTtm, 8.0);
  // 驗證乖離率: ((120 - 109.5) / 109.5) * 100 = 9.589...
  assert.ok(result.bias20 > 9.5 && result.bias20 < 9.6);
  // 驗證總分: 
  // Close > MA20 (+15)
  // Vol > VolMA (+10)
  // News Neutral (+5)
  // EPS TTM 無加分 (門檻 20)
  assert.strictEqual(result.totalScore, 30);
});
