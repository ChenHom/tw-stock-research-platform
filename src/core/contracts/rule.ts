import type { StockFeatureSet } from '../types/feature.js';
import type { ThesisRecord, ValuationSnapshot, CatalystItem } from '../types/research.js';
import type { RuleDecision } from '../types/rule.js';

export interface RuleContext {
  stockId: string;
  featureSet: StockFeatureSet;
  thesis?: ThesisRecord;
  valuation?: ValuationSnapshot;
  upcomingCatalysts?: CatalystItem[];
  position?: {
    entryPrice?: number;
    shares?: number;
    stopLoss?: number;
    takeProfit?: number;
    highPrice?: number;
    trailingPct?: number;
    strategy?: string;
  };
}

export interface TradingRule {
  readonly ruleCode: string;
  readonly priority: number;
  evaluate(context: RuleContext): Promise<RuleDecision | null> | RuleDecision | null;
}
