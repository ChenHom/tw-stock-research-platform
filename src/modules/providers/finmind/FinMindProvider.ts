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
    switch (dataset) {
      case 'market_daily_latest':
      case 'market_daily_history':
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
      case 'institutional_flow':
        return raw.map(r => ({
          stockId: r.stock_id,
          tradeDate: r.date,
          foreignNet: r.Foreign_Investor_Buy - r.Foreign_Investor_Sell,
          trustNet: r.Investment_Trust_Buy - r.Investment_Trust_Sell,
          dealerNet: r.Dealer_Buy - r.Dealer_Sell,
          totalNet: r.diff
        }));
      case 'margin_short':
        return raw.map(r => ({
          stockId: r.stock_id,
          tradeDate: r.date,
          marginBalance: r.MarginPurchaseBalance,
          shortBalance: r.ShortSaleBalance,
          marginChange: r.MarginPurchaseLimit, // 這裡需依實際欄位調整，暫用 Limit 代表規模
          shortChange: r.ShortSaleLimit
        }));
      case 'financial_statements':
        return raw.map(r => ({
          stockId: r.stock_id,
          year: r.date.split('-')[0],
          quarter: r.type, // 例如 Q1, Q2
          revenue: r.value, // FinMind 財報是按科目分行，此處簡化處理
          grossProfit: 0, 
          operatingIncome: 0,
          netIncome: 0,
          eps: 0
        }));
      case 'daily_valuation':
        return raw.map(r => ({
          stockId: r.stock_id,
          tradeDate: r.date,
          peRatio: r.p_e_ratio,
          pbRatio: r.p_b_ratio,
          dividendYield: r.dividend_yield
        }));
      default:
        return raw;
    }
  }
}
