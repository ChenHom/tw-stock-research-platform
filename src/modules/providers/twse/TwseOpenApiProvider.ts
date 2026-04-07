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
    const mode = context.accountTier; 
    const queryDate = query.startDate || this.toTaipeiDate(new Date());
    const cacheKey = CacheKeyFactory.create(dataset, mode, query.stockId, queryDate);

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
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`回傳格式錯誤: 預期 JSON 但收到 ${contentType}`);
      }

      const rawData = await response.json() as any[];
      const data = this.normalize(dataset, rawData, query.stockId, queryDate);

      const source: SourceMetadata = {
        provider: this.providerName,
        dataset,
        fetchedAt: new Date().toISOString(),
        asOf: queryDate,
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

  private toTaipeiDate(date: Date): string {
    return new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date).replace(/\//g, '-');
  }

  private normalize(dataset: string, raw: any[], stockId?: string, tradeDate?: string): any[] {
    const filtered = stockId ? raw.filter(r => r.Code === stockId) : raw;
    const finalDate = tradeDate || this.toTaipeiDate(new Date());

    if (dataset === 'market_daily_latest') {
      return filtered.map(r => ({
        stockId: r.Code,
        tradeDate: finalDate,
        open: parseFloat(r.OpeningPrice) || 0,
        high: parseFloat(r.HighestPrice) || 0,
        low: parseFloat(r.LowestPrice) || 0,
        close: parseFloat(r.ClosingPrice) || 0,
        volume: parseInt(r.TradeVolume, 10) || 0,
        turnover: parseInt(r.TradeValue, 10) || 0,
        transactionCount: parseInt(r.Transaction, 10) || 0
      }));
    }

    if (dataset === 'daily_valuation') {
      return filtered.map(r => ({
        stockId: r.Code,
        tradeDate: finalDate,
        peRatio: parseFloat(r.PEratio) || 0,
        pbRatio: parseFloat(r.PBratio) || 0,
        dividendYield: parseFloat(r.DividendYield) || 0
      }));
    }

    return [];
  }
}
