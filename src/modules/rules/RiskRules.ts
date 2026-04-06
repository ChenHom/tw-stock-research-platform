import type { TradingRule, RuleContext } from '../../core/contracts/rule.js';
import type { RuleDecision } from '../../core/types/rule.js';

export class AbsoluteStopLossRule implements TradingRule {
  readonly ruleCode = 'risk.absolute_stop_loss';
  readonly priority = 10;

  evaluate(context: RuleContext): RuleDecision | null {
    const currentPrice = context.featureSet.closePrice;
    const stopLoss = context.position?.stopLoss;
    if (currentPrice == null || stopLoss == null) return null;

    if (currentPrice <= stopLoss) {
      return {
        action: 'SELL',
        reason: `Current price ${currentPrice} <= stop loss ${stopLoss}`,
        severity: 'critical',
        triggeredRules: [this.ruleCode],
        thesisStatus: 'broken'
      };
    }

    return null;
  }
}

export class ThesisBrokenRule implements TradingRule {
  readonly ruleCode = 'risk.thesis_broken';
  readonly priority = 20;

  evaluate(context: RuleContext): RuleDecision | null {
    if (context.thesis?.status === 'broken') {
      return {
        action: 'EXIT',
        reason: 'Thesis status is broken',
        severity: 'critical',
        triggeredRules: [this.ruleCode],
        thesisStatus: 'broken'
      };
    }

    return null;
  }
}
