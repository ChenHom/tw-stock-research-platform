import type { BaseRule } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult } from '../../core/types/rule.js';

const CRITICAL_MISSING_FIELDS = new Set([
  'market_daily',
  'market_daily_invalid',
  'daily_valuation',
  'financial_statements',
  'market_daily_history'
]);

export class DataQualityGuardRule implements BaseRule {
  readonly id = 'filter.data_quality_guard';
  readonly name = 'Data Quality Guard';
  readonly category = 'filter';
  readonly priority = 10;
  readonly tags = ['filter', 'quality', 'safety'];

  supports(): boolean {
    return true;
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const missingFields = Array.isArray(context.features.missingFields) ? context.features.missingFields : [];
    const criticalMissing = missingFields.filter(field => CRITICAL_MISSING_FIELDS.has(field));
    const reasons: string[] = [];

    if (criticalMissing.length > 0) {
      reasons.push(`缺少關鍵資料 ${criticalMissing.join(', ')}`);
    }

    if ((context.features.closePrice ?? 0) <= 0 && !criticalMissing.includes('market_daily_invalid')) {
      reasons.push('收盤價無效');
    }

    if ((context.features.ma20 ?? 0) <= 0 && !criticalMissing.includes('market_daily_history')) {
      reasons.push('MA20 無法建立');
    }

    const triggered = reasons.length > 0;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: 'WATCH',
      severity: 'warning',
      triggered,
      reason: triggered ? reasons.join('；') : 'Data quality acceptable',
      metadata: {
        criticalMissing
      }
    };
  }
}
