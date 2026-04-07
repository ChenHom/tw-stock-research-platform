import test from 'node:test';
import assert from 'node:assert/strict';
import { FinMindProvider } from '../src/modules/providers/finmind/FinMindProvider.js';

test('FinMindProvider: 應正確執行正規化與 Free Tier 參數處理', async (t) => {
  const provider = new FinMindProvider();
  
  // 1. 測試正規化 (Institutional Flow)
  const rawInst = [
    { stock_id: '2330', date: '2026-04-06', name: 'Foreign_Investor', buy: 1000, sell: 500 },
    { stock_id: '2330', date: '2026-04-06', name: 'Investment_Trust', buy: 200, sell: 100 }
  ];
  const normalized = (provider as any).normalize('institutional_flow', rawInst);
  assert.strictEqual(normalized[0].foreignNet, 500);
  assert.strictEqual(normalized[0].trustNet, 100);
  assert.strictEqual(normalized[0].totalNet, 600);

  // 2. 測試正規化 (Month Revenue)
  const rawRevenue = [
    { date: '2025-03-01', stock_id: '2330', revenue_year: 2025, revenue_month: 3, revenue: 80000 },
    { date: '2026-03-01', stock_id: '2330', revenue_year: 2026, revenue_month: 3, revenue: 100000 }
  ];
  const normalizedRev = (provider as any).normalize('month_revenue', rawRevenue);
  // (100000 - 80000) / 80000 = 0.25
  assert.strictEqual(normalizedRev[1].yearMonth, '2026-03');
  assert.strictEqual(normalizedRev[1].revenueYoy, 0.25);
});
