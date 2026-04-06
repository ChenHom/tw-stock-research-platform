import type { RuleResult, FinalDecision, RuleAction } from '../../core/types/rule.js';
import type { ThesisStatus } from '../../core/types/common.js';

export interface DecisionComposerInput {
  stockId: string;
  asOf: string;
  ruleResults: RuleResult[];
  thesisStatus: ThesisStatus;
  valuationGap?: number; // upside/downside percentage
}

export class DecisionComposer {
  private readonly version = '1.1.0';

  // 動作優先級定義 (數值越高代表越優先/越強制)
  private readonly actionPriority: Record<RuleAction, number> = {
    'BLOCK': 100,
    'EXIT': 90,
    'SELL': 80,
    'TRIM': 70,
    'BUY': 60,
    'ADD': 50,
    'WATCH': 40,
    'HOLD': 30,
    'NO_ACTION': 0
  };

  /**
   * 根據多個維度的資訊合成最終決策
   */
  compose(input: DecisionComposerInput): FinalDecision {
    const { ruleResults, thesisStatus, valuationGap } = input;
    
    // 1. 根據觸發規則找出最高優先級的動作
    const triggeredRules = ruleResults.filter(r => r.triggered);
    
    // 依優先級排序觸發的規則
    const sortedRules = [...triggeredRules].sort((a, b) => 
      (this.actionPriority[b.action] || 0) - (this.actionPriority[a.action] || 0)
    );

    const primaryRule = sortedRules[0];
    let finalAction: RuleAction = primaryRule?.action || 'NO_ACTION';
    
    // 2. 特殊邏輯覆寫：論點優先於買入建議
    if (thesisStatus === 'broken' && this.actionPriority[finalAction] < this.actionPriority['EXIT']) {
      finalAction = 'EXIT';
    }

    // 3. 計算綜合置信度 (Confidence Score)
    // 考量因素：主要規則的 severity、支持規則的數量、估值空間
    const severityBonus = primaryRule?.severity === 'critical' ? 0.2 : 0;
    const supportBonus = triggeredRules.filter(r => r.action === finalAction).length * 0.05;
    const valuationBonus = (valuationGap && valuationGap > 0.2 && finalAction === 'BUY') ? 0.1 : 0;
    
    let confidence = 0.5 + severityBonus + supportBonus + valuationBonus;

    // 4. 產出摘要理由
    const blockingRules = triggeredRules.filter(r => this.actionPriority[r.action] >= 70).map(r => r.ruleId);
    const supportingRules = triggeredRules.filter(r => r.action === finalAction).map(r => r.ruleId);

    let summary = this.generateSummary(finalAction, thesisStatus, triggeredRules.length);

    return {
      stockId: input.stockId,
      decisionDate: input.asOf,
      action: finalAction,
      confidence: Math.min(confidence, 1.0),
      summary,
      supportingRules,
      blockingRules,
      thesisStatus,
      composerVersion: this.version
    };
  }

  private generateSummary(action: RuleAction, thesis: ThesisStatus, ruleCount: number): string {
    if (action === 'BLOCK') return `觸發風險過濾規則，已攔截交易。`;
    if (action === 'EXIT' || thesis === 'broken') return `論點破壞或觸發出場規則，建議立即出場。`;
    if (action === 'SELL' || action === 'TRIM') return `觸發減碼規則，建議降低曝險。`;
    if (action === 'BUY' || action === 'ADD') return `技術面與論點吻合，建議建立或增加部位。`;
    if (ruleCount > 0) return `觸發 ${ruleCount} 項輔助規則，維持當前動作。`;
    return '未達交易門檻，維持觀望。';
  }
}
