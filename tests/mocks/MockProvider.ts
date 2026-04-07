import type { DataProvider, DatasetQuery } from '../../src/core/contracts/provider.js';
import type { FetchContext, NormalizedResponse, SourceMetadata } from '../../src/core/types/provider.js';

export class MockProvider implements DataProvider<any> {
  readonly providerName = 'mock';

  constructor(private readonly mockDataMap: Record<string, any[]> = {}) {}

  supports(): boolean { return true; }

  async fetch(query: DatasetQuery): Promise<NormalizedResponse<any>> {
    const data = this.mockDataMap[query.dataset] || [];
    
    const source: SourceMetadata = {
      provider: 'mock',
      dataset: query.dataset,
      fetchedAt: new Date().toISOString(),
      normalizationVersion: '1.0.0',
      isFallback: false,
      isCacheHit: false,
      isStale: false,
      queryMode: 'per_stock'
    };

    return { data, source };
  }
}
