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
    if (!Array.isArray(raw) || raw.length === 0) return [];
    
    try {
      switch (dataset) {
        case 'market_daily_latest':
        case 'market_daily_history':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            open: parseFloat(r.open) || 0,
            high: parseFloat(r.max) || 0,
            low: parseFloat(r.min) || 0,
            close: parseFloat(r.close) || 0,
            volume: parseInt(r.Trading_Volume, 10) || 0,
            turnover: parseInt(r.Trading_money, 10) || 0,
            transactionCount: parseInt(r.Trading_turnover, 10) || 0
          }));

        case 'month_revenue': {
          // 排序以方便計算 YoY (假設 raw 包含足夠歷史)
          const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
          return sorted.map((r, index) => {
            const currentRevenue = parseFloat(r.revenue) || 0;
            // 嘗試尋找 12 個月前的資料計算 YoY
            const lastYear = sorted.find(prev => {
              const d1 = new Date(r.date);
              const d2 = new Date(prev.date);
              return d1.getFullYear() === d2.getFullYear() + 1 && d1.getMonth() === d2.getMonth();
            });
            const prevRevenue = lastYear ? parseFloat(lastYear.revenue) : 0;
            
            return {
              stockId: r.stock_id || '',
              yearMonth: `${r.revenue_year}-${(r.revenue_month || 0).toString().padStart(2, '0')}`,
              revenue: currentRevenue,
              revenueYoy: prevRevenue > 0 ? (currentRevenue - prevRevenue) / prevRevenue : 0,
              revenueMom: index > 0 ? (currentRevenue - parseFloat(sorted[index-1].revenue)) / parseFloat(sorted[index-1].revenue) : 0
            };
          });
        }

        case 'institutional_flow': {
          // 按日期聚合 (三大法人合計)
          const groups = new Map<string, any>();
          for (const r of raw) {
            const date = r.date;
            if (!groups.has(date)) {
              groups.set(date, { stockId: r.stock_id, tradeDate: date, foreignNet: 0, trustNet: 0, dealerNet: 0, totalNet: 0 });
            }
            const g = groups.get(date);
            const net = (parseFloat(r.buy) || 0) - (parseFloat(r.sell) || 0);
            if (r.name === 'Foreign_Investor') g.foreignNet += net;
            if (r.name === 'Investment_Trust') g.trustNet += net;
            if (r.name === 'Dealer') g.dealerNet += net;
            g.totalNet += net;
          }
          return Array.from(groups.values());
        }

        case 'margin_short':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            marginBalance: parseFloat(r.MarginPurchaseTodayBalance) || 0,
            shortBalance: parseFloat(r.ShortSaleTodayBalance) || 0,
            marginChange: parseFloat(r.MarginPurchaseTodayBalance) - parseFloat(r.MarginPurchaseYesterdayBalance),
            shortChange: parseFloat(r.ShortSaleTodayBalance) - parseFloat(r.ShortSaleYesterdayBalance)
          }));

        case 'daily_valuation':
          return raw.map(r => ({
            stockId: r.stock_id || '',
            tradeDate: r.date || '',
            peRatio: parseFloat(r.PER) || 0,
            pbRatio: parseFloat(r.PBR) || 0,
            dividendYield: parseFloat(r.dividend_yield) || 0
          }));

        case 'financial_statements': {
          const groups = new Map<string, any>();
          for (const r of raw) {
            const date = r.date;
            if (!groups.has(date)) {
              groups.set(date, { 
                stockId: r.stock_id, 
                date: date, 
                year: parseInt(date.split('-')[0], 10),
                quarter: r.type.includes('Q') ? r.type : 'N/A', // 有些資料集會帶 Q1, Q2
                entries: {} as Record<string, number> 
              });
            }
            const g = groups.get(date);
            const val = parseFloat(r.value) || 0;
            g.entries[r.type] = val;
            
            // 提取核心欄位方便後續使用
            if (r.type === 'EPS' || r.type === '每股盈餘') g.eps = val;
            if (r.type === 'ROE' || r.type === '股東權益報酬率') g.roe = val;
            if (r.type === 'Revenue' || r.type === '營業收入') g.revenue = val;
            if (r.type === 'GrossProfit' || r.type === '營業毛利') g.grossProfit = val;
            if (r.type === 'OperatingIncome' || r.type === '營業利益') g.operatingIncome = val;
          }
          return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
        }

        default:
          return raw;
      }
    } catch (error) {
      console.error(`[FinMind] 正規化失敗 (${dataset}):`, error);
      return [];
    }
  }
}
