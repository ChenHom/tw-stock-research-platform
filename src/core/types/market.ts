export interface MarketDailyRow {
  stockId: string;
  tradeDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice?: number;
  volume?: number;
  turnover?: number;
  transactionCount?: number;
}

export interface ValuationDailyRow {
  stockId: string;
  tradeDate: string;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  marketCap?: number;
}

export interface MonthRevenueRow {
  stockId: string;
  revenueMonth: string;
  monthlyRevenue: number;
  revenueYoY?: number;
  revenueMoM?: number;
}

export interface FinancialStatementRow {
  stockId: string;
  fiscalYear: number;
  fiscalQuarter: number;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  eps?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
}

export interface InstitutionalFlowRow {
  stockId: string;
  tradeDate: string;
  foreignNet?: number;
  trustNet?: number;
  dealerNet?: number;
  totalInstitutionalNet?: number;
}

export interface MarginShortRow {
  stockId: string;
  tradeDate: string;
  marginPurchaseBalance?: number;
  shortSaleBalance?: number;
  marginChange?: number;
  shortChange?: number;
}

export interface NewsRow {
  publishedAt?: string;
  title: string;
  content?: string;
  url: string;
  sourceName?: string;
  relatedStockIds?: string[];
}
