import type { BaseRule } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult } from '../../core/types/rule.js';

export class CandidatePoolAddRule implements BaseRule {
  readonly id = 'strategy.candidate_pool_add';
  readonly name = 'Candidate Pool Add';
  readonly category = 'entry';
  readonly priority = 100;
  readonly tags = ['strategy', 'candidate'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition !== true && context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const triggered = score >= 60;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: 'WATCH',
      severity: 'info',
      triggered,
      reason: triggered ? `Total score ${score} is moderate, watch.` : 'Score below threshold'
    };
  }
}

export class BuySetupRule implements BaseRule {
  readonly id = 'strategy.buy_setup';
  readonly name = 'Buy Setup';
  readonly category = 'entry';
  readonly priority = 60;
  readonly tags = ['strategy', 'buy'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition !== true && context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const instNet = context.features.institutionalNet ?? 0;
    const close = context.features.closePrice ?? 0;
    const ma20 = context.features.ma20 ?? Number.MAX_VALUE;

    const triggered = score >= 70 && instNet > 0 && close > ma20;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'BUY' : 'WATCH',
      severity: 'info',
      triggered,
      reason: triggered ? `Strong setup: Score ${score}, InstNet ${instNet}, Price > MA20` : 'Buy setup not met'
    };
  }
}

export class AddOnStrengthRule implements BaseRule {
  readonly id = 'strategy.add_on_strength';
  readonly name = 'Add On Strength';
  readonly category = 'entry';
  readonly priority = 50;
  readonly tags = ['strategy', 'add', 'position'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition === true && context.thesis?.status === 'active';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const instNet = context.features.institutionalNet ?? 0;
    const close = context.features.closePrice ?? 0;
    const ma20 = context.features.ma20 ?? Number.MAX_VALUE;
    const volumeRatio20 = context.features.volumeRatio20 ?? 0;

    const triggered = score >= 80 && instNet > 0 && close > ma20 && volumeRatio20 > 1;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'ADD' : 'WATCH',
      severity: 'info',
      triggered,
      reason: triggered
        ? `Strong follow-through: score=${score}, instNet=${instNet}, close=${close} > ma20=${ma20}, volumeRatio20=${volumeRatio20.toFixed(2)}`
        : 'Add-on conditions not met'
    };
  }
}

export class TrendWeakeningRule implements BaseRule {
  readonly id = 'strategy.trend_weakening';
  readonly name = 'Trend Weakening';
  readonly category = 'exit';
  readonly priority = 70;
  readonly tags = ['strategy', 'sell'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition === true && context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const instNet = context.features.institutionalNet ?? 0;
    const close = context.features.closePrice ?? 0;
    const ma20 = context.features.ma20 ?? 0;
    const thesisWeakened = context.thesis?.status === 'weakened';

    const triggered = thesisWeakened || (close < ma20 && ma20 > 0 && instNet < 0);

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'TRIM' : 'WATCH',
      severity: 'warning',
      triggered,
      reason: triggered
        ? `Trend weakening: thesis=${context.thesis?.status ?? 'none'}, close=${close}, ma20=${ma20}, instNet=${instNet}`
        : 'Trend intact'
    };
  }
}

export class HoldTrendRule implements BaseRule {
  readonly id = 'strategy.hold_trend';
  readonly name = 'Hold Trend';
  readonly category = 'exit';
  readonly priority = 85;
  readonly tags = ['strategy', 'hold', 'position'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition === true && context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const instNet = context.features.institutionalNet ?? 0;
    const close = context.features.closePrice ?? 0;
    const ma20 = context.features.ma20 ?? 0;

    const triggered = score >= 60 && ma20 > 0 && close >= ma20 && instNet >= 0;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'HOLD' : 'WATCH',
      severity: 'info',
      triggered,
      reason: triggered
        ? `Trend still healthy: score=${score}, close=${close} >= ma20=${ma20}, instNet=${instNet}`
        : 'Hold conditions not met'
    };
  }
}

export class ValuationOverheatTrimRule implements BaseRule {
  readonly id = 'strategy.valuation_overheat_trim';
  readonly name = 'Valuation Overheat Trim';
  readonly category = 'exit';
  readonly priority = 75;
  readonly tags = ['strategy', 'trim', 'overheat'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition === true && context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const bias20 = context.features.bias20 ?? 0;
    const score = context.features.totalScore ?? 0;
    const volumeRatio20 = context.features.volumeRatio20 ?? 0;

    const triggered = bias20 >= 12 || (score >= 80 && volumeRatio20 >= 1.5);

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'TRIM' : 'WATCH',
      severity: 'warning',
      triggered,
      reason: triggered
        ? `Overheat signs: bias20=${bias20.toFixed(1)}, score=${score}, volumeRatio20=${volumeRatio20.toFixed(2)}`
        : 'No overheat signals'
    };
  }
}

export class SupportBreakdownSellRule implements BaseRule {
  readonly id = 'strategy.support_breakdown_sell';
  readonly name = 'Support Breakdown Sell';
  readonly category = 'exit';
  readonly priority = 65;
  readonly tags = ['strategy', 'sell', 'position'];

  supports(context: RuleContext): boolean {
    return context.config?.hasPosition === true;
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const instNet = context.features.institutionalNet ?? 0;
    const close = context.features.closePrice ?? 0;
    const ma20 = context.features.ma20 ?? 0;
    const bias20 = context.features.bias20 ?? 0;

    const triggered = (ma20 > 0 && close < ma20 && instNet < 0 && score < 55) || bias20 <= -5;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'SELL' : 'WATCH',
      severity: 'warning',
      triggered,
      reason: triggered
        ? `Support breakdown: close=${close}, ma20=${ma20}, instNet=${instNet}, score=${score}, bias20=${bias20.toFixed(1)}`
        : 'Support remains intact'
    };
  }
}
