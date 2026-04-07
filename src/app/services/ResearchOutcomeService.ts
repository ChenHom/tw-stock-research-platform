import type { ResearchOutcomeRepository, ResearchRunRepository } from '../../core/contracts/storage.js';
import type { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';
import type { MarketDailyRow } from '../../core/types/market.js';
import { toTaipeiDateString } from '../../core/utils/date.js';

export class ResearchOutcomeService {
  constructor(
    private readonly outcomeRepo: ResearchOutcomeRepository,
    private readonly runRepo: ResearchRunRepository,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  /**
   * 為特定任務的個股回填後續成效 (T+1, T+5, T+20)
   */
  async backfillOutcomes(runId: string) {
    // 1. 取得任務資訊以獲取原始 tradeDate (P0: 正確時點基準)
    const run = await this.runRepo.getRunById(runId);
    if (!run) throw new Error(`[Outcome] 找不到任務: ${runId}`);

    const results = await this.runRepo.getRunResults(runId);
    if (results.length === 0) return;

    const baseDate = new Date(run.tradeDate);

    for (const res of results) {
      // 2. 抓取研究當天的真實收盤價 (P0: 真實進場參考價)
      const entryPriceData = await this.fetchPriceAt(res.stockId, baseDate, 0);
      const entryPrice = entryPriceData?.close || 0;

      if (entryPrice === 0) {
        console.warn(`[Outcome] 無法取得 ${res.stockId} 在 ${run.tradeDate} 的真實進場價，跳過計算。`);
        continue;
      }

      // 3. 根據 tradeDate 推算 T+1, T+5, T+20 的價量 (P0: 非 Date.now())
      const t1 = await this.fetchPriceAt(res.stockId, baseDate, 1);
      const t5 = await this.fetchPriceAt(res.stockId, baseDate, 5);
      const t20 = await this.fetchPriceAt(res.stockId, baseDate, 20);

      const outcome = {
        runId,
        stockId: res.stockId,
        action: res.finalAction,
        entryReferencePrice: entryPrice,
        tPlus1Return: t1 ? (t1.close - entryPrice) / entryPrice : undefined,
        tPlus5Return: t5 ? (t5.close - entryPrice) / entryPrice : undefined,
        tPlus20Return: t20 ? (t20.close - entryPrice) / entryPrice : undefined,
        isCorrectDirection: this.judgeDirection(res.finalAction, t5 ? (t5.close - entryPrice) : 0)
      };

      await this.outcomeRepo.save(outcome);
    }
  }

  /**
   * 從 Provider 抓取特定偏移日期的價格
   */
  private async fetchPriceAt(stockId: string, baseDate: Date, daysLater: number): Promise<MarketDailyRow | null> {
    const provider = this.providerRegistry.getByName('twse');
    
    const target = new Date(baseDate);
    target.setDate(target.getDate() + daysLater);
    const targetDateStr = toTaipeiDateString(target);
    
    try {
      const resp = await provider?.fetch({ 
        dataset: 'market_daily_latest', 
        stockId, 
        startDate: targetDateStr 
      }, { accountTier: 'free' });
      
      // 精確日期匹配 (P0)
      const rows = resp?.data as MarketDailyRow[];
      return rows.find(r => r.tradeDate === targetDateStr) || null;
    } catch {
      return null;
    }
  }

  private judgeDirection(action: string, priceDiff: number): boolean {
    if (['BUY', 'ADD', 'WATCH'].includes(action)) return priceDiff > 0;
    if (['SELL', 'EXIT', 'TRIM'].includes(action)) return priceDiff < 0;
    return false;
  }
}
