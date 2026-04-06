import type { FetchContext, NormalizedResponse } from '../types/provider.js';

export interface DatasetQuery {
  dataset: string;
  stockId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  limit?: number;
}

export interface DataProvider<T> {
  readonly providerName: string;
  supports(dataset: string): boolean;
  fetch(query: DatasetQuery, context: FetchContext): Promise<NormalizedResponse<T>>;
}
