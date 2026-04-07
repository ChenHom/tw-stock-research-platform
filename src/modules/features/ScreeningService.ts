import type { MarketDailyRow, ValuationDailyRow } from '../../core/types/market.js';
import type { TwseOpenApiProvider } from '../providers/twse/TwseOpenApiProvider.js';

export interface ScreeningCriteria {
  minVolume?: number;
  maxPe?: number;
  minPe?: number;
  minYield?: number;
}

export interface ScreenedStock {
  stockId: string;
  close: number;
  peRatio: number;
  dividendYield: number;
  volume: number;
}

export class ScreeningService {
  constructor(private readonly twseProvider: TwseOpenApiProvider) {}

  /**
   * 執行全市場篩選
   */
  async screen(criteria: ScreeningCriteria): Promise<ScreenedStock[]> {
    console.log('[Screening] 開始執行全市場篩選...');

    // 1. 抓取當日全市場快照
    const marketResp = await this.twseProvider.fetch({ dataset: 'market_daily_latest' }, { accountTier: 'free' });
    const valuationResp = await this.twseProvider.fetch({ dataset: 'daily_valuation' }, { accountTier: 'free' });

    const marketData = marketResp.data as MarketDailyRow[];
    const valuationData = valuationResp.data as ValuationDailyRow[];

    // 2. 合併資料並篩選
    const results: ScreenedStock[] = [];

    for (const v of valuationData) {
      const m = marketData.find(row => row.stockId === v.stockId);
      if (!m) continue;

      // 應用篩選條件
      if (criteria.minVolume && m.volume < criteria.minVolume) continue;
      if (criteria.maxPe && (v.peRatio === 0 || v.peRatio > criteria.maxPe)) continue;
      if (criteria.minPe && v.peRatio < criteria.minPe) continue;
      if (criteria.minYield && v.dividendYield < criteria.minYield) continue;

      results.push({
        stockId: v.stockId,
        close: m.close,
        peRatio: v.peRatio,
        dividendYield: v.dividendYield,
        volume: m.volume
      });
    }

    console.log(`[Screening] 篩選完成。從全市場中篩選出 ${results.length} 檔符合條件的股票。`);
    return results;
  }
}
