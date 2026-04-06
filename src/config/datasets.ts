import type { AccountTier, QueryMode } from '../core/types/common.js';

export interface DatasetCapability {
  dataset: string;
  sourceOfTruth: string;
  providerOrder: string[];
  freeTierMode: QueryMode;
  premiumMode: QueryMode;
  costWeight: number;
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
    mvpRequired: true
  },
  {
    dataset: 'month_revenue',
    sourceOfTruth: 'finmind_or_mops',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 3,
    mvpRequired: true
  },
  {
    dataset: 'financial_statements',
    sourceOfTruth: 'finmind_or_mops',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 4,
    mvpRequired: true
  },
  {
    dataset: 'institutional_flow',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    mvpRequired: true
  },
  {
    dataset: 'margin_short',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind', 'official_backfill'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    mvpRequired: true
  },
  {
    dataset: 'securities_lending',
    sourceOfTruth: 'finmind',
    providerOrder: ['finmind'],
    freeTierMode: 'per_stock',
    premiumMode: 'bulk',
    costWeight: 2,
    mvpRequired: false
  },
  {
    dataset: 'stock_news',
    sourceOfTruth: 'mixed',
    providerOrder: ['finmind', 'google_rss', 'yahoo_rss'],
    freeTierMode: 'keyword',
    premiumMode: 'keyword',
    costWeight: 1,
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
