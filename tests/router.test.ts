import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDatasetRouter } from '../src/modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../src/modules/budget/RateBudgetGuard.js';

test('Router (固定基準驗證): 應正確處理不同等級權限與預算降級行為', (t) => {
  const router = new DefaultDatasetRouter();
  const guard = new RateBudgetGuard(0.8, 0.95);

  // 1. 驗證 Free 模式：應限制為 per_stock
  const freeDecision = router.decide('month_revenue', 'free', undefined, '2330');
  assert.strictEqual(freeDecision.queryMode, 'per_stock', 'Free 模式應為 per_stock');

  // 2. 驗證 Sponsor 模式：應支援 Bulk
  const sponsorDecision = router.decide('month_revenue', 'sponsor');
  assert.strictEqual(sponsorDecision.queryMode, 'bulk', 'Sponsor 模式應支援 bulk');

  // 3. 驗證 Budget Degrade (85% 使用率)：應觸發 watchlist_only 或跳過非必要資料
  const degradeBudget = guard.evaluate('finmind', 850, 1000);
  
  // 測試新聞 (非必要資料)
  const newsDecision = router.decide('stock_news', 'backer', degradeBudget);
  assert.strictEqual(newsDecision.degradeMode, 'skip_non_essential', '預算高時應跳過新聞');
  assert.strictEqual(newsDecision.canProceed, false);

  // 測試營收 (核心資料但預算高)
  const revDecision = router.decide('month_revenue', 'backer', degradeBudget);
  assert.strictEqual(revDecision.degradeMode, 'watchlist_only', '預算高時應僅限 watchlist');

  // 4. 驗證 Budget Halt (98% 使用率)：應強制切換至 official_only
  const haltBudget = guard.evaluate('finmind', 980, 1000);
  const marketDecision = router.decide('market_daily_latest', 'sponsor', haltBudget);
  
  assert.strictEqual(marketDecision.degradeMode, 'official_only', '預算極低時應強制官方源');
  assert.deepStrictEqual(marketDecision.finalProviderOrder, ['twse'], '應只剩下免費官方來源');
});
