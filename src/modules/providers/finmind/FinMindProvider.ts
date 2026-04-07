import type { DataProvider, DatasetQuery } from '../../../core/contracts/provider.js';
import type { FetchContext, NormalizedResponse, SourceMetadata } from '../../../core/types/provider.js';
import type { 
  MarketDailyRow, 
  MonthRevenueRow, 
  FinancialStatementRow, 
  InstitutionalFlowRow, 
  MarginShortRow, 
  NewsRow,
  ValuationDailyRow
} from '../../../core/types/market.js';
import type { CacheStore } from '../../cache/CacheEnvelope.js';
import { CacheKeyFactory } from '../../cache/CacheKeyFactory.js';
import { DATASET_CAPABILITIES } from '../../../config/datasets.js';

export class FinMindProvider implements DataProvider<
  MarketDailyRow | MonthRevenueRow | FinancialStatementRow | InstitutionalFlowRow | MarginShortRow | NewsRow | ValuationDailyRow
> {
  readonly providerName = 'finmind';
  private readonly baseUrl = 'https://api.finmindtrade.com/api/v4/data';
  private readonly token = process.env.FINMIND_API_TOKEN;
  private readonly normalizationVersion = '1.1.0';

  constructor(private readonly cache?: CacheStore) {}

  supports(dataset: string): boolean {
    return [
      'market_daily_latest',
      'market_daily_history',
      'month_revenue',
      'financial_statements',
      'institutional_flow',
      'margin_short',
      'stock_news',
      'daily_valuation'
    ].includes(dataset);
  }

  async fetch(
    query: DatasetQuery,
    context: FetchContext
  ): Promise<NormalizedResponse<any>> {
    const { dataset } = query;
    const cacheKey = CacheKeyFactory.create(dataset, context.accountTier, query.stockId, query.startDate);

    if (this.cache && context.useCache !== false) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) return { ...cached.response, source: { ...cached.response.source, isCacheHit: true } };
    }

    const datasetMap: Record<string, string> = {
      'market_daily_latest': 'TaiwanStockPrice',
      'market_daily_history': 'TaiwanStockPrice',
      'month_revenue': 'TaiwanStockMonthRevenue',
      'financial_statements': 'TaiwanStockFinancialStatements',
      'institutional_flow': 'TaiwanStockInstitutionalInvestorsBuySell',
      'margin_short': 'TaiwanStockMarginPurchaseShortSale',
      'stock_news': 'TaiwanStockNews',
      'daily_valuation': 'TaiwanStockPER'
    };

    const finmindDataset = datasetMap[dataset];
    if (!finmindDataset) throw new Error(`[FinMind] 不支援的資料集: ${dataset}`);

    // 強制 Free Tier 邏輯：必須帶 stockId (P0-2)
    const stockId = (context.accountTier === 'free') ? (query.stockId || '2330') : query.stockId;

    const params = new URLSearchParams({
      dataset: finmindDataset,
      data_id: stockId || '',
      start_date: query.startDate || '',
      end_date: query.endDate || ''
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.token || ''}`
        }
      });

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
        queryMode: stockId ? 'per_stock' : 'bulk'
      };

      const result = { data, source };

      if (this.cache) {
        const cap = DATASET_CAPABILITIES.find(c => c.dataset === dataset);
        const ttl = cap?.cacheTtlSeconds || 3600;
        await this.cache.set(cacheKey, { response: result, expiresAt: Date.now() + ttl * 1000, createdAt: Date.now() }, ttl);
      }

      return result;
    } catch (error: any) {
      console.error(`[FinMind] 抓取失敗: ${error.message}`);
      throw error;
    }
  }

  private normalize(dataset: string, raw: any[]): any[] {
    if (!Array.isArray(raw)) return [];
    
    try {
      switch (dataset) {
        case 'market_daily_latest':
        case 'market_daily_history':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            open: parseFloat(r.open) || 0,
            high: parseFloat(r.high) || 0,
            low: parseFloat(r.low) || 0,
            close: parseFloat(r.close) || 0,
            volume: parseInt(r.Trading_Volume, 10) || 0,
            turnover: parseInt(r.Trading_money, 10) || 0,
            transactionCount: parseInt(r.Trading_turnover, 10) || 0
          }));
        case 'month_revenue':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            yearMonth: `${r.revenue_year}-${(r.revenue_month || 0).toString().padStart(2, '0')}`,
            revenue: parseFloat(r.revenue) || 0,
            revenueYoy: (parseFloat(r.revenue_year_growth) || 0) / 100,
            revenueMom: (parseFloat(r.revenue_month_growth) || 0) / 100
          }));
        case 'institutional_flow':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            foreignNet: (parseFloat(r.Foreign_Investor_Buy) || 0) - (parseFloat(r.Foreign_Investor_Sell) || 0),
            trustNet: (parseFloat(r.Investment_Trust_Buy) || 0) - (parseFloat(r.Investment_Trust_Sell) || 0),
            dealerNet: (parseFloat(r.Dealer_Buy) || 0) - (parseFloat(r.Dealer_Sell) || 0),
            totalNet: parseFloat(r.diff) || 0
          }));
        case 'margin_short':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            marginBalance: parseFloat(r.MarginPurchaseBalance) || 0,
            shortBalance: parseFloat(r.ShortSaleBalance) || 0,
            marginChange: 0, // FinMind 融資融券無直接增減欄位，需從 history 計算
            shortChange: 0
          }));
        case 'financial_statements':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            year: parseInt(r.date?.split('-')[0], 10) || 0,
            quarter: r.type || '',
            revenue: parseFloat(r.value) || 0,
            grossProfit: 0, 
            operatingIncome: 0,
            netIncome: 0,
            eps: 0
          }));
        case 'daily_valuation':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            peRatio: parseFloat(r.p_e_ratio) || 0,
            pbRatio: parseFloat(r.p_b_ratio) || 0,
            dividendYield: parseFloat(r.dividend_yield) || 0
          }));
        default:
          return raw;
      }
    } catch (error) {
      console.error(`[FinMind] 正規化失敗 (${dataset}):`, error);
      return [];
    }
  }
}
