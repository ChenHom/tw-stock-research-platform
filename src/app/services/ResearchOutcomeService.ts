import type { ResearchOutcomeRepository, ResearchRunRepository, ResearchOutcome } from '../../core/contracts/storage.js';
import type { ProviderRegistry } from '../../modules/providers/ProviderRegistry.js';
import type { MarketDailyRow } from '../../core/types/market.js';
import { toTaipeiDateString } from '../../core/utils/date.js';

export class ResearchOutcomeService {
  constructor(
    private readonly outcomeRepo: ResearchOutcomeRepository,
    private readonly runRepo: ResearchRunRepository,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  async backfillOutcomes(runId: string) {
    const run = await this.runRepo.getRunById(runId);
    if (!run) throw new Error(`[Outcome] 找不到任務: ${runId}`);

    const results = await this.runRepo.getRunResults(runId);
    if (results.length === 0) return;

    const baseDate = new Date(run.tradeDate);
    const baselineTicker = '0050';

    // 取得大盤基準價格 (T+0 與 T+5)
    const baselineEntryData = await this.fetchHistoricalPrice(baselineTicker, baseDate, 0);
    const baselineEntryPrice = baselineEntryData?.close || 0;
    const baselineT5Data = await this.fetchPriceWithRetry(baselineTicker, baseDate, 5);
    const baselineT5Price = baselineT5Data?.close || 0;

    let baselineRet5D: number | undefined;
    if (baselineEntryPrice > 0 && baselineT5Price > 0) {
      baselineRet5D = (baselineT5Price - baselineEntryPrice) / baselineEntryPrice;
    }

    for (const res of results) {
      // 1. 抓取進場價 (T+0)
      const entryPriceData = await this.fetchHistoricalPrice(res.stockId, baseDate, 0);
      const entryPrice = entryPriceData?.close || 0;

      if (entryPrice <= 0) {
        console.warn(`[Outcome] 無法取得 ${res.stockId} 在 ${run.tradeDate} 的有效價格，跳過。`);
        continue;
      }

      // 2. 抓取 T+1, T+5, T+20 (加入假日搜尋邏輯)
      const t1 = await this.fetchPriceWithRetry(res.stockId, baseDate, 1);
      const t5 = await this.fetchPriceWithRetry(res.stockId, baseDate, 5);
      const t20 = await this.fetchPriceWithRetry(res.stockId, baseDate, 20);

      const calculateReturn = (close?: number) => {
        if (!close || close <= 0) return undefined;
        const ret = (close - entryPrice) / entryPrice;
        return Number.isFinite(ret) ? ret : undefined;
      };

      const t1Ret = calculateReturn(t1?.close);
      const t5Ret = calculateReturn(t5?.close);
      const t20Ret = calculateReturn(t20?.close);

      const outcome: ResearchOutcome = {
        runId,
        stockId: res.stockId,
        action: res.finalAction,
        entryReferencePrice: entryPrice,
        tPlus1Return: t1Ret,
        tPlus5Return: t5Ret,
        tPlus20Return: t20Ret,
        isCorrectDirection: this.judgeDirection(res.finalAction, t5Ret ?? t1Ret, (t5Ret !== undefined && baselineRet5D !== undefined) ? (t5Ret - baselineRet5D) : undefined),
        baselineReturn: baselineRet5D,
        alpha: (t5Ret !== undefined && baselineRet5D !== undefined) ? (t5Ret - baselineRet5D) : undefined
      };

      await this.outcomeRepo.save(outcome);
    }
  }

  /**
   * 搜尋最近的有效交易日價格
   */
  private async fetchPriceWithRetry(stockId: string, baseDate: Date, daysLater: number): Promise<MarketDailyRow | null> {
    // 嘗試 T+N 到 T+N+3 (因應連假)
    for (let offset = 0; offset <= 3; offset++) {
      const data = await this.fetchHistoricalPrice(stockId, baseDate, daysLater + offset);
      if (data && data.close > 0) return data;
    }
    return null;
  }

  private async fetchHistoricalPrice(stockId: string, baseDate: Date, daysLater: number): Promise<MarketDailyRow | null> {
    const target = new Date(baseDate);
    target.setDate(target.getDate() + daysLater);
    const targetDateStr = toTaipeiDateString(target);
    const provider = this.providerRegistry.getByName('finmind') || this.providerRegistry.getByName('twse');
    
    try {
      const resp = await provider?.fetch({ 
        dataset: 'market_daily_history',
        stockId, 
        startDate: targetDateStr,
        endDate: targetDateStr
      }, { accountTier: 'free', useCache: true });
      const rows = resp?.data as MarketDailyRow[];
      return rows && rows.length > 0 ? rows[0] : null;
    } catch {
      return null;
    }
  }

  private judgeDirection(action: string, ret?: number, alpha?: number): boolean | undefined {
    // 優先使用超額報酬 (Alpha) 判定，若無則回退至絕對報酬 (Ret)
    const metric = alpha ?? ret;
    if (metric === undefined || !Number.isFinite(metric)) return undefined;

    if (['BUY', 'ADD'].includes(action)) return metric > 0;
    if (['SELL', 'EXIT', 'TRIM', 'BLOCK'].includes(action)) return metric < 0;

    // WATCH 不具方向性，不計入勝率
    return undefined;
  }
}
