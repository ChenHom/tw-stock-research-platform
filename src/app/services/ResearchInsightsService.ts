import type { 
  PerformanceStats, 
  ActionBreakdown, 
  RuleBreakdown, 
  ThesisBreakdown 
} from './ResearchPerformanceService.js';

export interface OptimizationInsight {
  type: 'RULE' | 'THESIS' | 'ACTION';
  id: string;
  finding: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RuleInsight extends RuleBreakdown {
  confidenceLevel: 'High' | 'Medium' | 'Low';
}

export interface ThesisInsight extends ThesisBreakdown {
  confidenceLevel: 'High' | 'Medium' | 'Low';
}

export interface ActionInsight extends ActionBreakdown {
  confidenceLevel: 'High' | 'Medium' | 'Low';
}

export interface ResearchInsights {
  runId: string;
  sampleAssessment: {
    stage: 'insufficient' | 'observation' | 'stability' | 'actionable';
    message: string;
    evaluableCount: number;
    coverage: number;
  };
  topEffectiveRules: RuleInsight[];
  lowEffectiveRules: RuleInsight[];
  thesisPerformance: ThesisInsight[];
  actionPerformance: ActionInsight[];
  optimizationSuggestions: OptimizationInsight[];
}

/**
 * 研究洞察服務 (Research Insights Service)
 * 負責從績效數據中挖掘模式，並給出具體的優化建議
 */
export class ResearchInsightsService {
  private readonly MIN_SAMPLES = 10;
  private readonly STABILITY_SAMPLES = 20;
  private readonly ACTIONABLE_SAMPLES = 40;

  private getConfidence(count: number): 'High' | 'Medium' | 'Low' {
    if (count >= 30) return 'High';
    if (count >= 10) return 'Medium';
    return 'Low';
  }

  private assessSamples(stats: PerformanceStats): ResearchInsights['sampleAssessment'] {
    const coverage = stats.totalCount > 0 ? stats.validReturnCount / stats.totalCount : 0;

    if (stats.evaluableCount < this.MIN_SAMPLES || coverage < 0.6) {
      return {
        stage: 'insufficient',
        message: '樣本仍偏少，只適合 smoke / 邏輯驗證，不宜調整規則權重。',
        evaluableCount: stats.evaluableCount,
        coverage
      };
    }

    if (stats.evaluableCount < this.STABILITY_SAMPLES) {
      return {
        stage: 'observation',
        message: '已可做 early observation，但結論仍應保守，先累積更多交易日。',
        evaluableCount: stats.evaluableCount,
        coverage
      };
    }

    if (stats.evaluableCount < this.ACTIONABLE_SAMPLES) {
      return {
        stage: 'stability',
        message: '已進入 stability 檢查階段，可比較規則方向，但仍不宜做大幅升降權。',
        evaluableCount: stats.evaluableCount,
        coverage
      };
    }

    return {
      stage: 'actionable',
      message: '樣本與覆蓋率已達較高可信度，可作為規則調整的重要參考。',
      evaluableCount: stats.evaluableCount,
      coverage
    };
  }

  analyze(
    runId: string,
    stats: PerformanceStats,
    actionBreakdown: ActionBreakdown[],
    ruleBreakdown: RuleBreakdown[],
    thesisBreakdown: ThesisBreakdown[]
  ): ResearchInsights {
    const suggestions: OptimizationInsight[] = [];
    const sampleAssessment = this.assessSamples(stats);

    // 為所有規則加上置信度標籤
    const rulesWithConfidence: RuleInsight[] = ruleBreakdown.map(r => ({
      ...r,
      confidenceLevel: this.getConfidence(r.evaluableCount)
    }));

    // 1. 分析規則有效性 (過濾樣本數過少的規則)
    const validRules = rulesWithConfidence.filter(r => r.evaluableCount >= this.MIN_SAMPLES);

    const topRules = validRules
      .filter(r => r.accuracy >= 0.6 && r.avgReturn > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    const lowRules = validRules
      .filter(r => r.accuracy < 0.5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // 樣本不足提示
    const insufficientRules = rulesWithConfidence.filter(r => r.evaluableCount > 0 && r.evaluableCount < this.MIN_SAMPLES);
    if (insufficientRules.length > 0 && topRules.length === 0 && lowRules.length === 0) {
       suggestions.push({
        type: 'RULE',
        id: 'insufficient_samples',
        finding: `多數規則可評估樣本數不足 ${this.MIN_SAMPLES}。`,
        recommendation: '建議累積更多交易日或擴大候選池後再進行規則優化。',
        severity: 'low'
      });
    }

    lowRules.forEach(r => {
      suggestions.push({
        type: 'RULE',
        id: r.ruleId,
        finding: `規則命中率低 (${(r.accuracy * 100).toFixed(1)}%)，樣本數 ${r.evaluableCount}。`,
        recommendation: sampleAssessment.stage === 'actionable'
          ? '建議重新審視條件或暫時降權。'
          : '先列入觀察名單，不建議在小樣本下直接降權。',
        severity: sampleAssessment.stage === 'actionable' ? 'high' : 'medium'
      });
    });

    // 2. 分析論點狀態
    const thesisWithConfidence: ThesisInsight[] = thesisBreakdown.map(t => ({
      ...t,
      confidenceLevel: this.getConfidence(t.evaluableCount)
    }));

    thesisWithConfidence.forEach(t => {
      if (t.evaluableCount >= this.MIN_SAMPLES && t.status === 'thesis_met' && t.accuracy < 0.5) {
        suggestions.push({
          type: 'THESIS',
          id: t.status,
          finding: `「論點達成」勝率低 (${(t.accuracy * 100).toFixed(1)}%)，樣本數 ${t.evaluableCount}。`,
          recommendation: sampleAssessment.stage === 'actionable'
            ? '論點判定過於寬鬆，建議調整權重。'
            : '先記錄為觀察訊號，待樣本擴大後再決定是否調整。',
          severity: sampleAssessment.stage === 'actionable' ? 'medium' : 'low'
        });
      }
    });

    // 3. 分析決策動作
    const actionWithConfidence: ActionInsight[] = actionBreakdown.map(a => ({
      ...a,
      confidenceLevel: this.getConfidence(a.evaluableCount)
    }));

    actionWithConfidence.forEach(a => {
      if (a.evaluableCount >= this.MIN_SAMPLES && a.action === 'BUY' && a.avgReturn < 0) {
        suggestions.push({
          type: 'ACTION',
          id: a.action,
          finding: `買進動作平均報酬為負 (${(a.avgReturn * 100).toFixed(2)}%)，樣本數 ${a.evaluableCount}。`,
          recommendation: sampleAssessment.stage === 'actionable'
            ? '應檢查進場過濾規則是否失效。'
            : '先持續追蹤，不要因短期樣本直接重寫進場條件。',
          severity: sampleAssessment.stage === 'actionable' ? 'high' : 'medium'
        });
      }
    });

    if (sampleAssessment.stage !== 'actionable') {
      suggestions.unshift({
        type: 'RULE',
        id: `sample-${sampleAssessment.stage}`,
        finding: sampleAssessment.message,
        recommendation: '優先擴大交易日與可評估樣本，再進行規則升降權。',
        severity: sampleAssessment.stage === 'insufficient' ? 'low' : 'medium'
      });
    }

    return {
      runId,
      sampleAssessment,
      topEffectiveRules: topRules,
      lowEffectiveRules: lowRules,
      thesisPerformance: thesisWithConfidence.sort((a, b) => b.accuracy - a.accuracy),
      actionPerformance: actionWithConfidence.sort((a, b) => b.accuracy - a.accuracy),
      optimizationSuggestions: suggestions
    };
  }
}
