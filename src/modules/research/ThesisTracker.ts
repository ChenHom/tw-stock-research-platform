import type { StockFeatureSet } from '../../core/types/feature.js';
import type { ThesisRecord } from '../../core/types/research.js';

export class ThesisTracker {
  update(existing: ThesisRecord | null, featureSet: StockFeatureSet): ThesisRecord {
    if (existing) {
      return {
        ...existing,
        updatedAt: undefined as never
      } as ThesisRecord;
    }

    return {
      stockId: featureSet.stockId,
      direction: 'watch',
      thesisStatement: 'TODO: define falsifiable thesis',
      status: 'intact',
      confidence: 'low',
      pillars: [],
      disconfirmingEvidence: [],
      risks: [],
      catalysts: [],
      entryConditions: [],
      trimConditions: [],
      exitConditions: []
    };
  }
}
