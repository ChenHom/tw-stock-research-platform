import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse } from '../../../core/types/provider.js';
import type { MarketDailyRow, ValuationDailyRow } from '../../../core/types/market.js';

export class TwseOpenApiProvider implements DataProvider<MarketDailyRow | ValuationDailyRow> {
  readonly providerName = 'twse';

  supports(dataset: string): boolean {
    return ['market_daily', 'daily_valuation', 'stock_master', 'announcements'].includes(dataset);
  }

  async fetch(query: DatasetQuery, context: FetchContext): Promise<NormalizedResponse<MarketDailyRow | ValuationDailyRow>> {
    void context;
    throw new Error(`Not implemented: ${this.providerName} fetch for dataset=${query.dataset}`);
  }
}
