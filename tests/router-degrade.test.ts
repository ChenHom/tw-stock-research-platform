import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDatasetRouter } from '../src/modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../src/modules/budget/RateBudgetGuard.js';

test('Router Degrade (路由降級驗證): 不同等級與預算狀態下的調度行為', (t) => {
  const router = new DefaultDatasetRouter();
  const guard = new RateBudgetGuard(0.8, 0.95);

  // 1. 測試 Sponsor 等級 (應不受限制)
  const sponsorDecision = router.decide('month_revenue', 'sponsor');
  assert.strictEqual(sponsorDecision.queryMode, 'bulk', 'Sponsor 應支援 Bulk');

  // 2. 測試 Free 等級 (應限制為 per_stock)
  const freeDecision = router.decide('month_revenue', 'free');
  assert.strictEqual(freeDecision.queryMode, 'per_stock', 'Free 應限制為 per_stock');

  // 3. 測試 預算進入降級區間 (85% 使用率)
  const degradeBudget = guard.evaluate('finmind', 850, 1000);
  const degradeDecision = router.decide('month_revenue', 'backer', degradeBudget);
  assert.strictEqual(degradeDecision.degradeMode, 'watchlist_only', '預算高時應僅限 watchlist');

  // 4. 測試 預算進入攔截區間 (98% 使用率)
  const haltBudget = guard.evaluate('finmind', 980, 1000);
  const haltDecision = router.decide('market_daily_latest', 'sponsor', haltBudget);
  assert.strictEqual(haltDecision.degradeMode, 'official_only', '預算極低時應僅保留官方源');
  assert.ok(haltDecision.finalProviderOrder.includes('twse'));
  assert.ok(!haltDecision.finalProviderOrder.includes('finmind'), '應移除收費源');
});
