import type { StockFeatureSet } from './feature.js';
import type { ThesisStatus, Direction } from './common.js';

export type RuleAction =
  | 'BUY'
  | 'ADD'
  | 'HOLD'
  | 'TRIM'
  | 'SELL'
  | 'EXIT'
  | 'BLOCK'
  | 'WATCH';

export type RuleCategory = 'risk' | 'entry' | 'exit' | 'filter' | 'thesis';

/**
 * 規則執行的上下文：提供規則評估所需的所有資訊
 */
export interface RuleContext {
  stockId: string;
  asOf: string; // ISO Date String
  features: StockFeatureSet; // 強化：具備型別的特徵集
  position?: {
    entryPrice: number;
    shares: number;
    currentPrice: number;
    unrealizedPnlPct: number;
  };
  thesis?: {
    id: string;
    version: number;
    status: ThesisStatus;
    direction: Direction;
  };
  upcomingEvents?: Array<{
    type: string;
    date: string;
    title: string;
  }>;
  config?: Record<string, any>;
}

/**
 * 單一規則的評估結果
 */
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  action: RuleAction;
  scoreImpact?: number; // 對決策分數的影響 (-100 到 100)
  severity: 'info' | 'warning' | 'critical';
  triggered: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * 最終合成的決策結果 (Decision Composer 產出)
 */
export interface FinalDecision {
  stockId: string;
  decisionDate: string;
  action: RuleAction;
  confidence: number; // 0.0 - 1.0
  summary: string;
  explanation?: {
    primaryRuleId?: string;
    primaryRuleName?: string;
    triggeredConditions: string[];
    missingConditions: string[];
    blockingConditions: string[];
    thesisSignals?: string[];
  };
  supportingRules: string[];
  blockingRules: string[];
  thesisStatus: ThesisStatus | 'none';
  composerVersion: string;
}
