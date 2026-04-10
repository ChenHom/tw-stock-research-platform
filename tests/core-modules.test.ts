import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDatasetRouter } from '../src/modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../src/modules/budget/RateBudgetGuard.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../src/modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule } from '../src/modules/rules/RiskRules.js';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';
import { BaseRule } from '../src/core/contracts/rule.js';
import { RuleContext, RuleResult } from '../src/core/types/rule.js';

// 1. 測試 DatasetRouter 與 RateBudgetGuard 整合
test('DatasetRouter: 應能根據 Budget 狀態執行降級與攔截', (t) => {
  const router = new DefaultDatasetRouter();
  const guard = new RateBudgetGuard(0.8, 0.95);
  
  // 正常狀態
  const normalBudget = guard.evaluate('finmind', 100, 1000);
  const normalDecision = router.decide('month_revenue', 'free', normalBudget);
  assert.strictEqual(normalDecision.canProceed, true);
  assert.strictEqual(normalDecision.degradeMode, 'none');

  // 降級狀態 (85% 使用率)
  const degradeBudget = guard.evaluate('finmind', 850, 1000);
  const degradeDecision = router.decide('month_revenue', 'free', degradeBudget);
  assert.strictEqual(degradeDecision.degradeMode, 'watchlist_only');
  
  // 攔截狀態 (98% 使用率)
  const haltBudget = guard.evaluate('finmind', 980, 1000);
  const haltDecision = router.decide('market_daily_latest', 'free', haltBudget);
  assert.strictEqual(haltDecision.degradeMode, 'official_only');
  // 因為 market_daily_latest 包含 twse，在攔截 FinMind 後應保留 twse
  assert.strictEqual(haltDecision.finalProviderOrder.includes('twse'), true);
});

// 2. 測試 RuleEngine 的 Phase 與 Priority 順序
test('RuleEngine: 應按 Filter -> Risk -> Others 順序執行且支援熔斷', async (t) => {
  const registry = new DefaultRuleRegistry();
  const executionOrder: string[] = [];

  // 建立 Mock 規則來紀錄執行順序
  const createMockRule = (id: string, category: any, priority: number, action: any = 'NO_ACTION', severity: any = 'info'): BaseRule => ({
    id, name: id, category, priority, tags: [],
    supports: () => true,
    evaluate: async () => {
      executionOrder.push(id);
      return { ruleId: id, ruleName: id, category, action, triggered: action !== 'NO_ACTION', severity, reason: 'test' };
    }
  });

  registry.register(createMockRule('risk_high', 'risk', 10));
  registry.register(createMockRule('filter_1', 'filter', 5));
  registry.register(createMockRule('entry_1', 'entry', 100));
  registry.register(createMockRule('risk_low', 'risk', 20));

  const engine = new DefaultRuleEngine(registry);
  const context: any = { features: {} };
  
  await engine.evaluate(context);

  // 驗證順序：Filter 階段最先 (即使 Priority 較低)，然後 Risk，最後 Entry
  assert.deepStrictEqual(executionOrder, ['filter_1', 'risk_high', 'risk_low', 'entry_1']);

  // 測試熔斷 (Critical Risk)
  executionOrder.length = 0;
  const registry2 = new DefaultRuleRegistry();
  registry2.register(createMockRule('critical_risk', 'risk', 1, 'EXIT', 'critical'));
  registry2.register(createMockRule('should_not_run', 'entry', 100));
  
  const engine2 = new DefaultRuleEngine(registry2);
  await engine2.evaluate(context);
  
  assert.deepStrictEqual(executionOrder, ['critical_risk'], '發生 Critical Risk 時應熔斷');
});

// 3. 測試 DecisionComposer 的權重與衝突處理
test('DecisionComposer: 應能處理買賣衝突並調整信心度', (t) => {
  const composer = new DecisionComposer();
  
  const results: RuleResult[] = [
    { ruleId: 'r1', ruleName: 'R1', category: 'entry', action: 'BUY', triggered: true, severity: 'info', reason: 'ok' },
    { ruleId: 'r2', ruleName: 'R2', category: 'exit', action: 'TRIM', triggered: true, severity: 'warning', reason: 'ok' }
  ];

  const decision = composer.compose({
    stockId: '2330',
    asOf: '2026-04-06',
    ruleResults: results,
    thesisStatus: 'active',
    hasPosition: true
  });

  // 由於 TRIM (80) 優先於 BUY (60)，最終動作應為 TRIM
  assert.strictEqual(decision.action, 'TRIM');
  // 由於存在衝突，信心度應較低
  assert.ok(decision.confidence < 0.6, '衝突時信心度應下降');
  assert.ok(decision.summary.includes('衝突'), '摘要應包含衝突警告');
});
