import type { ResearchOutcomeRepository, ResearchRunRepository } from '../../core/contracts/storage.js';

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

export interface RuleBreakdown {
  ruleId: string;
  hitCount: number;
  correctCount: number;
  accuracy: number;
  avgReturn: number;
}

export interface ThesisBreakdown {
  status: string;
  count: number;
  accuracy: number;
  avgReturn: number;
}

export class ResearchPerformanceService {
  constructor(
    private readonly outcomeRepo: ResearchOutcomeRepository,
    private readonly runRepo: ResearchRunRepository
  ) {}

  /**
   * 計算特定研究任務的整體成效統計
   */
  async getRunPerformance(runId: string): Promise<PerformanceStats | null> {
    const outcomes = await this.outcomeRepo.findByRunId(runId);
    if (outcomes.length === 0) return null;

    const validOutcomes = outcomes; // 不再過濾，保留所有已回填的樣本
    const correct = validOutcomes.filter(o => o.isCorrectDirection === true).length;
    const total5DReturn = validOutcomes.reduce((acc, cur) => acc + (cur.tPlus5Return || 0), 0);

    return {
      totalCount: validOutcomes.length,
      correctDirectionCount: correct,
      accuracy: correct / validOutcomes.length,
      averageReturn5D: total5DReturn / validOutcomes.length
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

  /**
   * 獲取規則成效分析 (P0: 核心分析)
   */
  async getRuleBreakdown(runId: string): Promise<RuleBreakdown[]> {
    const outcomes = await this.outcomeRepo.findByRunId(runId);
    const results = await this.runRepo.getRunResults(runId);
    if (outcomes.length === 0 || results.length === 0) return [];

    const outcomeMap = new Map(outcomes.map(o => [o.stockId, o]));
    const ruleStats = new Map<string, { hit: number; correct: number; returns: number[] }>();

    for (const res of results) {
      const outcome = outcomeMap.get(res.stockId);
      if (!outcome || !res.ruleResults) continue;

      // 找出所有 Passed (觸發且過關) 的規則
      const triggeredRules = res.ruleResults.filter((r: any) => r.status === 'passed');
      for (const rule of triggeredRules) {
        if (!ruleStats.has(rule.ruleId)) {
          ruleStats.set(rule.ruleId, { hit: 0, correct: 0, returns: [] });
        }
        const s = ruleStats.get(rule.ruleId)!;
        s.hit += 1;
        if (outcome.isCorrectDirection) s.correct += 1;
        if (outcome.tPlus5Return !== undefined) s.returns.push(outcome.tPlus5Return);
      }
    }

    return Array.from(ruleStats.entries()).map(([ruleId, s]) => ({
      ruleId,
      hitCount: s.hit,
      correctCount: s.correct,
      accuracy: s.correct / s.hit,
      avgReturn: s.returns.length > 0 ? s.returns.reduce((a, b) => a + b, 0) / s.returns.length : 0
    })).sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * 獲取論點狀態成效分析 (P0: 核心分析)
   */
  async getThesisBreakdown(runId: string): Promise<ThesisBreakdown[]> {
    const outcomes = await this.outcomeRepo.findByRunId(runId);
    const results = await this.runRepo.getRunResults(runId);
    if (outcomes.length === 0 || results.length === 0) return [];

    const outcomeMap = new Map(outcomes.map(o => [o.stockId, o]));
    const statusStats = new Map<string, { count: number; correct: number; returns: number[] }>();

    for (const res of results) {
      const outcome = outcomeMap.get(res.stockId);
      if (!outcome || !res.thesisStatus) continue;

      const status = res.thesisStatus;
      if (!statusStats.has(status)) {
        statusStats.set(status, { count: 0, correct: 0, returns: [] });
      }
      const s = statusStats.get(status)!;
      s.count += 1;
      if (outcome.isCorrectDirection) s.correct += 1;
      if (outcome.tPlus5Return !== undefined) s.returns.push(outcome.tPlus5Return);
    }

    return Array.from(statusStats.entries()).map(([status, s]) => ({
      status,
      count: s.count,
      accuracy: s.correct / s.count,
      avgReturn: s.returns.length > 0 ? s.returns.reduce((a, b) => a + b, 0) / s.returns.length : 0
    })).sort((a, b) => b.accuracy - a.accuracy);
  }
}