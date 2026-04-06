/**
 * 核心特徵集：這是規則引擎與 FeatureBuilder 之間的契約。
 * 所有進入規則引擎的資料都必須符合此結構，確保規則不會讀取到未定義的欄位。
 */
export interface StockFeatureSet {
  [key: string]: any; // 加入索引簽名以支援動態存取
  stockId: string;
  tradeDate: string;

  // 價量特徵 (Price & Volume)
  closePrice: number;
  ma20: number;
  bias20: number;
  volume: number;
  vol20Ma: number;
  volumeRatio20: number;
  alphaVs0050: number;

  // 籌碼特徵 (Chip)
  institutionalNet: number; // 三大法人淨買賣
  foreignNet: number;
  trustNet: number;
  marginChange: number;
  marginRiskScore: number;

  // 基本面特徵 (Fundamental)
  revenueYoy: number;
  revenueAcceleration: boolean;
  grossMarginGrowth: boolean;
  epsTtm: number;
  roe: number;

  // 綜合評價
  totalScore: number;
  eventScore: number;

  // 追蹤缺失欄位，用於標示特徵是否完整
  missingFields: string[];
}

export interface FeatureSnapshot {
  id: string;
  stockId: string;
  snapshotAt: string;
  featureSetVersion: string;
  payload: StockFeatureSet;
}
