export class CacheKeyFactory {
  /**
   * 格式：dataset:mode:stockId:asOf
   */
  static create(dataset: string, mode: string, stockId?: string, asOf?: string): string {
    const parts = [dataset, mode];
    if (stockId) parts.push(stockId);
    if (asOf) parts.push(asOf);
    return parts.join(':');
  }
}
