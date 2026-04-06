import type {
  FinancialStatementRow,
  InstitutionalFlowRow,
  MarginShortRow,
  MarketDailyRow,
  MonthRevenueRow
} from '../../core/types/market.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export interface FeatureInput {
  stockId: string;
  tradeDate: string;
  marketRows: MarketDailyRow[];
  marketBenchmarkRows?: MarketDailyRow[];
  monthRevenueRows?: MonthRevenueRow[];
  financialRows?: FinancialStatementRow[];
  institutionalRows?: InstitutionalFlowRow[];
  marginRows?: MarginShortRow[];
  eventScore?: number;
}

export class FeatureBuilder {
  build(input: FeatureInput): StockFeatureSet {
    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      missingFields: ['implementation_pending']
    };
  }
}
