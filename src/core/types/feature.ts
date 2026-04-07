export type FeatureKey =
  | 'closePrice'
  | 'totalScore'
  | 'revenueYoy'
  | 'revenueAcceleration'
  | 'marginRiskScore'
  | 'eventScore';

/**
 * 核心特徵集
 */
export interface StockFeatureSet {
  [key: string]: any; // 必須保留索引簽名以支援 JSON 序列化與動態存取
  stockId: string;
  tradeDate: string;

  closePrice: number;
  ma20: number;
  bias20: number;
  volume: number;
  vol20Ma: number;
  volumeRatio20: number;
  alphaVs0050: number;

  institutionalNet: number;
  foreignNet: number;
  trustNet: number;
  marginChange: number;
  marginRiskScore: number;

  revenueYoy: number;
  revenueAcceleration: boolean;
  grossMarginGrowth: boolean;
  epsTtm: number;
  roe: number;

  totalScore: number;
  eventScore: number;

  missingFields: string[];
}

export interface FeatureSnapshot {
  id: string;
  stockId: string;
  snapshotAt: string;
  featureSetVersion: string;
  payload: StockFeatureSet;
}
