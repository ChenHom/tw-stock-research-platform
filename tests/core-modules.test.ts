import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDatasetRouter } from '../src/modules/router/DatasetRouter.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../src/modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule } from '../src/modules/rules/RiskRules.js';
import { DecisionComposer } from '../src/modules/research/DecisionComposer.js';

// 1. 測試 DatasetRouter 的成本預估與路由
test('DatasetRouter: 應能正確預估 FinMind 點數消耗並選擇 Provider', (t) => {
  const router = new DefaultDatasetRouter();
  
  // 測試 Free 帳號單檔查詢
  const freePerStock = router.decide('month_revenue', 'free', '2330');
  assert.strictEqual(freePerStock.queryMode, 'per_stock');
  assert.ok(freePerStock.reason.includes('estCost=2'), '應預估消耗 2 點');

  // 測試 Backer 帳號 Bulk 查詢
  const backerBulk = router.decide('month_revenue', 'backer', '2330');
  assert.strictEqual(backerBulk.queryMode, 'bulk');
  assert.ok(backerBulk.reason.includes('estCost=100'), '應預估消耗 100 點 (2 * 50)');
});

// 2. 測試 RuleEngine 與 RiskRules
test('RuleEngine: 應能執行風險規則並回傳正確觸發結果', async (t) => {
  const registry = new DefaultRuleRegistry();
  const stopLossRule = new AbsoluteStopLossRule();
  registry.register(stopLossRule);
  
  const engine = new DefaultRuleEngine(registry);
  
  // 測試停損觸發：現價 90 <= 停損 100
  const context = {
    stockId: '2330',
    asOf: '2026-04-06',
    features: { 
      stockId: '2330', 
      tradeDate: '2026-04-06', 
      closePrice: 90,
      ma20: 0, bias20: 0, volume: 0, vol20Ma: 0, volumeRatio20: 0, alphaVs0050: 0,
      institutionalNet: 0, foreignNet: 0, trustNet: 0, marginChange: 0, marginRiskScore: 0,
      revenueYoy: 0, revenueAcceleration: false, grossMarginGrowth: false, epsTtm: 0, roe: 0,
      totalScore: 0, eventScore: 0, missingFields: []
    },
    position: { entryPrice: 100, shares: 1000, currentPrice: 90, unrealizedPnlPct: -0.1 },
    config: { stopLoss: 100 }
  };
  
  const results = await engine.evaluate(context as any);
  const stopLossResult = results.find(r => r.ruleId === 'risk.absolute_stop_loss');
  
  assert.ok(stopLossResult?.triggered, '停損規則應被觸發');
  assert.strictEqual(stopLossResult?.action, 'SELL');
});

// 3. 測試 DecisionComposer 決策合成
test('DecisionComposer: 當論點破壞時，應優先拍板 EXIT', (t) => {
  const composer = new DecisionComposer();
  
  const decision = composer.compose({
    stockId: '2330',
    asOf: '2026-04-06',
    ruleResults: [], // 即使沒有規則觸發
    thesisStatus: 'broken', // 只要論點破壞
    valuationGap: 0.5 // 即使估值非常有吸引力
  });
  
  assert.strictEqual(decision.action, 'EXIT');
  assert.ok(decision.summary.includes('論點破壞'), '摘要應說明論點破壞');
});
