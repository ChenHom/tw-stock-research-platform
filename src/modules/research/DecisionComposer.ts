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
  private readonly version = '1.2.0';

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
   * 強化版決策合成邏輯
   */
  compose(input: DecisionComposerInput): FinalDecision {
    const { ruleResults, thesisStatus, valuationGap } = input;
    const triggered = ruleResults.filter(r => r.triggered);
    
    // 1. 分類規則 (P1-5)
    const blockingRules = triggered.filter(r => r.action === 'BLOCK').map(r => r.ruleId);
    const exitRules = triggered.filter(r => ['EXIT', 'SELL', 'TRIM'].includes(r.action)).map(r => r.ruleId);
    const buyRules = triggered.filter(r => ['BUY', 'ADD'].includes(r.action)).map(r => r.ruleId);

    // 2. 決定基礎動作 (取最高優先級)
    const sortedTriggered = [...triggered].sort((a, b) => 
      (this.actionPriority[b.action] || 0) - (this.actionPriority[a.action] || 0)
    );
    const primaryRule = sortedTriggered[0];
    let finalAction: RuleAction = primaryRule?.action || 'NO_ACTION';

    // 3. 論點強制覆寫
    if (thesisStatus === 'broken' && this.actionPriority[finalAction] < this.actionPriority['EXIT']) {
      finalAction = 'EXIT';
    }

    // 4. 計算綜合置信度
    let confidence = 0.6;
    
    // 考慮論點狀態
    if (thesisStatus === 'weakened') confidence -= 0.15;
    if (thesisStatus === 'broken') confidence += 0.2; // 壞事確定的置信度通常很高

    // 考慮衝突懲罰 (同時有買與賣)
    if (buyRules.length > 0 && exitRules.length > 0) {
      confidence -= 0.2;
    }

    // 考慮估值加成
    if (valuationGap) {
      if (finalAction === 'BUY' && valuationGap > 0.2) confidence += 0.1;
      if (['SELL', 'TRIM'].includes(finalAction) && valuationGap < -0.15) confidence += 0.1;
    }

    // 主要規則加成
    if (primaryRule?.severity === 'critical') confidence += 0.1;

    // 5. 產出中文化摘要
    const summary = this.generateDetailedSummary(finalAction, thesisStatus, buyRules.length, exitRules.length, primaryRule?.ruleName);

    return {
      stockId: input.stockId,
      decisionDate: input.asOf,
      action: finalAction,
      confidence: Math.max(0.1, Math.min(confidence, 1.0)),
      summary,
      supportingRules: triggered.filter(r => r.action === finalAction).map(r => r.ruleId),
      blockingRules,
      thesisStatus,
      composerVersion: this.version
    };
  }

  private generateDetailedSummary(action: RuleAction, thesis: ThesisStatus, buys: number, exits: number, primaryName?: string): string {
    const parts: string[] = [];
    
    if (action === 'BLOCK') parts.push('觸發嚴格風險攔截。');
    else if (thesis === 'broken') parts.push('投資論點已破壞，強制建議出場。');
    else if (action === 'EXIT' || action === 'SELL' || action === 'TRIM') parts.push(`主導規則 [${primaryName || '未知'}] 建議減碼或出場。`);
    else if (action === 'BUY' || action === 'ADD') parts.push(`主導規則 [${primaryName || '未知'}] 建議偏多操作。`);
    else parts.push('目前無明確交易訊號。');

    if (buys > 0 && exits > 0) parts.push(`警告：系統偵測到 ${buys} 項偏多與 ${exits} 項偏空規則衝突，置信度已調降。`);
    if (thesis === 'weakened') parts.push('提醒：投資論點已出現轉弱跡象。');

    return parts.join(' ');
  }
}
