import test from 'node:test';
import assert from 'node:assert/strict';
import { TwseOpenApiProvider } from '../src/modules/providers/twse/TwseOpenApiProvider.js';

test('TwseOpenApiProvider: 應正確執行官方資料正規化', (t) => {
  const provider = new TwseOpenApiProvider();
  
  // 1. 測試 STOCK_DAY_ALL 正規化
  const rawMarket = [
    { Code: '2330', OpeningPrice: '100.0', HighestPrice: '105.0', LowestPrice: '98.0', ClosingPrice: '102.5', TradeVolume: '1000000', Transaction: '5000' }
  ];
  const normalizedMarket = (provider as any).normalize('market_daily_latest', rawMarket, '2330', '2024-04-03');
  assert.strictEqual(normalizedMarket[0].close, 102.5);
  assert.strictEqual(normalizedMarket[0].volume, 1000000);
  assert.strictEqual(normalizedMarket[0].transactionCount, 5000);

  // 2. 測試 BWIBYK_ALL (Valuation) 正規化
  const rawValuation = [
    { Code: '2330', PEratio: '15.5', PBratio: '2.3', DividendYield: '3.5' }
  ];
  const normalizedVal = (provider as any).normalize('daily_valuation', rawValuation, '2330', '2024-04-03');
  assert.strictEqual(normalizedVal[0].peRatio, 15.5);
  assert.strictEqual(normalizedVal[0].pbRatio, 2.3);
  assert.strictEqual(normalizedVal[0].dividendYield, 3.5);
});
