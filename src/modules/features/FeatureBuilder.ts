import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { marketDaily, valuationDaily, institutionalFlow, monthRevenue, history, marginShort } = input as any;
    const missingFields: string[] = [];

    // 1. 基礎欄位檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');
    if (!marginShort) missingFields.push('margin_short');

    // 2. 計算 MA 與乖離
    const ma20 = this.calculateMA(history || [], 20);
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const closePrice = marketDaily?.close ?? 0;

    // 3. 籌碼風險 (P0-5)
    const marginChange = marginShort?.marginChange ?? 0;
    const marginRiskScore = this.calculateMarginRisk(marginShort);

    // 4. 計算分數
    let totalScore = 0;
    if (closePrice > ma20 && ma20 > 0) totalScore += 15;
    if (marketDaily && marketDaily.volume > vol20Ma && vol20Ma > 0) totalScore += 15;
    if (institutionalFlow && institutionalFlow.totalNet > 0) totalScore += 30;
    if (monthRevenue && monthRevenue.revenueYoy > 0.2) totalScore += 30;
    if (valuationDaily && valuationDaily.peRatio < 15) totalScore += 10;

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      closePrice,
      ma20,
      bias20: ma20 > 0 ? ((closePrice - ma20) / ma20) * 100 : 0,
      volume: marketDaily?.volume ?? 0,
      vol20Ma,
      volumeRatio20: vol20Ma > 0 ? (marketDaily?.volume ?? 0) / vol20Ma : 1,
      alphaVs0050: 0, // 待開發：全市場對比
      institutionalNet: institutionalFlow?.totalNet ?? 0,
      foreignNet: institutionalFlow?.foreignNet ?? 0,
      trustNet: institutionalFlow?.trustNet ?? 0,
      marginChange,
      marginRiskScore,
      revenueYoy: monthRevenue?.revenueYoy ?? 0,
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
    if (!history || history.length < window) return 0;
    const subset = history.slice(-window);
    return subset.reduce((acc, cur) => acc + (cur.close ?? 0), 0) / window;
  }

  private calculateVolMA(history: any[], window: number): number {
    if (!history || history.length < window) return 0;
    const subset = history.slice(-window);
    return subset.reduce((acc, cur) => acc + (cur.volume ?? 0), 0) / window;
  }

  private calculateMarginRisk(margin: any): number {
    if (!margin) return 0;
    // 簡單邏輯：融資餘額過高或增幅過大視為高風險 (0-100)
    return margin.marginBalance > 10000 ? 80 : 20;
  }
}
