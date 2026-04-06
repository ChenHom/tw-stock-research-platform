import type { AccountTier, QueryMode } from '../types/common.js';

export interface RoutingDecision {
  dataset: string;
  providerOrder: string[];
  queryMode: QueryMode;
  supportsFallback: boolean;
  accountTier: AccountTier;
  reason: string;
}

export interface DatasetRouter {
  decide(dataset: string, accountTier: AccountTier, stockId?: string): RoutingDecision;
}
