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

export interface ResearchInsights {
  runId: string;
  topEffectiveRules: RuleBreakdown[];
  lowEffectiveRules: RuleBreakdown[];
  thesisPerformance: ThesisBreakdown[];
  actionPerformance: ActionBreakdown[];
  optimizationSuggestions: OptimizationInsight[];
}

/**
 * 研究洞察服務 (Research Insights Service)
 * 負責從績效數據中挖掘模式，並給出具體的優化建議
 */
export class ResearchInsightsService {
  analyze(
    runId: string,
    stats: PerformanceStats,
    actionBreakdown: ActionBreakdown[],
    ruleBreakdown: RuleBreakdown[],
    thesisBreakdown: ThesisBreakdown[]
  ): ResearchInsights {
    const suggestions: OptimizationInsight[] = [];

    // 1. 分析規則有效性
    const topRules = [...ruleBreakdown].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
    const lowRules = [...ruleBreakdown]
      .filter(r => r.hitCount >= 2) 
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    lowRules.forEach(r => {
      if (r.accuracy < 0.4) {
        suggestions.push({
          type: 'RULE',
          id: r.ruleId,
          finding: `規則命中率極低 (${(r.accuracy * 100).toFixed(1)}%)，樣本數 ${r.hitCount}。`,
          recommendation: '建議重新審視條件或暫時降權。',
          severity: 'high'
        });
      }
    });

    // 2. 分析論點狀態
    thesisBreakdown.forEach(t => {
      if (t.status === 'thesis_met' && t.accuracy < 0.5) {
        suggestions.push({
          type: 'THESIS',
          id: t.status,
          finding: '「論點達成」狀態下的勝率低於 50%。',
          recommendation: '論點判定過於寬鬆，建議調整權重。',
          severity: 'medium'
        });
      }
    });

    // 3. 分析決策動作
    actionBreakdown.forEach(a => {
      if (a.action === 'BUY' && a.avgReturn < 0) {
        suggestions.push({
          type: 'ACTION',
          id: a.action,
          finding: '買進動作的平均報酬為負。',
          recommendation: '應檢查進場過濾規則是否失效。',
          severity: 'high'
        });
      }
    });

    return {
      runId,
      topEffectiveRules: topRules,
      lowEffectiveRules: lowRules,
      thesisPerformance: [...thesisBreakdown].sort((a, b) => b.accuracy - a.accuracy),
      actionPerformance: [...actionBreakdown].sort((a, b) => b.accuracy - a.accuracy),
      optimizationSuggestions: suggestions
    };
  }
}