import type { AccountTier, QueryMode } from './common.js';

export interface ProviderMeta {
  providerName: string;
  dataset: string;
  sourceOfTruth?: boolean;
  fetchedAt: string;
  queryMode: QueryMode;
  accountTier?: AccountTier;
  costWeight?: number;
  isFallback?: boolean;
  isStale?: boolean;
}

export interface FetchContext {
  requestId?: string;
  accountTier: AccountTier;
  allowFallback?: boolean;
  maxLatencyMs?: number;
}

export interface NormalizedResponse<T> {
  meta: ProviderMeta;
  data: T[];
}
