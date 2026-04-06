import type { RuleEngine as RuleEngineContract, BaseRule, RuleRegistry } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult, RuleCategory } from '../../core/types/rule.js';

export class DefaultRuleRegistry implements RuleRegistry {
  private rules = new Map<string, BaseRule>();

  register(rule: BaseRule): void {
    this.rules.set(rule.id, rule);
  }

  list(): BaseRule[] {
    return Array.from(this.rules.values());
  }

  getByCategory(category: RuleCategory): BaseRule[] {
    return this.list().filter(r => r.category === category);
  }

  getById(id: string): BaseRule | undefined {
    return this.rules.get(id);
  }
}

export class DefaultRuleEngine implements RuleEngineContract {
  constructor(private readonly registry: RuleRegistry) {}

  async evaluate(context: RuleContext): Promise<RuleResult[]> {
    const orderedRules = this.registry.list().slice().sort((a, b) => a.priority - b.priority);
    const results: RuleResult[] = [];

    for (const rule of orderedRules) {
      if (rule.supports(context)) {
        const decision = await rule.evaluate(context);
        results.push(decision);
      }
    }

    return results;
  }
}