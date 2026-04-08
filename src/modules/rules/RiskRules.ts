import type { BaseRule } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult } from '../../core/types/rule.js';

export class AbsoluteStopLossRule implements BaseRule {
  readonly id = 'risk.absolute_stop_loss';
  readonly name = 'Absolute Stop Loss';
  readonly category = 'risk';
  readonly priority = 10;
  readonly tags = ['risk', 'stop_loss'];

  supports(context: RuleContext): boolean {
    return !!(context.position && context.position.entryPrice);
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const currentPrice = context.features.closePrice ?? 0;
    const stopLoss = context.config?.stopLoss ?? (context.position?.entryPrice ? context.position.entryPrice * 0.9 : 0);
    
    const triggered = stopLoss > 0 && currentPrice <= stopLoss;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'SELL' : 'WATCH',
      severity: 'critical',
      triggered,
      reason: triggered ? `Current price ${currentPrice} <= stop loss ${stopLoss}` : 'Above stop loss'
    };
  }
}

export class ThesisBrokenRule implements BaseRule {
  readonly id = 'risk.thesis_broken';
  readonly name = 'Thesis Broken';
  readonly category = 'risk';
  readonly priority = 20;
  readonly tags = ['risk', 'thesis'];

  supports(context: RuleContext): boolean {
    return !!context.thesis;
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const triggered = context.thesis?.status === 'broken';

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'EXIT' : 'WATCH',
      severity: 'critical',
      triggered,
      reason: triggered ? 'Thesis status is broken' : 'Thesis is intact'
    };
  }
}

export class RiskBlockRule implements BaseRule {
  readonly id = 'risk.block_rule';
  readonly name = 'Risk Block Rule';
  readonly category = 'risk';
  readonly priority = 110;
  readonly tags = ['risk', 'block'];

  supports(context: RuleContext): boolean {
    return true;
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const marginRisk = context.features.marginRiskScore ?? 0;

    const triggered = score < 40 || marginRisk >= 80;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'BLOCK' : 'WATCH',
      severity: 'critical',
      triggered,
      reason: triggered ? `High risk: score=${score}, marginRisk=${marginRisk}` : 'Risk acceptable'
    };
  }
}