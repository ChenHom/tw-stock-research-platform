import type { AccountTier, QueryMode } from '../core/types/common.js';

export interface CostModel {
  freeTierPerRequest: number;
  backerTierPerRequest?: number;
  sponsorTierPerRequest?: number;
  bulkMultiplier?: number;
}

export interface DatasetCapability {
  dataset: string;
  sourceOfTruth: string;
  providerOrder: string[];
  freeMode: QueryMode;
  backerMode: QueryMode;
  sponsorMode: QueryMode;
  costWeight: number;
  costModel: CostModel;
  cacheTtlSeconds: number;
  mvpRequired: boolean;
  notes?: string;
}

export const DATASET_CAPABILITIES: DatasetCapability[] = [
  {
    dataset: 'market_daily_latest',
    sourceOfTruth: 'twse',
    providerOrder: ['twse', 'finmind'],
    freeMode: 'bulk',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 1,
    costModel: { freeTierPerRequest: 0, bulkMultiplier: 1 },
    cacheTtlSeconds: 14400,
    mvpRequired: true,
    notes: '當日全市場快照，優先走 TWSE'
  },
  {
    dataset: 'market_daily_history',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeMode: 'per_stock',
    backerMode: 'per_stock',
    sponsorMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 2, bulkMultiplier: 50 },
    cacheTtlSeconds: 86400,
    mvpRequired: true,
    notes: '單檔歷史序列，優先走 FinMind'
  },
  {
    dataset: 'daily_valuation',
    sourceOfTruth: 'twse',
    providerOrder: ['twse', 'finmind'],
    freeMode: 'bulk',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 1,
    costModel: { freeTierPerRequest: 0, bulkMultiplier: 1 },
    cacheTtlSeconds: 14400,
    mvpRequired: true
  },
  {
    dataset: 'month_revenue',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeMode: 'per_stock',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 3,
    costModel: { freeTierPerRequest: 2, bulkMultiplier: 50 },
    cacheTtlSeconds: 86400,
    mvpRequired: true
  },
  {
    dataset: 'institutional_flow',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeMode: 'per_stock',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 30 },
    cacheTtlSeconds: 14400,
    mvpRequired: true
  },
  {
    dataset: 'margin_short',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeMode: 'per_stock',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 30 },
    cacheTtlSeconds: 14400,
    mvpRequired: true
  },
  {
    dataset: 'financial_statements',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeMode: 'per_stock',
    backerMode: 'bulk',
    sponsorMode: 'bulk',
    costWeight: 4,
    costModel: { freeTierPerRequest: 5, bulkMultiplier: 100 },
    cacheTtlSeconds: 86400,
    mvpRequired: true
  },
  {
    dataset: 'stock_news',
    sourceOfTruth: 'mixed',
    providerOrder: ['finmind', 'google_rss'],
    freeMode: 'keyword',
    backerMode: 'keyword',
    sponsorMode: 'keyword',
    costWeight: 1,
    costModel: { freeTierPerRequest: 1 },
    cacheTtlSeconds: 900,
    mvpRequired: true
  }
];

export function resolveQueryMode(dataset: string, accountTier: AccountTier): QueryMode {
  const cap = DATASET_CAPABILITIES.find(c => c.dataset === dataset);
  if (!cap) throw new Error(`Unknown dataset: ${dataset}`);
  
  if (accountTier === 'sponsor') return cap.sponsorMode;
  if (accountTier === 'backer') return cap.backerMode;
  return cap.freeMode;
}
