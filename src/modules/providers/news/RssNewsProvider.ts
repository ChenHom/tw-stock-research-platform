import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse } from '../../../core/types/provider.js';
import type { NewsRow } from '../../../core/types/market.js';

export class RssNewsProvider implements DataProvider<NewsRow> {
  readonly providerName: 'google_rss' | 'yahoo_rss';

  constructor(providerName: 'google_rss' | 'yahoo_rss') {
    this.providerName = providerName;
  }

  supports(dataset: string): boolean {
    return dataset === 'stock_news';
  }

  async fetch(query: DatasetQuery, context: FetchContext): Promise<NormalizedResponse<NewsRow>> {
    void context;
    throw new Error(`Not implemented: ${this.providerName} fetch for keyword=${query.keyword}`);
  }
}
