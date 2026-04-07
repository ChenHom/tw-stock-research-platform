import type { ScreeningCriteria, ScreeningService } from './ScreeningService.js';
import type { ResearchPipelineService } from './ResearchPipelineService.js';
import type { RunResearchOutput } from '../../core/contracts/pipeline.js';
import type { BudgetSnapshot } from '../../modules/budget/RateBudgetGuard.js';

export interface CandidateResearchInput {
  criteria: ScreeningCriteria;
  tradeDate: string;
  topN?: number;
  accountTier?: 'free' | 'backer' | 'sponsor';
}

export interface CandidateResearchResult {
  stockId: string;
  preliminaryScore: number;
  research: RunResearchOutput;
}

/**
 * 候選池研究協調器 (Candidate Research Coordinator)
 * 流程：初篩 -> 取前 N 檔 -> 逐檔深度研究 -> 輸出結果
 */
export class CandidateResearchService {
  constructor(
    private readonly screeningService: ScreeningService,
    private readonly researchPipeline: ResearchPipelineService
  ) {}

  async run(
    input: CandidateResearchInput,
    budget?: BudgetSnapshot
  ): Promise<CandidateResearchResult[]> {
    const topN = input.topN || 5;
    const accountTier = input.accountTier || 'free';

    console.log(`[Coordinator] 開始候選池研究任務。條件: ${JSON.stringify(input.criteria)}, Top: ${topN}`);

    // 1. 執行初篩
    const candidates = await this.screeningService.screen(input.criteria);
    
    // 2. 取前 N 檔
    const topCandidates = candidates.slice(0, topN);
    console.log(`[Coordinator] 已從 ${candidates.length} 檔中取出前 ${topCandidates.length} 檔進行深度研究。`);

    // 3. 逐檔執行深度研究
    const results: CandidateResearchResult[] = [];

    for (const cand of topCandidates) {
      try {
        const research = await this.researchPipeline.run({
          stockId: cand.stockId,
          tradeDate: input.tradeDate,
          accountTier,
          useCache: true
        }, budget);

        results.push({
          stockId: cand.stockId,
          preliminaryScore: cand.preliminaryScore,
          research
        });
      } catch (error) {
        console.error(`[Coordinator] 深度研究失敗 (${cand.stockId}):`, error);
      }
    }

    // 依最終計分 (totalScore) 再次排序
    results.sort((a, b) => b.research.featureSnapshot.payload.totalScore - a.research.featureSnapshot.payload.totalScore);

    console.log(`[Coordinator] 候選池研究完成。產出 ${results.length} 份完整研究決策。`);
    return results;
  }
}