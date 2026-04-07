import type { ResearchOutcomeRepository } from '../../core/contracts/storage.js';

export interface PerformanceStats {
  totalCount: number;
  correctDirectionCount: number;
  accuracy: number;
  averageReturn5D: number;
}

export interface ActionBreakdown {
  action: string;
  count: number;
  accuracy: number;
  avgReturn: number;
}

export class ResearchPerformanceService {
  constructor(private readonly outcomeRepo: ResearchOutcomeRepository) {}

  /**
   * 計算特定研究任務的整體成效統計
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

  /**
   * 按決策動作拆解成效 (BUY/SELL/WATCH 等)
   */
  async getActionBreakdown(runId: string): Promise<ActionBreakdown[]> {
    const outcomes = await this.outcomeRepo.findByRunId(runId);
    if (outcomes.length === 0) return [];

    const actionGroups = new Map<string, typeof outcomes>();
    for (const o of outcomes) {
      if (!actionGroups.has(o.action)) actionGroups.set(o.action, []);
      actionGroups.get(o.action)!.push(o);
    }

    return Array.from(actionGroups.entries()).map(([action, list]) => {
      const correct = list.filter(o => o.isCorrectDirection === true).length;
      const totalReturn = list.reduce((acc, cur) => acc + (cur.tPlus5Return || 0), 0);
      return {
        action,
        count: list.length,
        accuracy: correct / list.length,
        avgReturn: totalReturn / list.length
      };
    });
  }
}
