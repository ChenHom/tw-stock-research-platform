import type { FinalDecision } from '../../core/types/rule.js';
import type { StockFeatureSet } from '../../core/types/feature.js';
import type { ValuationSnapshot } from '../../core/types/research.js';
import type { ThesisSnapshot } from '../research/ThesisTracker.js';

export class ReportGenerator {
  buildPositionReport(
    featureSet: StockFeatureSet,
    thesis: ThesisSnapshot | null,
    valuation: ValuationSnapshot | null,
    decision: FinalDecision
  ): string {
    return [
      `# 個股持股/追蹤報告 - ${featureSet.stockId} (${featureSet.tradeDate})`,
      '',
      `## 投資論點 (Thesis)`,
      thesis ? `- ${thesis.statement}` : '- 尚無論點紀錄',
      '',
      `## 估值分析 (Valuation)`,
      valuation ? `- 合理價 (Base): ${valuation.fairValueBase ?? 'N/A'}` : '- 尚無估值快照',
      '',
      `## 決策建議 (Decision)`,
      `- 動作: ${decision.action}`,
      `- 摘要理由: ${decision.summary}`,
      `- 信心程度: ${(decision.confidence * 100).toFixed(1)}%`,
      ''
    ].join('\n');
  }
}