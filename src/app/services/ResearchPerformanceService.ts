import type { ResearchOutcomeRepository } from '../../core/contracts/storage.js';

export interface PerformanceStats {
  totalCount: number;
  correctDirectionCount: number;
  accuracy: number;
  averageReturn5D: number;
}

export class ResearchPerformanceService {
  constructor(private readonly outcomeRepo: ResearchOutcomeRepository) {}

  /**
   * 計算特定研究任務的成效統計
   */
  async getRunPerformance(runId: string): Promise<PerformanceStats | null> {
    const outcomes = await this.outcomeRepo.findByRunId(runId);
    if (outcomes.length === 0) return null;

    const correct = outcomes.filter(o => o.isCorrectDirection === true).length;
    const total5DReturn = outcomes.reduce((acc, cur) => acc + (cur.tPlus5Return || 0), 0);

    return {
      totalCount: outcomes.length,
      correctDirectionCount: correct,
      accuracy: correct / outcomes.length,
      averageReturn5D: total5DReturn / outcomes.length
    };
  }
}
