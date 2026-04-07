import type { ResearchOutcomeRepository, ResearchRunRepository } from '../../core/contracts/storage.js';
import type { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';
import type { MarketDailyRow } from '../../core/types/market.js';
import { toTaipeiDateString, getDaysAgo } from '../../core/utils/date.js';

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
    const results = await this.runRepo.getRunResults(runId);
    if (results.length === 0) return;

    for (const res of results) {
      // 抓取 T+1, T+5, T+20 的價量
      const t1 = await this.fetchPriceAt(res.stockId, 1);
      const t5 = await this.fetchPriceAt(res.stockId, 5);
      const t20 = await this.fetchPriceAt(res.stockId, 20);

      const entryPrice = res.researchTotalScore > 0 ? 100 : 100; // 此處應從 Snapshot 抓取當時收盤價，暫用 100 模擬

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

  private async fetchPriceAt(stockId: string, daysLater: number): Promise<MarketDailyRow | null> {
    const provider = this.providerRegistry.getByName('twse'); // 優先用官方快照
    const targetDate = toTaipeiDateString(new Date(Date.now() + daysLater * 24 * 60 * 60 * 1000));
    
    try {
      const resp = await provider?.fetch({ dataset: 'market_daily_latest', stockId, startDate: targetDate }, { accountTier: 'free' });
      return (resp?.data?.[0] as MarketDailyRow) || null;
    } catch {
      return null;
    }
  }

  private judgeDirection(action: string, diff: number): boolean {
    if (action === 'BUY' || action === 'ADD' || action === 'WATCH') return diff > 0;
    if (action === 'SELL' || action === 'EXIT' || action === 'TRIM') return diff < 0;
    return false;
  }
}
