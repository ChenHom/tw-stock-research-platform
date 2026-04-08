import test from 'node:test';
import assert from 'node:assert/strict';
import { TwseOpenApiProvider } from '../src/modules/providers/twse/TwseOpenApiProvider.js';

test('TwseOpenApiProvider: 應正確處理包含逗號的數字與日期', async (t) => {
  const provider = new TwseOpenApiProvider();
  
  // 模擬 STOCK_DAY_ALL 資料 (包含逗號)
  const mockRawMarket = [
    {
      Code: '2330',
      OpeningPrice: '600.00',
      HighestPrice: '610.00',
      LowestPrice: '595.00',
      ClosingPrice: '605.00',
      TradeVolume: '1,234,567',
      TradeValue: '746,913,035',
      Transaction: '5,678'
    }
  ];

  const normalized = (provider as any).normalize('market_daily_latest', mockRawMarket, undefined, '2024-04-03');
  
  assert.strictEqual(normalized[0].stockId, '2330');
  assert.strictEqual(normalized[0].close, 605);
  assert.strictEqual(normalized[0].volume, 1234567);
  assert.strictEqual(normalized[0].transactionCount, 5678);
});

test('TwseOpenApiProvider: 應正確執行估值資料正規化', async (t) => {
  const provider = new TwseOpenApiProvider();
  
  // 模擬 BWIBYK_ALL 資料
  const mockRawValuation = [
    {
      Code: '2330',
      PEratio: '15.50',
      PBratio: '2.30',
      DividendYield: '3.50'
    }
  ];

  const normalized = (provider as any).normalize('daily_valuation', mockRawValuation, undefined, '2024-04-03');
  
  assert.strictEqual(normalized[0].peRatio, 15.5);
  assert.strictEqual(normalized[0].pbRatio, 2.3);
  assert.strictEqual(normalized[0].dividendYield, 3.5);
});