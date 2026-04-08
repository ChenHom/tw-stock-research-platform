import type { BaseRule } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult } from '../../core/types/rule.js';

export class CustomStock1513RangeRule implements BaseRule {
  readonly id = 'override.stock_1513_range';
  readonly name = 'Stock 1513 Range Override';
  readonly category = 'exit';
  readonly priority = 1000;
  readonly tags = ['override', '1513'];

  supports(context: RuleContext): boolean {
    return context.stockId === '1513';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const currentPrice = context.features.closePrice ?? 0;
    const volume = context.features.volume ?? 0;
    const vol20 = context.features.vol20Ma ?? 0;
    const instNet = context.features.institutionalNet ?? 0;

    const triggered = currentPrice >= 160 && currentPrice <= 165 && volume < vol20 && instNet < 0;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'TRIM' : 'WATCH',
      severity: 'warning',
      triggered,
      reason: triggered ? '1513 range override triggered: 160-165 with volume contraction and negative institutional flow' : 'Conditions not met',
    };
  }
}