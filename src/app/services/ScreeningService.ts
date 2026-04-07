import type { MarketDailyRow, ValuationDailyRow } from '../../core/types/market.js';
import type { DatasetRouter } from '../../core/contracts/router.js';
import type { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';

export interface ScreeningCriteria {
  minVolume?: number;
  maxPe?: number;
  minPe?: number;
  minYield?: number;
  maxPb?: number;
}

export interface ScreenedStock {
  stockId: string;
  close: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  volume: number;
}

export class ScreeningService {
  constructor(
    private readonly router: DatasetRouter,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  /**
   * 執行全市場初篩：找出值得進一步跑研究 Pipeline 的候選股
   */
  async screen(criteria: ScreeningCriteria): Promise<ScreenedStock[]> {
    console.log('[Screening] 正在執行全市場快照掃描...');

    // 1. 取得路由與抓取資料 (優先採用 TWSE Bulk)
    const marketResp = await this.fetchDataset('market_daily_latest');
    const valuationResp = await this.fetchDataset('daily_valuation');

    if (!marketResp || !valuationResp) {
      throw new Error('[Screening] 無法取得必要的全市場資料進行篩選。');
    }

    const marketData = marketResp.data as MarketDailyRow[];
    const valuationData = valuationResp.data as ValuationDailyRow[];

    // 2. 執行過濾邏輯
    const results: ScreenedStock[] = [];
    const valuationMap = new Map(valuationData.map(v => [v.stockId, v]));

    for (const m of marketData) {
      const v = valuationMap.get(m.stockId);
      if (!v) continue;

      // 應用過濾條件 (漏斗第一層)
      if (criteria.minVolume && m.volume < criteria.minVolume) continue;
      if (criteria.maxPe && (v.peRatio === 0 || v.peRatio > criteria.maxPe)) continue;
      if (criteria.minPe && v.peRatio < criteria.minPe) continue;
      if (criteria.maxPb && (v.pbRatio === 0 || v.pbRatio > criteria.maxPb)) continue;
      if (criteria.minYield && v.dividendYield < criteria.minYield) continue;

      results.push({
        stockId: m.stockId,
        close: m.close,
        peRatio: v.peRatio,
        pbRatio: v.pbRatio,
        dividendYield: v.dividendYield,
        volume: m.volume
      });
    }

    console.log(`[Screening] 篩選完成。從全市場中找出 ${results.length} 檔符合初步條件的股票。`);
    return results;
  }

  private async fetchDataset(dataset: string) {
    const routing = this.router.decide(dataset, 'free'); // 篩選通常走 free bulk 即可
    for (const providerName of routing.finalProviderOrder) {
      const provider = this.providerRegistry.getByName(providerName);
      if (provider?.supports(dataset)) {
        try {
          return await provider.fetch({ dataset }, { accountTier: 'free' });
        } catch (e) {
          console.error(`[Screening] Provider ${providerName} fetch failed for ${dataset}`);
        }
      }
    }
    return null;
  }
}
