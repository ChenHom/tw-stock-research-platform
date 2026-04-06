import type { TradingRule, RuleContext } from '../../core/contracts/rule.js';
import type { RuleDecision } from '../../core/types/rule.js';

export class CustomStock1513RangeRule implements TradingRule {
  readonly ruleCode = 'override.stock_1513_range';
  readonly priority = 1000;

  evaluate(context: RuleContext): RuleDecision | null {
    if (context.stockId !== '1513') return null;
    const currentPrice = context.featureSet.closePrice ?? 0;
    const volume = context.featureSet.volume ?? 0;
    const vol20 = context.featureSet.vol20Ma ?? 0;
    const instNet = context.featureSet.institutionalNet ?? 0;

    if (currentPrice >= 160 && currentPrice <= 165 && volume < vol20 && instNet < 0) {
      return {
        action: 'SELL_PARTIAL',
        reason: '1513 range override triggered: 160-165 with volume contraction and negative institutional flow',
        severity: 'high',
        triggeredRules: [this.ruleCode]
      };
    }

    return null;
  }
}
