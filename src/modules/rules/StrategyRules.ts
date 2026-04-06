import type { TradingRule, RuleContext } from '../../core/contracts/rule.js';
import type { RuleDecision } from '../../core/types/rule.js';

export class CandidatePoolAddRule implements TradingRule {
  readonly ruleCode = 'strategy.candidate_pool_add';
  readonly priority = 100;

  evaluate(context: RuleContext): RuleDecision | null {
    const score = context.featureSet.totalScore ?? 0;
    if (score >= 80 && context.thesis?.status !== 'broken') {
      return {
        action: 'WATCH',
        reason: `Total score ${score} passes candidate threshold`,
        severity: 'medium',
        triggeredRules: [this.ruleCode],
        thesisStatus: context.thesis?.status ?? 'intact'
      };
    }

    return null;
  }
}
