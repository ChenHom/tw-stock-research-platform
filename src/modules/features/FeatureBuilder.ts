import type { FeatureBuilder as FeatureBuilderContract } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(stockId: string, tradeDate: string): StockFeatureSet {
    return {
      stockId,
      tradeDate,
      closePrice: 0,
      ma20: 0,
      bias20: 0,
      volume: 0,
      vol20Ma: 0,
      volumeRatio20: 0,
      alphaVs0050: 0,
      institutionalNet: 0,
      foreignNet: 0,
      trustNet: 0,
      marginChange: 0,
      marginRiskScore: 0,
      revenueYoy: 0,
      revenueAcceleration: false,
      grossMarginGrowth: false,
      epsTtm: 0,
      roe: 0,
      totalScore: 0,
      eventScore: 0,
      missingFields: ['implementation_pending']
    };
  }
}
