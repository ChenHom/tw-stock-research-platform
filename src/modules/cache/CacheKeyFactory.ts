export class CacheKeyFactory {
  static marketDaily(stockId: string, date: string): string {
    return `market_daily:${stockId}:${date}`;
  }

  static valuationDaily(stockId: string, date: string): string {
    return `valuation_daily:${stockId}:${date}`;
  }

  static monthRevenue(stockId: string, month: string): string {
    return `month_revenue:${stockId}:${month}`;
  }

  static financialStatements(stockId: string, fiscalYear: number, fiscalQuarter: number): string {
    return `financials:${stockId}:${fiscalYear}Q${fiscalQuarter}`;
  }

  static news(keyword: string, hourBucket: string): string {
    return `news:${keyword.toLowerCase()}:${hourBucket}`;
  }
}
