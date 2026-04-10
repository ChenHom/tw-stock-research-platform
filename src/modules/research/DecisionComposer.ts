import type { RuleResult, FinalDecision, RuleAction } from '../../core/types/rule.js';
import type { ThesisStatus } from '../../core/types/common.js';

export interface DecisionComposerInput {
  stockId: string;
  asOf: string;
  ruleResults: RuleResult[];
  thesisStatus: ThesisStatus | 'none'; // 支持 none
  valuationGap?: number; // upside/downside percentage
  features?: any; // 加入 features 用於摘要產生
  hasPosition?: boolean; // 預設為 false
}

export class DecisionComposer {
  private readonly version = '1.3.2';

  // 動作優先級定義 (數值越高代表越優先/越強制)
  private readonly actionPriority: Record<RuleAction, number> = {
    'BLOCK': 100,
    'EXIT': 90,
    'SELL': 80,
    'TRIM': 70,
    'BUY': 60,
    'ADD': 50,
    'WATCH': 40,
    'HOLD': 30
  };

  /**
   * 強化版決策合成邏輯
   */
  compose(input: DecisionComposerInput): FinalDecision {
    const { ruleResults, thesisStatus, valuationGap } = input;
    const hasPosition = input.hasPosition ?? false;
    const triggered = ruleResults.filter(r => r.triggered);
    
    // 1. 分類規則
    const blockingRules = triggered.filter(r => r.action === 'BLOCK').map(r => r.ruleId);
    const exitRules = triggered.filter(r => ['EXIT', 'SELL', 'TRIM'].includes(r.action)).map(r => r.ruleId);
    const buyRules = triggered.filter(r => ['BUY', 'ADD'].includes(r.action)).map(r => r.ruleId);

    // 2. 決定基礎動作 (取最高優先級，預設為 WATCH)
    const sortedTriggered = [...triggered].sort((a, b) => 
      (this.actionPriority[b.action] || 0) - (this.actionPriority[a.action] || 0)
    );
    const primaryRule = sortedTriggered[0];
    let finalAction: RuleAction = primaryRule?.action || 'WATCH';

    // 3. 論點強制覆寫 (需考量持倉狀態)
    if (thesisStatus === 'broken' && this.actionPriority[finalAction] < this.actionPriority['EXIT']) {
      finalAction = hasPosition ? 'EXIT' : 'BLOCK';
    }

    // 4. 持倉狀態防呆 (P0: 確保研究模式與持倉模式 Action 語意正確)
    if (!hasPosition) {
      // 候選研究模式：不應出現 EXIT/SELL/TRIM，轉換為 BLOCK
      if (['EXIT', 'SELL', 'TRIM'].includes(finalAction)) {
        finalAction = 'BLOCK';
      }
      // 不應出現 ADD/HOLD，轉換為 WATCH
      else if (['ADD', 'HOLD'].includes(finalAction)) {
        finalAction = 'WATCH';
      }
    } else {
      // 持倉管理模式：若無買入訊號且論點尚可，預設為 HOLD 而非 WATCH
      if (finalAction === 'WATCH' && thesisStatus !== 'broken') {
        finalAction = 'HOLD';
      }
    }

    // 5. 計算綜合置信度
    let confidence = thesisStatus === 'none' ? 0.4 : 0.6;
    
    if (thesisStatus === 'weakened') confidence -= 0.15;
    if (thesisStatus === 'broken') confidence += 0.2; 

    if (buyRules.length > 0 && exitRules.length > 0) {
      confidence -= 0.2;
    }

    if (valuationGap) {
      if (finalAction === 'BUY' && valuationGap > 0.2) confidence += 0.1;
      if (['SELL', 'TRIM'].includes(finalAction) && valuationGap < -0.15) confidence += 0.1;
    }

    if (primaryRule?.severity === 'critical') confidence += 0.1;

    // 6. 產出摘要理由
    const summary = this.generateDetailedSummary(
      finalAction, 
      thesisStatus, 
      buyRules.length, 
      exitRules.length, 
      primaryRule?.ruleName,
      input
    );

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

  private generateDetailedSummary(action: RuleAction, thesis: ThesisStatus | 'none', buys: number, exits: number, primaryName?: string, input?: DecisionComposerInput): string {
    const parts: string[] = [];
    const features = input?.features;
    
    if (thesis === 'none') parts.push('[無論點支撐]');
    
    if (action === 'BLOCK') {
      const score = features?.totalScore ?? 0;
      const mRisk = features?.marginRiskScore ?? 0;
      const reasons = [];
      if (thesis === 'broken') reasons.push('投資論點已破壞');
      if (score < 40) reasons.push(`總分(${score}) < 40`);
      if (mRisk >= 80) reasons.push(`風險分數(${mRisk}) >= 80`);
      if (primaryName && !reasons.includes(primaryName)) reasons.push(primaryName);
      parts.push(`觸發風險攔截 (${reasons.join('、') || '條件不符'})。`);
    }
    else if (thesis === 'broken') parts.push('投資論點已破壞，建議出場。');
    else if (action === 'EXIT' || action === 'SELL' || action === 'TRIM') parts.push(`主導規則 [${primaryName || '未知'}] 建議減碼或出場。`);
    else if (action === 'BUY' || action === 'ADD') {
      const score = features?.totalScore ?? 0;
      const inst = features?.institutionalNet ?? 0;
      const close = features?.closePrice ?? 0;
      const ma20 = features?.ma20 ?? 0;
      
      const conditions = [];
      if (score >= 70) conditions.push(`總分(${score}) >= 70`);
      if (inst > 0) conditions.push(`法人買超(${inst.toFixed(0)})`);
      if (close > ma20 && ma20 > 0) conditions.push(`股價(${close}) > MA20(${ma20.toFixed(1)})`);
      
      parts.push(`主導規則 [${primaryName || '未知'}] 建議偏多操作。`);
      if (conditions.length > 0) parts.push(`達成條件: ${conditions.join('、')}。`);
    }
    else if (action === 'WATCH') {
      const missing = [];
      if (features) {
        const score = features.totalScore ?? 0;
        const inst = features.institutionalNet ?? 0;
        const close = features.closePrice ?? 0;
        const ma20 = features.ma20 ?? 0;

        if (score < 70) missing.push(`總分(${score}) < 70`);
        if (inst <= 0) missing.push(`法人買盤(${inst.toFixed(0)})`);
        if (close <= ma20 && ma20 > 0) missing.push(`均線支撐(股價 ${close} <= MA20 ${ma20.toFixed(1)})`);
      }
      const missingStr = missing.length > 0 ? `缺${missing.join('、')}` : '動能不足';
      parts.push(primaryName ? `主導規則 [${primaryName}] 顯示指標轉強，但${missingStr}，維持觀察。` : `目前無明確交易訊號，且${missingStr}，維持觀察。`);
    }
    else parts.push('目前無明確交易訊號。');

    if (buys > 0 && exits > 0) parts.push(`警告：系統偵測到 ${buys} 項偏多與 ${exits} 項偏空規則衝突。`);
    if (thesis === 'weakened') parts.push('提醒：投資論點已出現轉弱。');

    return parts.join(' ');
  }
}
