import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse, SourceMetadata } from '../../../core/types/provider.js';
import type { MarketDailyRow, ValuationDailyRow } from '../../../core/types/market.js';
import type { CacheStore } from '../../cache/CacheEnvelope.js';
import { CacheKeyFactory } from '../../cache/CacheKeyFactory.js';
import { DATASET_CAPABILITIES } from '../../../config/datasets.js';

export class TwseOpenApiProvider implements DataProvider<MarketDailyRow | ValuationDailyRow> {
  readonly providerName = 'twse';
  private readonly baseUrl = 'https://openapi.twse.com.tw/v1';
  private readonly normalizationVersion = '1.0.0';

  constructor(private readonly cache?: CacheStore) {}

  supports(dataset: string): boolean {
    return ['market_daily', 'daily_valuation'].includes(dataset);
  }

  async fetch(
    query: DatasetQuery,
    context: FetchContext
  ): Promise<NormalizedResponse<MarketDailyRow | ValuationDailyRow>> {
    const { dataset } = query;
    const mode = context.accountTier; // 使用 tier 作為快取區隔的一部分
    const cacheKey = CacheKeyFactory.create(dataset, mode, query.stockId, new Date().toISOString().split('T')[0]);

    // 1. 檢查快取
    if (this.cache && context.useCache !== false) {
      const cached = await this.cache.get<MarketDailyRow | ValuationDailyRow>(cacheKey);
      if (cached) {
        return {
          ...cached.response,
          source: { ...cached.response.source, isCacheHit: true }
        };
      }
    }

    let endpoint = '';
    if (dataset === 'market_daily') {
      endpoint = '/exchangeReport/STOCK_DAY_ALL';
    } else if (dataset === 'daily_valuation') {
      endpoint = '/exchangeReport/BWIBYK_ALL';
    } else {
      throw new Error(`[TWSE] 不支援的資料集: ${dataset}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const rawData = await response.json() as any[];
      const data = this.normalize(dataset, rawData, query.stockId);

      const source: SourceMetadata = {
        provider: this.providerName,
        dataset,
        fetchedAt: new Date().toISOString(),
        asOf: new Date().toISOString().split('T')[0],
        normalizationVersion: this.normalizationVersion,
        isFallback: false,
        isCacheHit: false,
        isStale: false,
        queryMode: 'bulk'
      };

      const result = { data, source };

      // 2. 寫入快取
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
      console.error(`[TWSE] 抓取失敗: ${error.message}`);
      throw error;
    }
  }

  private normalize(dataset: string, raw: any[], stockId?: string): any[] {
    // 若有提供 stockId，則進行過濾
    const filtered = stockId ? raw.filter(r => (r.Code || r.證券代號) === stockId) : raw;

    if (dataset === 'market_daily') {
      return filtered.map(r => ({
        stockId: r.Code || r.證券代號,
        tradeDate: new Date().toISOString().split('T')[0],
        open: parseFloat(r.OpeningPrice || r.開盤價) || 0,
        high: parseFloat(r.HighestPrice || r.最高價) || 0,
        low: parseFloat(r.LowestPrice || r.最低價) || 0,
        close: parseFloat(r.ClosingPrice || r.收盤價) || 0,
        volume: parseInt(r.TradeVolume || r.成交股數, 10) || 0,
        turnover: parseInt(r.TradeValue || r.成交金額, 10) || 0,
        transactionCount: parseInt(r.Transaction || r.成交筆數, 10) || 0
      }));
    }

    if (dataset === 'daily_valuation') {
      return filtered.map(r => ({
        stockId: r.Code || r.證券代號,
        tradeDate: new Date().toISOString().split('T')[0],
        peRatio: parseFloat(r.PEratio || r.本益比) || 0,
        pbRatio: parseFloat(r.PBRatio || r.股價淨值比) || 0,
        dividendYield: parseFloat(r.YieldYield || r.殖利率) || 0
      }));
    }

    return [];
  }
}
