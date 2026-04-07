import type { MarketDailyRow, ValuationDailyRow, InstitutionalFlowRow, MonthRevenueRow } from '../../core/types/market.js';
import type { DatasetRouter } from '../../core/contracts/router.js';
import type { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';

export interface ScreeningCriteria {
  // 基礎門檻
  minVolume?: number;
  maxPe?: number;
  maxPb?: number;
  minYield?: number;
  // 進階動能與籌碼 (產品第一層篩選核心)
  minRevenueYoy?: number;      // 營收成長率
  minInstitutionalNet?: number; // 法人累計買賣
  minTotalScore?: number;      // 內部預估總分門檻
}

export interface ScreenedStock {
  stockId: string;
  close: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  volume: number;
  revenueYoy: number;
  institutionalNet: number;
  preliminaryScore: number;
}

export class ScreeningService {
  constructor(
    private readonly router: DatasetRouter,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  /**
   * 執行候選池篩選：結合量價、估值、營收與籌碼
   */
  async screen(criteria: ScreeningCriteria): Promise<ScreenedStock[]> {
    console.log('[Screening] 正在執行多維度候選池掃描...');

    // 1. 抓取必要資料集 (僅限支援 Bulk 模式的 TWSE 資料)
    // 注意：營收與法人在 Free Tier 下無法 Bulk 抓取，改由單檔 Research Pipeline 補強
    const [marketResp, valuationResp] = await Promise.all([
      this.fetchDataset('market_daily_latest'),
      this.fetchDataset('daily_valuation')
    ]);

    if (!marketResp || !valuationResp) throw new Error('[Screening] 無法取得基礎量價或估值資料。');

    // 2. 建立資料索引 Map
    const valuationMap = new Map((valuationResp.data as ValuationDailyRow[]).map(v => [v.stockId, v]));

    // 3. 執行過濾 (第一層：量價與估值)
    const results: ScreenedStock[] = [];
    for (const m of marketResp.data as MarketDailyRow[]) {
      const v = valuationMap.get(m.stockId);
      if (!v) continue;

      // --- A. 基礎量價與估值過濾 ---
      if (criteria.minVolume && m.volume < criteria.minVolume) continue;
      if (criteria.maxPe && (v.peRatio === 0 || v.peRatio > criteria.maxPe)) continue;
      if (criteria.maxPb && (v.pbRatio === 0 || v.pbRatio > criteria.maxPb)) continue;
      if (criteria.minYield && v.dividendYield < criteria.minYield) continue;

      // --- B. 營收與籌碼 (初篩階段暫不具備資料，留待單檔 Research 補強) ---
      const revenueYoy = 0;
      const institutionalNet = 0;

      // --- C. 計算初步研究分數 (僅依據現有資料) ---
      let preliminaryScore = 0;
      if (v.peRatio < 15 && v.peRatio > 0) preliminaryScore += 40;
      if (v.dividendYield > 5) preliminaryScore += 30;
      if (m.volume > 2000) preliminaryScore += 30;

      if (criteria.minTotalScore && preliminaryScore < criteria.minTotalScore) continue;

      results.push({
        stockId: m.stockId,
        close: m.close,
        peRatio: v.peRatio,
        pbRatio: v.pbRatio,
        dividendYield: v.dividendYield,
        volume: m.volume,
        revenueYoy,
        institutionalNet,
        preliminaryScore
      });
    }

    // 依初步分數排序
    results.sort((a, b) => b.preliminaryScore - a.preliminaryScore);

    console.log(`[Screening] 掃描完成。從市場中篩選出 ${results.length} 檔具備研究價值的候選股。`);
    return results;
  }

  private async fetchDataset(dataset: string) {
    const routing = this.router.decide(dataset, 'free');
    for (const providerName of routing.finalProviderOrder) {
      const provider = this.providerRegistry.getByName(providerName);
      if (provider?.supports(dataset)) {
        try {
          return await provider.fetch({ dataset }, { accountTier: 'free' });
        } catch (e) {
          // 靜默失敗，嘗試下一個 provider
        }
      }
    }
    return null;
  }
}
