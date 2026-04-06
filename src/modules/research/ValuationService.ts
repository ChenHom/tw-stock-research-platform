import type { StockFeatureSet } from '../../core/types/feature.js';
import type { ValuationSnapshot } from '../../core/types/research.js';

export class ValuationService {
  build(stockId: string, featureSet: StockFeatureSet): ValuationSnapshot {
    return {
      stockId,
      snapshotDate: featureSet.tradeDate,
      primaryMethod: 'pe',
      peerGroup: [],
      assumptions: {}
    };
  }
}
