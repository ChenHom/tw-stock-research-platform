import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse } from '../../../core/types/provider.js';
import type {
  FinancialStatementRow,
  InstitutionalFlowRow,
  MarginShortRow,
  MarketDailyRow,
  MonthRevenueRow,
  NewsRow
} from '../../../core/types/market.js';

export class FinMindProvider implements DataProvider<
  MarketDailyRow | MonthRevenueRow | FinancialStatementRow | InstitutionalFlowRow | MarginShortRow | NewsRow
> {
  readonly providerName = 'finmind';

  supports(dataset: string): boolean {
    return [
      'market_daily',
      'month_revenue',
      'financial_statements',
      'balance_sheet',
      'cashflow',
      'institutional_flow',
      'margin_short',
      'securities_lending',
      'stock_news'
    ].includes(dataset);
  }

  async fetch(
    query: DatasetQuery,
    context: FetchContext
  ): Promise<NormalizedResponse<MarketDailyRow | MonthRevenueRow | FinancialStatementRow | InstitutionalFlowRow | MarginShortRow | NewsRow>> {
    void context;
    throw new Error(`Not implemented: ${this.providerName} fetch for dataset=${query.dataset}`);
  }
}
