import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse, SourceMetadata } from '../../../core/types/provider.js';
import type { MarketDailyRow, MonthRevenueRow, FinancialStatementRow, InstitutionalFlowRow, MarginShortRow, NewsRow } from '../../../core/types/market.js';
import type { CacheStore } from '../../cache/CacheEnvelope.js';
import { CacheKeyFactory } from '../../cache/CacheKeyFactory.js';
import { DATASET_CAPABILITIES } from '../../../config/datasets.js';

export class FinMindProvider implements DataProvider<
  MarketDailyRow | MonthRevenueRow | FinancialStatementRow | InstitutionalFlowRow | MarginShortRow | NewsRow
> {
  readonly providerName = 'finmind';
  private readonly baseUrl = 'https://api.finmindtrade.com/api/v4/data';
  private readonly token = process.env.FINMIND_API_TOKEN;
  private readonly normalizationVersion = '1.0.0';

  constructor(private readonly cache?: CacheStore) {}

  supports(dataset: string): boolean {
    return [
      'market_daily',
      'month_revenue',
      'financial_statements',
      'institutional_flow',
      'margin_short',
      'stock_news'
    ].includes(dataset);
  }

  async fetch(
    query: DatasetQuery,
    context: FetchContext
  ): Promise<NormalizedResponse<any>> {
    const { dataset } = query;
    const cacheKey = CacheKeyFactory.create(dataset, context.accountTier, query.stockId, query.startDate);

    // 1. 檢查快取
    if (this.cache && context.useCache !== false) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) {
        return {
          ...cached.response,
          source: { ...cached.response.source, isCacheHit: true }
        };
      }
    }

    // 2. 準備 FinMind API 參數
    const datasetMap: Record<string, string> = {
      'market_daily': 'TaiwanStockPrice',
      'month_revenue': 'TaiwanStockMonthRevenue',
      'financial_statements': 'TaiwanStockFinancialStatements',
      'institutional_flow': 'TaiwanStockInstitutionalInvestorsBuySell',
      'margin_short': 'TaiwanStockMarginPurchaseShortSale',
      'stock_news': 'TaiwanStockNews'
    };

    const finmindDataset = datasetMap[dataset];
    if (!finmindDataset) throw new Error(`[FinMind] 不支援的資料集: ${dataset}`);

    const params = new URLSearchParams({
      dataset: finmindDataset,
      data_id: query.stockId || '',
      start_date: query.startDate || new Date().toISOString().split('T')[0],
      token: this.token || ''
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const json = await response.json() as { data: any[] };
      const data = this.normalize(dataset, json.data);

      const source: SourceMetadata = {
        provider: this.providerName,
        dataset,
        fetchedAt: new Date().toISOString(),
        normalizationVersion: this.normalizationVersion,
        isFallback: false,
        isCacheHit: false,
        isStale: false,
        accountTier: context.accountTier,
        queryMode: query.stockId ? 'per_stock' : 'bulk'
      };

      const result = { data, source };

      // 3. 寫入快取
      if (this.cache) {
        const capability = DATASET_CAPABILITIES.find(c => c.dataset === dataset);
        const ttl = capability?.cacheTtlSeconds || 3600;
        await this.cache.set(cacheKey, {
          response: result,
          expiresAt: Date.now() + ttl * 1000,
          createdAt: Date.now()
        }, ttl);
      }

      return result;
    } catch (error: any) {
      console.error(`[FinMind] 抓取失敗: ${error.message}`);
      throw error;
    }
  }

  private normalize(dataset: string, raw: any[]): any[] {
    switch (dataset) {
      case 'market_daily':
        return raw.map(r => ({
          stockId: r.stock_id,
          tradeDate: r.date,
          open: r.open, high: r.high, low: r.low, close: r.close,
          volume: r.Trading_Volume, turnover: r.Trading_money, transactionCount: r.Trading_turnover
        }));
      case 'month_revenue':
        return raw.map(r => ({
          stockId: r.stock_id,
          yearMonth: `${r.revenue_year}-${r.revenue_month.toString().padStart(2, '0')}`,
          revenue: r.revenue, revenueYoy: r.revenue_year_growth / 100, revenueMom: r.revenue_month_growth / 100
        }));
      // 其他資料集暫不詳列，依此類推
      default:
        return raw;
    }
  }
}
