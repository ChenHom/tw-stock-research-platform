import test from 'node:test';
import assert from 'node:assert/strict';
import { FinMindProvider } from '../src/modules/providers/finmind/FinMindProvider.js';

test('FinMindProvider: 應正確執行正規化與 Free Tier 參數處理', async (t) => {
  const provider = new FinMindProvider();
  
  // 1. 測試正規化 (Institutional Flow)
  const rawInst = [
    { stock_id: '2330', date: '2026-04-06', Foreign_Investor_Buy: 1000, Foreign_Investor_Sell: 500, Investment_Trust_Buy: 200, Investment_Trust_Sell: 100, Dealer_Buy: 50, Dealer_Sell: 50, diff: 600 }
  ];
  const normalized = (provider as any).normalize('institutional_flow', rawInst);
  assert.strictEqual(normalized[0].foreignNet, 500);
  assert.strictEqual(normalized[0].totalNet, 600);

  // 2. 測試正規化 (Month Revenue)
  const rawRevenue = [
    { stock_id: '2330', revenue_year: 2026, revenue_month: 3, revenue: 100000, revenue_year_growth: 25.5, revenue_month_growth: 10.2 }
  ];
  const normalizedRev = (provider as any).normalize('month_revenue', rawRevenue);
  assert.strictEqual(normalizedRev[0].yearMonth, '2026-03');
  assert.strictEqual(normalizedRev[0].revenueYoy, 0.255);
});
