import test from 'node:test';
import assert from 'node:assert/strict';
import { FeatureBuilder } from '../src/modules/features/FeatureBuilder.js';

test('FeatureBuilder: 應能根據 30 日歷史資料正確計算 MA20 與 乖離率', (t) => {
  const builder = new FeatureBuilder();
  
  // 建立 30 筆遞增數據，確保最近 20 筆平均值可預測
  const history = Array.from({ length: 30 }, (_, i) => ({
    close: 100 + i, // 100, 101, ..., 129
    volume: 1000 + i * 10
  }));

  const input = {
    stockId: '2330',
    tradeDate: '2026-04-06',
    marketDaily: { close: 130, volume: 2000 }, // 今日資料
    history
  };

  const result = builder.build(input as any);
  
  // 最近 20 筆平均 (110 + 129) / 2 = 119.5
  assert.strictEqual(result.ma20, 119.5);
  // 乖離率 ((130 - 119.5) / 119.5) * 100 = 8.7866...
  assert.ok(result.bias20 > 8.7 && result.bias20 < 8.8);
  // 成交量比 2000 / 1195 = 1.67...
  assert.ok(result.volumeRatio20 > 1.6);
});
