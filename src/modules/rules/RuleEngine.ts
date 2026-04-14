import type { RuleEngine as RuleEngineContract, BaseRule, RuleRegistry } from '../../core/contracts/rule.js';
import type { RuleContext, RuleResult, RuleCategory } from '../../core/types/rule.js';

export class DefaultRuleRegistry implements RuleRegistry {
  private rules = new Map<string, BaseRule>();

  register(rule: BaseRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`[規則註冊失敗] 重複的規則 ID: ${rule.id}`);
    }
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

  /**
   * 執行規則評估。
   * 執行順序 (Phase)：
   * 1. filter: 決定是否要繼續處理此股票 (任何 triggered filter 都跳過後續)
   * 2. risk: 決定是否存在即時風險 (若觸發 Critical 則 short-circuit)
   * 3. entry/exit/thesis: 其他策略規則
   */
  async evaluate(context: RuleContext): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const phases: RuleCategory[][] = [['filter'], ['risk'], ['entry', 'exit', 'thesis']];

    for (const phaseCategories of phases) {
      const phaseRules = this.registry.list()
        .filter(r => phaseCategories.includes(r.category))
        .sort((a, b) => a.priority - b.priority);

      for (const rule of phaseRules) {
        if (!rule.supports(context)) continue;

        const result = await rule.evaluate(context);
        results.push(result);

        // Short-circuit 邏輯
        if (result.triggered) {
          // 若 Filter 階段任一規則已判定不可繼續，或 Risk 階段觸發 Critical 動作，則停止後續評估
          if (result.category === 'filter') return results;
          if (result.category === 'risk' && result.severity === 'critical') return results;
        }
      }
    }

    return results;
  }
}
