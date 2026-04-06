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
  freeTierMode: QueryMode;
  premiumMode: QueryMode;
  costWeight: number;
  costModel: CostModel; // 新增：用於預算預估
  mvpRequired: boolean;
  notes?: string;
}

export const DATASET_CAPABILITIES: DatasetCapability[] = [
  {
    dataset: 'market_daily',
    sourceOfTruth: 'twse',
    providerOrder: ['twse', 'finmind'],
    freeTierMode: 'bulk',
    premiumMode: 'bulk',
    costWeight: 1,
    costModel: { freeTierPerRequest: 0, bulkMultiplier: 1 }, // TWSE is free
    mvpRequired: true,
    notes: '全市場初篩'
  },
  {
    dataset: 'daily_valuation',
    sourceOfTruth: 'twse',
    providerOrder: ['twse', 'finmind'],
    freeTierMode: 'bulk',
    premiumMode: 'bulk',
    costWeight: 1,
    costModel: { freeTierPerRequest: 0, bulkMultiplier: 1 },
    mvpRequired: true
  },
  {
    dataset: 'month_revenue',
    sourceOfTruth: 'finmind_or_mops',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 3,
    costModel: { freeTierPerRequest: 2, bulkMultiplier: 50 },
    mvpRequired: true
  },
  {
    dataset: 'financial_statements',
    sourceOfTruth: 'finmind_or_mops',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 4,
    costModel: { freeTierPerRequest: 5, bulkMultiplier: 100 },
    mvpRequired: true
  },
  {
    dataset: 'institutional_flow',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 30 },
    mvpRequired: true
  },
  {
    dataset: 'margin_short',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 30 },
    mvpRequired: true
  },
  {
    dataset: 'securities_lending',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 30 },
    mvpRequired: false
  },
  {
    dataset: 'stock_news',
    sourceOfTruth: 'mixed',
    providerOrder: ['finmind', 'google_rss', 'yahoo_rss'],
    freeTierMode: 'keyword',
    premiumMode: 'keyword',
    costWeight: 1,
    costModel: { freeTierPerRequest: 1, bulkMultiplier: 1 },
    mvpRequired: true,
    notes: '僅作線索'
  },
  {
    dataset: 'realtime_quote',
    sourceOfTruth: 'mixed',
    providerOrder: ['twse_realtime', 'finmind_realtime'],
    freeTierMode: 'disabled',
    premiumMode: 'per_stock',
    costWeight: 5,
    costModel: { freeTierPerRequest: 10, bulkMultiplier: 100 },
    mvpRequired: false
  }
];

export function resolveQueryMode(dataset: string, accountTier: AccountTier): QueryMode {
  const capability = DATASET_CAPABILITIES.find((row) => row.dataset === dataset);
  if (!capability) {
    throw new Error(`Unknown dataset: ${dataset}`);
  }
  return accountTier === 'free_tier_600ph' ? capability.freeTierMode : capability.premiumMode;
}
