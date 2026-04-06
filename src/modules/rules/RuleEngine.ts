import type { TradingRule, RuleContext } from '../../core/contracts/rule.js';
import type { RuleDecision } from '../../core/types/rule.js';

export class RuleEngine {
  constructor(private readonly rules: TradingRule[]) {}

  async evaluate(context: RuleContext): Promise<RuleDecision> {
    const orderedRules = this.rules.slice().sort((a, b) => a.priority - b.priority);

    for (const rule of orderedRules) {
      const decision = await rule.evaluate(context);
      if (decision) return decision;
    }

    return {
      action: 'HOLD',
      reason: 'No rule triggered',
      severity: 'low',
      triggeredRules: [],
      thesisStatus: context.thesis?.status ?? 'intact'
    };
  }
}
