import { randomUUID } from 'node:crypto';
import type { ScreeningCriteria, ScreeningService } from './ScreeningService.js';
import type { ResearchPipelineService } from './ResearchPipelineService.js';
import type { RunResearchOutput } from '../../core/contracts/pipeline.js';
import type { BudgetSnapshot } from '../../modules/budget/RateBudgetGuard.js';
import type { ResearchRunRepository, CandidateResearchResultRecord } from '../../core/contracts/storage.js';

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
 * 流程：建立 Run -> 初篩 -> 取前 N 檔 -> 逐檔深度研究 -> 儲存結果 -> 更新 Run 狀態
 */
export class CandidateResearchService {
  constructor(
    private readonly screeningService: ScreeningService,
    private readonly researchPipeline: ResearchPipelineService,
    private readonly researchRunRepo: ResearchRunRepository
  ) {}

  async run(
    input: CandidateResearchInput,
    budget?: BudgetSnapshot
  ): Promise<CandidateResearchResult[]> {
    const runId = randomUUID();
    const topN = input.topN || 5;
    const accountTier = input.accountTier || 'free';

    // 1. 建立並儲存研究任務記錄 (Run Head)
    await this.researchRunRepo.save({
      runId,
      tradeDate: input.tradeDate,
      criteria: input.criteria,
      topN,
      accountTier,
      status: 'running'
    });

    console.log(`[Coordinator] 開始候選池研究任務 (${runId})。Top: ${topN}`);

    try {
      // 2. 執行初篩
      const candidates = await this.screeningService.screen(input.criteria);
      const topCandidates = candidates.slice(0, topN);

      // 3. 批次執行深度研究
      const results: CandidateResearchResult[] = [];
      const batchSize = 2;

      for (let i = 0; i < topCandidates.length; i += batchSize) {
        const batch = topCandidates.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (cand) => {
            try {
              const research = await this.researchPipeline.run({
                stockId: cand.stockId,
                tradeDate: input.tradeDate,
                accountTier,
                useCache: true
              }, budget);

              return {
                stockId: cand.stockId,
                preliminaryScore: cand.preliminaryScore,
                research
              } as CandidateResearchResult;
            } catch (error) {
              console.error(`[Batch] 深度研究失敗 (${cand.stockId})`);
              return null;
            }
          })
        );
        results.push(...batchResults.filter((r): r is CandidateResearchResult => r !== null));
      }

      // 4. 依最終計分排序並儲存結果 (Run Results)
      results.sort((a, b) => b.research.featureSnapshot.payload.totalScore - a.research.featureSnapshot.payload.totalScore);

      const records: CandidateResearchResultRecord[] = results.map(r => ({
        runId,
        stockId: r.stockId,
        preliminaryScore: r.preliminaryScore,
        researchTotalScore: r.research.featureSnapshot.payload.totalScore,
        finalAction: r.research.finalDecision.action,
        confidence: r.research.finalDecision.confidence,
        summary: r.research.finalDecision.summary,
        ruleResults: r.research.ruleResults, // 補上規則細節
        thesisStatus: r.research.thesisStatus // 補上論點狀態
      }));

      await this.researchRunRepo.saveResults(records);
      await this.researchRunRepo.updateStatus(runId, 'completed');

      console.log(`[Coordinator] 任務 ${runId} 完成。產出 ${results.length} 份結果。`);
      return results;

    } catch (error) {
      await this.researchRunRepo.updateStatus(runId, 'failed');
      throw error;
    }
  }
}
