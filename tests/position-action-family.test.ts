import test from 'node:test';
import assert from 'node:assert/strict';
import { AddOnStrengthRule, BuySetupRule, CandidatePoolAddRule, HoldTrendRule, SupportBreakdownSellRule, TrendWeakeningRule, ValuationOverheatTrimRule } from '../src/modules/rules/StrategyRules.js';

test('Position action family: 候選模式不應觸發持倉動作，持倉模式應能觸發 ADD/TRIM', async () => {
  const addRule = new AddOnStrengthRule();
  const trimRule = new TrendWeakeningRule();
  const holdRule = new HoldTrendRule();
  const overheatRule = new ValuationOverheatTrimRule();
  const sellRule = new SupportBreakdownSellRule();
  const buyRule = new BuySetupRule();
  const watchRule = new CandidatePoolAddRule();

  const candidateContext: any = {
    config: { hasPosition: false },
    thesis: { status: 'active' },
    features: { totalScore: 85, institutionalNet: 300, closePrice: 110, ma20: 100, volumeRatio20: 1.3 }
  };
  assert.strictEqual(addRule.supports(candidateContext), false);
  assert.strictEqual(trimRule.supports(candidateContext), false);
  assert.strictEqual(buyRule.supports(candidateContext), true);
  assert.strictEqual(watchRule.supports(candidateContext), true);

  const positionContext: any = {
    config: { hasPosition: true },
    thesis: { status: 'active' },
    features: { totalScore: 85, institutionalNet: 300, closePrice: 110, ma20: 100, volumeRatio20: 1.3 }
  };
  assert.strictEqual(addRule.supports(positionContext), true);
  assert.strictEqual(watchRule.supports(positionContext), false);
  const addResult = await addRule.evaluate(positionContext);
  assert.strictEqual(addResult.action, 'ADD');
  assert.strictEqual(addResult.triggered, true);
  const holdResult = await holdRule.evaluate(positionContext);
  assert.strictEqual(holdResult.action, 'HOLD');
  assert.strictEqual(holdResult.triggered, true);

  const overheatContext: any = {
    config: { hasPosition: true },
    thesis: { status: 'active' },
    features: { totalScore: 82, institutionalNet: 120, closePrice: 120, ma20: 100, bias20: 15, volumeRatio20: 1.6 }
  };
  const overheatResult = await overheatRule.evaluate(overheatContext);
  assert.strictEqual(overheatResult.action, 'TRIM');
  assert.strictEqual(overheatResult.triggered, true);

  const weakenedPositionContext: any = {
    config: { hasPosition: true },
    thesis: { status: 'weakened' },
    features: { totalScore: 62, institutionalNet: -100, closePrice: 95, ma20: 100, volumeRatio20: 0.8 }
  };
  const trimResult = await trimRule.evaluate(weakenedPositionContext);
  assert.strictEqual(trimResult.action, 'TRIM');
  assert.strictEqual(trimResult.triggered, true);

  const sellContext: any = {
    config: { hasPosition: true },
    thesis: { status: 'weakened' },
    features: { totalScore: 50, institutionalNet: -200, closePrice: 90, ma20: 100, bias20: -8 }
  };
  const sellResult = await sellRule.evaluate(sellContext);
  assert.strictEqual(sellResult.action, 'SELL');
  assert.strictEqual(sellResult.triggered, true);
});
