import type { BaseRule } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult } from '../../core/types/rule.js';

export class CandidatePoolAddRule implements BaseRule {
  readonly id = 'strategy.candidate_pool_add';
  readonly name = 'Candidate Pool Add';
  readonly category = 'entry';
  readonly priority = 100;
  readonly tags = ['strategy', 'candidate'];

  supports(context: RuleContext): boolean {
    return context.thesis?.status !== 'broken';
  }

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const score = context.features.totalScore ?? 0;
    const triggered = score >= 80;

    return {
      ruleId: this.id,
      ruleName: this.name,
      category: this.category,
      action: triggered ? 'WATCH' : 'WATCH',
      severity: 'info',
      triggered,
      reason: triggered ? `Total score ${score} passes candidate threshold` : 'Score below threshold'
    };
  }
}