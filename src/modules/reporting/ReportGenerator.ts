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
      `# Position Report - ${featureSet.stockId} (${featureSet.tradeDate})`,
      '',
      `## Thesis`,
      thesis ? `- ${thesis.statement}` : '- No thesis record',
      '',
      `## Valuation`,
      valuation ? `- Base fair value: ${valuation.fairValueBase ?? 'N/A'}` : '- No valuation snapshot',
      '',
      `## Decision`,
      `- Action: ${decision.action}`,
      `- Reason: ${decision.summary}`,
      ''
    ].join('\n');
  }
}