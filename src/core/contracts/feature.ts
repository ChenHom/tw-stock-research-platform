import type { StockFeatureSet } from '../types/feature.js';

export interface FeatureBuilder {
  /**
   * 根據個股代號與交易日期，從多個資料源聚合並計算特徵集。
   * 此方法應負責實作資料的彙整邏輯與缺失欄位處理。
   */
  build(stockId: string, tradeDate: string): StockFeatureSet;
}
