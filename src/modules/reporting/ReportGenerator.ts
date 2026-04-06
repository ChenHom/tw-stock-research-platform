import type { RuleDecision } from '../../core/types/rule.js';
import type { StockFeatureSet } from '../../core/types/feature.js';
import type { ThesisRecord, ValuationSnapshot } from '../../core/types/research.js';

export class ReportGenerator {
  buildPositionReport(
    featureSet: StockFeatureSet,
    thesis: ThesisRecord | null,
    valuation: ValuationSnapshot | null,
    decision: RuleDecision
  ): string {
    return [
      `# Position Report - ${featureSet.stockId} (${featureSet.tradeDate})`,
      '',
      `## Thesis`,
      thesis ? `- ${thesis.thesisStatement}` : '- No thesis record',
      '',
      `## Valuation`,
      valuation ? `- Base fair value: ${valuation.fairValueBase ?? 'N/A'}` : '- No valuation snapshot',
      '',
      `## Decision`,
      `- Action: ${decision.action}`,
      `- Reason: ${decision.reason}`,
      ''
    ].join('\n');
  }
}
