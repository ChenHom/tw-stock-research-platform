import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { marketDaily, valuationDaily, institutionalFlow, monthRevenue, history } = input;
    const missingFields: string[] = [];

    // 1. 基礎欄位與缺失檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');

    // 2. 計算 MA20 與成交量均線 (若有歷史資料)
    const ma20 = this.calculateMA(history || [], 20);
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const closePrice = marketDaily?.close || 0;

    // 3. 計算分數 (簡單加權版)
    // Price/Volume 30% | Chip 30% | Fundamental 30% | Valuation 10%
    let totalScore = 0;
    
    // 技術面分數
    if (closePrice > ma20 && ma20 > 0) totalScore += 15;
    if (marketDaily && marketDaily.volume > vol20Ma && vol20Ma > 0) totalScore += 15;

    // 籌碼面
    if (institutionalFlow && institutionalFlow.totalNet > 0) totalScore += 30;

    // 基本面
    if (monthRevenue && monthRevenue.revenueYoy > 0.2) totalScore += 30;

    // 估值
    if (valuationDaily && valuationDaily.peRatio < 15) totalScore += 10;

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      closePrice,
      ma20,
      bias20: ma20 > 0 ? (closePrice - ma20) / ma20 : 0,
      volume: marketDaily?.volume || 0,
      vol20Ma,
      volumeRatio20: vol20Ma > 0 ? (marketDaily?.volume || 0) / vol20Ma : 1,
      alphaVs0050: 0, // TODO: 需計算對比
      institutionalNet: institutionalFlow?.totalNet || 0,
      foreignNet: institutionalFlow?.foreignNet || 0,
      trustNet: institutionalFlow?.trustNet || 0,
      marginChange: 0,
      marginRiskScore: 0,
      revenueYoy: monthRevenue?.revenueYoy || 0,
      revenueAcceleration: monthRevenue ? monthRevenue.revenueYoy > monthRevenue.revenueMom : false,
      grossMarginGrowth: false,
      epsTtm: 0,
      roe: 0,
      totalScore,
      eventScore: 0,
      missingFields
    };
  }

  private calculateMA(history: any[], window: number): number {
    if (history.length < window) return 0;
    const subset = history.slice(0, window);
    return subset.reduce((acc, cur) => acc + (cur.close || 0), 0) / window;
  }

  private calculateVolMA(history: any[], window: number): number {
    if (history.length < window) return 0;
    const subset = history.slice(0, window);
    return subset.reduce((acc, cur) => acc + (cur.volume || 0), 0) / window;
  }
}
