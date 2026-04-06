import type { AccountTier, QueryMode } from '../types/common.js';
import type { BudgetSnapshot } from '../../modules/budget/RateBudgetGuard.js';

export interface QueryCostEstimate {
  estimatedCalls: number;
  estimatedCostUnits: number;
}

export interface RoutingDecision {
  dataset: string;
  providerOrder: string[];
  finalProviderOrder: string[];
  queryMode: QueryMode;
  supportsFallback: boolean;
  accountTier: AccountTier;
  estimatedCost: QueryCostEstimate;
  degradeMode: 'none' | 'official_only' | 'watchlist_only' | 'skip_non_essential';
  canProceed: boolean;
  reason: string;
}

export interface DatasetRouter {
  decide(
    dataset: string,
    accountTier: AccountTier,
    budget?: BudgetSnapshot,
    stockId?: string
  ): RoutingDecision;
}
