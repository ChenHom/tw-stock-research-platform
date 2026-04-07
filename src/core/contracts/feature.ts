import type { StockFeatureSet } from '../types/feature.js';
import type { 
  MarketDailyRow, 
  ValuationDailyRow, 
  InstitutionalFlowRow, 
  MonthRevenueRow, 
  MarginShortRow,
  FinancialStatementRow 
} from '../types/market.js';

export interface FeatureBuildInput {
  stockId: string;
  tradeDate: string;
  marketDaily?: MarketDailyRow;
  valuationDaily?: ValuationDailyRow;
  institutionalFlow?: InstitutionalFlowRow;
  monthRevenue?: MonthRevenueRow;
  marginShort?: MarginShortRow;
  financialStatements?: FinancialStatementRow[];
  news?: any[]; 
  // 強化：支援趨勢分析與基準對比
  history?: MarketDailyRow[];
  benchmarkHistory?: MarketDailyRow[];
  monthRevenueHistory?: MonthRevenueRow[];
  }
export interface FeatureBuilder {
  /**
   * 根據提供的原始資料聚合計算特徵集
   */
  build(input: FeatureBuildInput): StockFeatureSet;
}
