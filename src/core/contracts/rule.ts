import type { RuleContext, RuleResult, RuleCategory } from '../types/rule.js';

/**
 * 核心規則介面：所有外掛規則都必須實作此介面
 */
export interface BaseRule {
  readonly id: string;
  readonly name: string;
  readonly category: RuleCategory;
  readonly priority: number;
  readonly tags: string[];

  /**
   * 檢查當前上下文是否支援此規則執行
   */
  supports(context: RuleContext): boolean;

  /**
   * 評估規則並回傳結果
   */
  evaluate(context: RuleContext): Promise<RuleResult>;
}

/**
 * 規則註冊表介面：管理系統中所有的外掛規則
 */
export interface RuleRegistry {
  register(rule: BaseRule): void;
  list(): BaseRule[];
  getByCategory(category: RuleCategory): BaseRule[];
  getById(id: string): BaseRule | undefined;
}

/**
 * 規則引擎介面：負責執行規則組合與決策合成
 */
export interface RuleEngine {
  evaluate(context: RuleContext): Promise<RuleResult[]>;
}
