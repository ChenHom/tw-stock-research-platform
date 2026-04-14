import type { RunResearchOutput } from '../../core/contracts/pipeline.js';
import type { AccountTier } from '../../core/types/common.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import type { BudgetSnapshot } from '../../modules/budget/RateBudgetGuard.js';
import type { ResearchPipelineService } from './ResearchPipelineService.js';

export interface ResearchRangeInput {
  stockId: string;
  startDate: string;
  endDate: string;
  accountTier?: AccountTier;
  useCache?: boolean;
  hasPosition?: boolean;
  includeCalendarDays?: boolean;
}

export interface ResearchRangeDayResult {
  tradeDate: string;
  action: string;
  confidence: number;
  thesisStatus: string;
  totalScore: number;
  closePrice: number;
  ma20: number;
  institutionalNet: number;
  revenueYoy: number;
  missingFields: string[];
  summary: string;
  isNonTradingDay: boolean;
  output: RunResearchOutput;
}

export interface ResearchRangeResult {
  stockId: string;
  startDate: string;
  endDate: string;
  days: ResearchRangeDayResult[];
  summary: {
    requestedDays: number;
    totalDays: number;
    skippedNonTradingDays: number;
    buyCount: number;
    watchCount: number;
    blockCount: number;
    actionableDays: number;
    degradedDays: number;
  };
}

export class ResearchRangeService {
  constructor(private readonly researchPipeline: ResearchPipelineService) {}

  async run(input: ResearchRangeInput, budget?: BudgetSnapshot): Promise<ResearchRangeResult> {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('日期格式錯誤。請使用 YYYY-MM-DD。');
    }

    if (start > end) {
      throw new Error('開始日期不可晚於結束日期。');
    }

    const days: ResearchRangeDayResult[] = [];
    const current = new Date(start);
    const requestedDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    let skippedNonTradingDays = 0;

    while (current <= end) {
      const tradeDate = toTaipeiDateString(current);
      const output = await this.researchPipeline.run({
        stockId: input.stockId,
        tradeDate,
        accountTier: input.accountTier || 'free',
        useCache: input.useCache ?? true,
        hasPosition: input.hasPosition ?? false
      }, budget);

      const isNonTradingDay = output.diagnostics?.isNonTradingDay ?? false;
      if (isNonTradingDay && !input.includeCalendarDays) {
        skippedNonTradingDays += 1;
        current.setDate(current.getDate() + 1);
        continue;
      }

      days.push({
        tradeDate,
        action: output.finalDecision.action,
        confidence: Number(output.finalDecision.confidence.toFixed(4)),
        thesisStatus: output.thesisStatus,
        totalScore: Number(output.featureSnapshot.payload.totalScore.toFixed(2)),
        closePrice: output.featureSnapshot.payload.closePrice,
        ma20: output.featureSnapshot.payload.ma20,
        institutionalNet: output.featureSnapshot.payload.institutionalNet,
        revenueYoy: output.featureSnapshot.payload.revenueYoy,
        missingFields: output.featureSnapshot.payload.missingFields,
        summary: output.finalDecision.summary,
        isNonTradingDay,
        output
      });

      current.setDate(current.getDate() + 1);
    }

    return {
      stockId: input.stockId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      summary: {
        requestedDays,
        totalDays: days.length,
        skippedNonTradingDays,
        buyCount: days.filter(day => day.action === 'BUY').length,
        watchCount: days.filter(day => day.action === 'WATCH').length,
        blockCount: days.filter(day => day.action === 'BLOCK').length,
        actionableDays: days.filter(day => ['BUY', 'ADD', 'TRIM', 'SELL', 'EXIT', 'BLOCK'].includes(day.action)).length,
        degradedDays: days.filter(day => day.missingFields.length > 0).length
      }
    };
  }
}
