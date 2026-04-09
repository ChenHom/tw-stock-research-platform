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
    const validDirectionCount = validOutcomes.filter(o => typeof o.isCorrectDirection === 'boolean').length;
    const correct = validOutcomes.filter(o => o.isCorrectDirection === true).length;
    
    let total5DReturn = 0;
    let validReturnCount = 0;
    for (const o of validOutcomes) {
      if (typeof o.tPlus5Return === 'number' && Number.isFinite(o.tPlus5Return)) {
        total5DReturn += o.tPlus5Return;
        validReturnCount++;
      }
    }

    return {
      totalCount: validOutcomes.length,
      correctDirectionCount: correct,
      accuracy: validDirectionCount > 0 ? correct / validDirectionCount : 0,
      averageReturn5D: validReturnCount > 0 ? total5DReturn / validReturnCount : undefined as any // 改回傳 undefined，並由報表轉 N/A
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
      const validDir = list.filter(o => typeof o.isCorrectDirection === 'boolean').length;
      const correct = list.filter(o => o.isCorrectDirection === true).length;
      let totalReturn = 0;
      let validCount = 0;
      for (const o of list) {
        if (typeof o.tPlus5Return === 'number' && Number.isFinite(o.tPlus5Return)) {
          totalReturn += o.tPlus5Return;
          validCount++;
        }
      }
      return {
        action,
        count: list.length,
        accuracy: validDir > 0 ? correct / validDir : 0,
        avgReturn: validCount > 0 ? totalReturn / validCount : undefined as any
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
    const ruleStats = new Map<string, { hit: number; validDir: number; correct: number; returns: number[] }>();

    for (const res of results) {
      const outcome = outcomeMap.get(res.stockId);
      if (!outcome || !res.ruleResults) continue;

      const triggeredRules = res.ruleResults.filter((r: any) => r.triggered === true);
      for (const rule of triggeredRules) {
        if (!ruleStats.has(rule.ruleId)) {
          ruleStats.set(rule.ruleId, { hit: 0, validDir: 0, correct: 0, returns: [] });
        }
        const s = ruleStats.get(rule.ruleId)!;
        s.hit += 1;
        if (typeof outcome.isCorrectDirection === 'boolean') s.validDir += 1;
        if (outcome.isCorrectDirection === true) s.correct += 1;
        if (typeof outcome.tPlus5Return === 'number' && Number.isFinite(outcome.tPlus5Return)) {
          s.returns.push(outcome.tPlus5Return);
        }
      }
    }

    return Array.from(ruleStats.entries()).map(([ruleId, s]) => ({
      ruleId,
      hitCount: s.hit,
      correctCount: s.correct,
      accuracy: s.validDir > 0 ? s.correct / s.validDir : 0,
      avgReturn: s.returns.length > 0 ? s.returns.reduce((a, b) => a + b, 0) / s.returns.length : undefined as any
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
    const statusStats = new Map<string, { count: number; validDir: number; correct: number; returns: number[] }>();

    for (const res of results) {
      const outcome = outcomeMap.get(res.stockId);
      if (!outcome || !res.thesisStatus) continue;

      const status = res.thesisStatus;
      if (!statusStats.has(status)) {
        statusStats.set(status, { count: 0, validDir: 0, correct: 0, returns: [] });
      }
      const s = statusStats.get(status)!;
      s.count += 1;
      if (typeof outcome.isCorrectDirection === 'boolean') s.validDir += 1;
      if (outcome.isCorrectDirection === true) s.correct += 1;
      if (typeof outcome.tPlus5Return === 'number' && Number.isFinite(outcome.tPlus5Return)) {
        s.returns.push(outcome.tPlus5Return);
      }
    }

    return Array.from(statusStats.entries()).map(([status, s]) => ({
      status,
      count: s.count,
      accuracy: s.validDir > 0 ? s.correct / s.validDir : 0,
      avgReturn: s.returns.length > 0 ? s.returns.reduce((a, b) => a + b, 0) / s.returns.length : undefined as any
    })).sort((a, b) => b.accuracy - a.accuracy);
  }
}