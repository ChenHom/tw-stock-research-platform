export type RuleAction =
  | 'WATCH'
  | 'BUY'
  | 'ADD'
  | 'HOLD'
  | 'TRIM'
  | 'SELL_PARTIAL'
  | 'SELL'
  | 'EXIT'
  | 'NO_ACTION'
  | 'SKIP';

export interface RuleDecision {
  action: RuleAction;
  reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggeredRules: string[];
  thesisStatus?: 'intact' | 'weakened' | 'broken' | 'archived';
  metadata?: Record<string, unknown>;
}
