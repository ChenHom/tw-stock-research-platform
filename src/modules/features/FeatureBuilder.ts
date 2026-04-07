import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { marketDaily, valuationDaily, institutionalFlow, monthRevenue, history, marginShort, financialStatements } = input as any;
    const missingFields: string[] = [];

    // 1. 基礎欄位檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');
    if (!marginShort) missingFields.push('margin_short');
    if (!financialStatements || financialStatements.length === 0) missingFields.push('financial_statements');

    // 2. 計算 MA 與乖離
    const ma20 = this.calculateMA(history || [], 20);
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const closePrice = marketDaily?.close ?? 0;

    // 3. 籌碼風險 (P0-5)
    const marginChange = marginShort?.marginChange ?? 0;
    const marginRiskScore = this.calculateMarginRisk(marginShort);

    // 4. 財報特徵 (P0-5)
    const epsTtm = this.calculateEpsTtm(financialStatements || []);
    const roe = this.extractLatestRoe(financialStatements || []);

    // 5. 計算分數
    let totalScore = 0;
    if (closePrice > ma20 && ma20 > 0) totalScore += 15;
    if (marketDaily && marketDaily.volume > vol20Ma && vol20Ma > 0) totalScore += 15;
    if (institutionalFlow && institutionalFlow.totalNet > 0) totalScore += 30;
    if (monthRevenue && monthRevenue.revenueYoy > 0.2) totalScore += 30;
    if (valuationDaily && valuationDaily.peRatio < 15) totalScore += 10;
    if (epsTtm > 20) totalScore += 10; // 獲利加分 (P0-5)

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      closePrice,
      ma20,
      bias20: ma20 > 0 ? ((closePrice - ma20) / ma20) * 100 : 0,
      volume: marketDaily?.volume ?? 0,
      vol20Ma,
      volumeRatio20: vol20Ma > 0 ? (marketDaily?.volume ?? 0) / vol20Ma : 1,
      alphaVs0050: 0, 
      institutionalNet: institutionalFlow?.totalNet ?? 0,
      foreignNet: institutionalFlow?.foreignNet ?? 0,
      trustNet: institutionalFlow?.trustNet ?? 0,
      marginChange,
      marginRiskScore,
      revenueYoy: monthRevenue?.revenueYoy ?? 0,
      revenueAcceleration: monthRevenue ? monthRevenue.revenueYoy > monthRevenue.revenueMom : false,
      grossMarginGrowth: false,
      epsTtm,
      roe,
      totalScore,
      eventScore: 0,
      missingFields
    };
  }

  private calculateEpsTtm(financials: any[]): number {
    // 篩選出科目為 EPS 的行，並按日期排序取最近 4 季
    const epsRows = financials
      .filter(f => f.type === 'EPS' || f.type === '每股盈餘')
      .sort((a, b) => b.date.localeCompare(a.date));
    
    // 加總最近 4 筆 (TTM)
    return epsRows.slice(0, 4).reduce((acc, cur) => acc + (cur.value || 0), 0);
  }

  private extractLatestRoe(financials: any[]): number {
    // 取得最新一季的 ROE (若有)
    const roeRow = financials
      .filter(f => f.type === 'ROE' || f.type === '股東權益報酬率' || f.type === 'Return_on_Equity_A_Percent')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    
    return roeRow?.value || 0;
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
