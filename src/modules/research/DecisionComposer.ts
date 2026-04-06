import type { RuleResult, FinalDecision, RuleAction } from '../../core/types/rule.js';

export interface DecisionComposerInput {
  stockId: string;
  asOf: string;
  ruleResults: RuleResult[];
  thesisStatus: 'intact' | 'weakened' | 'broken' | 'none';
  valuationGap?: number; // upside/downside percentage
}

export class DecisionComposer {
  private readonly version = '1.0.0';

  /**
   * 根據多個維度的資訊合成最終決策
   */
  compose(input: DecisionComposerInput): FinalDecision {
    const { ruleResults, thesisStatus, valuationGap } = input;

    // 1. 提取關鍵規則
    const blockingRules = ruleResults
      .filter(r => r.triggered && r.action === 'BLOCK')
      .map(r => r.ruleId);

    const supportingRules = ruleResults
      .filter(r => r.triggered && (r.action === 'BUY' || r.action === 'ADD'))
      .map(r => r.ruleId);

    // 2. 決定最終動作 (簡單示例邏輯)
    let finalAction: RuleAction = 'NO_ACTION';
    let confidence = 0.5;
    let summary = 'Evaluating rules...';

    if (blockingRules.length > 0) {
      finalAction = 'BLOCK';
      confidence = 1.0;
      summary = `Blocked by ${blockingRules.length} risk/filter rules.`;
    } else if (thesisStatus === 'broken') {
      finalAction = 'EXIT';
      confidence = 0.9;
      summary = 'Thesis is broken, immediate exit recommended.';
    } else if (supportingRules.length > 0 && thesisStatus === 'intact') {
      finalAction = 'BUY';
      confidence = 0.7 + (valuationGap && valuationGap > 0.2 ? 0.1 : 0);
      summary = `Strong setup with ${supportingRules.length} supporting rules and intact thesis.`;
    }

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
}
