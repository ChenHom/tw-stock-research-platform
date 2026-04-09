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

  private getConfidence(count: number): 'High' | 'Medium' | 'Low' {
    if (count >= 30) return 'High';
    if (count >= 10) return 'Medium';
    return 'Low';
  }

  analyze(
    runId: string,
    stats: PerformanceStats,
    actionBreakdown: ActionBreakdown[],
    ruleBreakdown: RuleBreakdown[],
    thesisBreakdown: ThesisBreakdown[]
  ): ResearchInsights {
    const suggestions: OptimizationInsight[] = [];

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
        recommendation: '建議重新審視條件或暫時降權。',
        severity: 'high'
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
          recommendation: '論點判定過於寬鬆，建議調整權重。',
          severity: 'medium'
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
          recommendation: '應檢查進場過濾規則是否失效。',
          severity: 'high'
        });
      }
    });

    return {
      runId,
      topEffectiveRules: topRules,
      lowEffectiveRules: lowRules,
      thesisPerformance: thesisWithConfidence.sort((a, b) => b.accuracy - a.accuracy),
      actionPerformance: actionWithConfidence.sort((a, b) => b.accuracy - a.accuracy),
      optimizationSuggestions: suggestions
    };
  }
}