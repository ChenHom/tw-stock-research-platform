import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDatasetRouter } from '../src/modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../src/modules/budget/RateBudgetGuard.js';

test('Router (固定基準驗證): 應正確處理等級權限與預算降級', (t) => {
  const router = new DefaultDatasetRouter();
  const guard = new RateBudgetGuard(0.8, 0.95);

  // 1. 驗證 Free 模式
  const free = router.decide('market_daily_history', 'free', undefined, '2330');
  assert.strictEqual(free.queryMode, 'per_stock', 'Free 應限制為 per_stock');

  // 2. 驗證 Sponsor 模式
  const sponsor = router.decide('month_revenue', 'sponsor');
  assert.strictEqual(sponsor.queryMode, 'bulk', 'Sponsor 應支援 Bulk');

  // 3. 驗證 Budget Degrade (85% 使用率)
  const degradeBudget = guard.evaluate('finmind', 850, 1000);
  
  // 3.1 測試新聞 -> 應跳過 (skip_non_essential)
  const newsDec = router.decide('stock_news', 'backer', degradeBudget);
  assert.strictEqual(newsDec.degradeMode, 'skip_non_essential');
  assert.strictEqual(newsDec.canProceed, false);

  // 3.2 測試營收 -> 應進入 watchlist_only
  const revDec = router.decide('month_revenue', 'backer', degradeBudget);
  assert.strictEqual(revDec.degradeMode, 'watchlist_only');

  // 4. 驗證 Budget Halt (98% 使用率) -> 應僅保留 official_only (TWSE)
  const haltBudget = guard.evaluate('finmind', 980, 1000);
  const marketDec = router.decide('market_daily_latest', 'sponsor', haltBudget);
  assert.strictEqual(marketDec.degradeMode, 'official_only');
  assert.deepStrictEqual(marketDec.finalProviderOrder, ['twse'], '應只剩下官方免費源');
});
