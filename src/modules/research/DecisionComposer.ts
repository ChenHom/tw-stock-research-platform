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
    const lockedByFilter = primaryRule?.category === 'filter' && primaryRule.triggered;
    let finalAction: RuleAction = primaryRule?.action || 'WATCH';

    // 3. 論點強制覆寫 (需考量持倉狀態)
    if (!lockedByFilter && thesisStatus === 'broken' && this.actionPriority[finalAction] < this.actionPriority['EXIT']) {
      finalAction = hasPosition ? 'EXIT' : 'BLOCK';
    }

    // 4. 持倉狀態防呆 (P0: 確保研究模式與持倉模式 Action 語意正確)
    if (lockedByFilter) {
      finalAction = primaryRule?.action || 'WATCH';
    }
    else if (!hasPosition) {
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
    let confidence = lockedByFilter ? 0.35 : (thesisStatus === 'none' ? 0.4 : 0.6);
    
    if (!lockedByFilter) {
      if (thesisStatus === 'weakened') confidence -= 0.15;
      if (thesisStatus === 'broken') confidence += 0.2; 
    }

    if (buyRules.length > 0 && exitRules.length > 0) {
      confidence -= 0.2;
    }

    if (!lockedByFilter && valuationGap) {
      if (finalAction === 'BUY' && valuationGap > 0.2) confidence += 0.1;
      if (['SELL', 'TRIM'].includes(finalAction) && valuationGap < -0.15) confidence += 0.1;
    }

    if (!lockedByFilter && primaryRule?.severity === 'critical') confidence += 0.1;

    // 6. 產出摘要理由
    const explanation = this.buildExplanation(finalAction, thesisStatus, primaryRule, input);
    const summary = this.generateDetailedSummary(
      finalAction, 
      thesisStatus, 
      buyRules.length, 
      exitRules.length, 
      primaryRule,
      explanation,
      input
    );

    return {
      stockId: input.stockId,
      decisionDate: input.asOf,
      action: finalAction,
      confidence: Math.max(0.1, Math.min(confidence, 1.0)),
      summary,
      explanation,
      supportingRules: triggered.filter(r => r.action === finalAction).map(r => r.ruleId),
      blockingRules,
      thesisStatus,
      composerVersion: this.version
    };
  }

  private generateDetailedSummary(
    action: RuleAction,
    thesis: ThesisStatus | 'none',
    buys: number,
    exits: number,
    primaryRule?: Pick<RuleResult, 'ruleId' | 'ruleName' | 'category' | 'reason'>,
    explanation?: FinalDecision['explanation'],
    input?: DecisionComposerInput
  ): string {
    const parts: string[] = [];
    const primaryName = primaryRule?.ruleName;
    
    if (thesis === 'none') parts.push('[無論點支撐]');
    
    if (primaryRule?.category === 'filter') {
      parts.push(`資料品質不足：${primaryRule.reason}，暫不輸出交易結論。`);
    }
    else if (action === 'BLOCK') {
      parts.push(`觸發風險攔截${primaryName ? ` [${primaryName}]` : ''}。`);
    }
    else if (thesis === 'broken') parts.push('投資論點已破壞，建議出場。');
    else if (action === 'EXIT' || action === 'SELL' || action === 'TRIM') parts.push(`主導規則 [${primaryName || '未知'}] 建議減碼或出場。`);
    else if (action === 'BUY') {
      parts.push(`主導規則 [${primaryName || '未知'}] 建議偏多操作。`);
    }
    else if (action === 'ADD') {
      parts.push(`主導規則 [${primaryName || '未知'}] 建議加碼。`);
    }
    else if (action === 'HOLD') {
      parts.push(`目前論點未破壞，維持持有。`);
    }
    else if (action === 'WATCH') {
      parts.push(primaryName ? `主導規則 [${primaryName}] 顯示指標尚未齊備，維持觀察。` : `目前無明確交易訊號，維持觀察。`);
    }
    else parts.push('目前無明確交易訊號。');

    if (explanation?.triggeredConditions.length) {
      parts.push(`達成條件: ${explanation.triggeredConditions.join('、')}。`);
    }
    if (explanation?.missingConditions.length) {
      parts.push(`未達條件: ${explanation.missingConditions.join('、')}。`);
    }
    if (explanation?.blockingConditions.length) {
      parts.push(`攔截條件: ${explanation.blockingConditions.join('、')}。`);
    }

    if (buys > 0 && exits > 0) parts.push(`警告：系統偵測到 ${buys} 項偏多與 ${exits} 項偏空規則衝突。`);
    if (thesis === 'weakened') parts.push('提醒：投資論點已出現轉弱。');

    return parts.join(' ');
  }

  private buildExplanation(
    action: RuleAction,
    thesis: ThesisStatus | 'none',
    primaryRule: Pick<RuleResult, 'ruleId' | 'ruleName' | 'category' | 'reason'> | undefined,
    input: DecisionComposerInput
  ): FinalDecision['explanation'] {
    const features = input.features ?? {};
    const hasPosition = input.hasPosition ?? false;

    const buyChecks = [
      {
        met: (features.totalScore ?? 0) >= 70,
        text: `總分(${features.totalScore ?? 0}) >= 70`
      },
      {
        met: (features.institutionalNet ?? 0) > 0,
        text: `法人買超(${(features.institutionalNet ?? 0).toFixed?.(0) ?? features.institutionalNet ?? 0}) > 0`
      },
      {
        met: (features.closePrice ?? 0) > (features.ma20 ?? Number.MAX_VALUE) && (features.ma20 ?? 0) > 0,
        text: `股價(${features.closePrice ?? 0}) > MA20(${Number(features.ma20 ?? 0).toFixed(1)})`
      }
    ];

    const addChecks = [
      ...buyChecks,
      {
        met: (features.totalScore ?? 0) >= 80,
        text: `總分(${features.totalScore ?? 0}) >= 80`
      },
      {
        met: (features.volumeRatio20 ?? 0) > 1,
        text: `量能比(${Number(features.volumeRatio20 ?? 0).toFixed(2)}) > 1.00`
      }
    ];

    const trimChecks = [
      {
        met: thesis === 'weakened',
        text: '論點狀態轉弱 (weakened)'
      },
      {
        met: (features.closePrice ?? 0) <= (features.ma20 ?? 0) && (features.ma20 ?? 0) > 0,
        text: `股價(${features.closePrice ?? 0}) <= MA20(${Number(features.ma20 ?? 0).toFixed(1)})`
      },
      {
        met: (features.institutionalNet ?? 0) < 0,
        text: `法人賣超(${(features.institutionalNet ?? 0).toFixed?.(0) ?? features.institutionalNet ?? 0}) < 0`
      }
    ];

    const riskChecks = [
      {
        met: thesis === 'broken',
        text: '投資論點已破壞'
      },
      {
        met: (features.totalScore ?? 0) < 40,
        text: `總分(${features.totalScore ?? 0}) < 40`
      },
      {
        met: (features.marginRiskScore ?? 0) >= 80,
        text: `風險分數(${features.marginRiskScore ?? 0}) >= 80`
      }
    ];

    const toConditions = (checks: Array<{ met: boolean; text: string }>) => ({
      met: checks.filter(check => check.met).map(check => check.text),
      unmet: checks.filter(check => !check.met).map(check => check.text)
    });

    const buyConditions = toConditions(buyChecks);
    const addConditions = toConditions(addChecks);
    const trimConditions = toConditions(trimChecks);
    const riskConditions = toConditions(riskChecks);

    const explanation = {
      primaryRuleId: primaryRule?.ruleId,
      primaryRuleName: primaryRule?.ruleName,
      triggeredConditions: [] as string[],
      missingConditions: [] as string[],
      blockingConditions: [] as string[]
    };

    if (primaryRule?.category === 'filter') {
      explanation.blockingConditions.push(primaryRule.reason);
      return explanation;
    }

    if (action === 'BUY') {
      explanation.triggeredConditions.push(...buyConditions.met);
      explanation.missingConditions.push(...buyConditions.unmet);
    } else if (action === 'ADD') {
      explanation.triggeredConditions.push(...addConditions.met);
      explanation.missingConditions.push(...addConditions.unmet);
    } else if (action === 'WATCH') {
      explanation.missingConditions.push(...buyConditions.unmet);
    } else if (action === 'HOLD') {
      explanation.triggeredConditions.push(
        '持倉模式啟用',
        thesis === 'active' ? '論點維持 active' : '論點尚未破壞'
      );
      explanation.missingConditions.push(...addConditions.unmet);
    } else if (action === 'TRIM') {
      explanation.blockingConditions.push(...trimConditions.met);
      explanation.missingConditions.push(...addConditions.unmet);
    } else if (action === 'BLOCK' || action === 'EXIT' || action === 'SELL') {
      explanation.blockingConditions.push(...riskConditions.met);
      if (hasPosition && action !== 'BLOCK' && trimConditions.met.length > 0) {
        explanation.blockingConditions.push(...trimConditions.met);
      }
    }

    return explanation;
  }
}
