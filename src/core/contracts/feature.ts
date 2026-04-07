import type { StockFeatureSet } from '../types/feature.js';
import type { MarketDailyRow, ValuationDailyRow, InstitutionalFlowRow, MonthRevenueRow, MarginShortRow } from '../types/market.js';

export interface FeatureBuildInput {
  stockId: string;
  tradeDate: string;
  marketDaily?: MarketDailyRow;
  valuationDaily?: ValuationDailyRow;
  institutionalFlow?: InstitutionalFlowRow;
  monthRevenue?: MonthRevenueRow;
  marginShort?: MarginShortRow; // 加入此欄位
  // 未來可擴充：歷史序列用於計算 MA20, RSI 等
  history?: MarketDailyRow[];
}

export interface FeatureBuilder {
  /**
   * 根據提供的原始資料聚合計算特徵集
   */
  build(input: FeatureBuildInput): StockFeatureSet;
}
