export class CacheKeyFactory {
  /**
   * 格式：provider:dataset:mode:stockId:asOf
   */
  static create(provider: string, dataset: string, mode: string, stockId?: string, asOf?: string): string {
    const parts = [provider, dataset, mode];
    if (stockId) parts.push(stockId);
    if (asOf) parts.push(asOf);
    return parts.join(':');
  }
}
