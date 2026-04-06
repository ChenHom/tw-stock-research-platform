import type { AccountTier, QueryMode } from './common.js';

/**
 * 資料來源元數據：追蹤每一筆資料的溯源與版本資訊
 */
export interface SourceMetadata {
  provider: string; // 'twse_openapi' | 'finmind' | 'mops' | 'google_rss' | 'yahoo_rss'
  dataset: string;
  fetchedAt: string; // ISO String: 系統抓取資料的時間
  asOf?: string; // ISO String / Date String: 資料本身的時點 (例如 2026-04-06)
  requestId?: string;
  accountTier?: AccountTier;
  queryMode?: QueryMode; // 'bulk' | 'per_stock' | 'snapshot'
  rawVersion?: string; // 原始資料的版本號 (如果有)
  normalizationVersion: string; // 正規化規則的版本號
  isFallback: boolean;
  fallbackFrom?: string; // 如果是 fallback，記錄原始嘗試的 provider
  isCacheHit: boolean;
  isStale: boolean;
  confidence?: number; // 資料的置信度 (0.0 - 1.0)
}

/**
 * 抓取上下文：傳遞給 provider 的執行設定
 */
export interface FetchContext {
  requestId?: string;
  accountTier: AccountTier;
  allowFallback?: boolean;
  maxLatencyMs?: number;
  useCache?: boolean;
}

/**
 * 正規化後的響應：不僅包含資料，還包含完整的採用決策與備選資訊
 */
export interface NormalizedResponse<T> {
  data: T[];
  source: SourceMetadata;
  alternatives?: SourceMetadata[]; // 備選的 provider 資訊 (如果有的話)
  warnings?: string[];
}
