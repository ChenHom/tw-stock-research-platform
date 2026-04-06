/**
 * 原始資料型別：對應 TWSE / FinMind 的原始輸出
 */
export interface RawMarketRow {
  [key: string]: string | number | null;
}

/**
 * 正規化價量資料
 */
export interface MarketDailyRow {
  stockId: string;
  tradeDate: string; // ISO Date YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // 成交股數
  turnover: number; // 成交金額
  transactionCount: number; // 成交筆數
}

/**
 * 正規化估值資料
 */
export interface ValuationDailyRow {
  stockId: string;
  tradeDate: string;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  marketCap?: number;
}

/**
 * 正規化營收資料
 */
export interface MonthRevenueRow {
  stockId: string;
  yearMonth: string; // YYYY-MM
  revenue: number;
  revenueYoy: number;
  revenueMom: number;
}

/**
 * 財務報表行 (Income Statement)
 */
export interface FinancialStatementRow {
  stockId: string;
  year: number;
  quarter: number;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

/**
 * 籌碼資料 (三大法人)
 */
export interface InstitutionalFlowRow {
  stockId: string;
  tradeDate: string;
  foreignNet: number;
  trustNet: number;
  dealerNet: number;
  totalNet: number;
}

/**
 * 融資融券
 */
export interface MarginShortRow {
  stockId: string;
  tradeDate: string;
  marginBalance: number;
  shortBalance: number;
  marginChange: number;
  shortChange: number;
}

/**
 * 新聞資料
 */
export interface NewsRow {
  stockId?: string;
  relatedStockIds?: string[];
  publishedAt: string;
  title: string;
  url: string;
  source: string;
  content?: string;
}
