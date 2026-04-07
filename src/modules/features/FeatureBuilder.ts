import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { marketDaily, valuationDaily, institutionalFlow, monthRevenue, history, marginShort, financialStatements, news } = input as any;
    const missingFields: string[] = [];

    // 1. 基礎欄位檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');
    if (!financialStatements || financialStatements.length === 0) missingFields.push('financial_statements');

    // 2. 計算 MA 與乖離 (技術面)
    const ma20 = this.calculateMA(history || [], 20);
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const closePrice = marketDaily?.close ?? 0;

    // 3. 籌碼與風險
    const marginChange = marginShort?.marginChange ?? 0;
    const marginRiskScore = this.calculateMarginRisk(marginShort);

    // 4. 財報特徵 (基本面升級)
    const epsTtm = this.calculateEpsTtm(financialStatements || []);
    const roe = this.extractLatestRoe(financialStatements || []);
    const { grossMarginGrowth, operatingMarginGrowth } = this.calculateMarginGrowth(financialStatements || []);

    // 5. 事件與新聞
    const eventScore = this.calculateEventScore(news || []);

    // 6. 綜合計分 (總分 100)
    let totalScore = 0;
    
    // 基本面 (40分)
    if (epsTtm > 20) totalScore += 10;
    if (roe > 15) totalScore += 10;
    if (monthRevenue && monthRevenue.revenueYoy > 0.2) totalScore += 10;
    if (grossMarginGrowth) totalScore += 10;

    // 籌碼面 (25分)
    if (institutionalFlow && institutionalFlow.totalNet > 0) totalScore += 25;

    // 技術面 (25分)
    if (closePrice > ma20 && ma20 > 0) totalScore += 15;
    if (marketDaily && marketDaily.volume > vol20Ma && vol20Ma > 0) totalScore += 10;

    // 事件面 (10分)
    totalScore += Math.min(10, eventScore / 10);

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
      grossMarginGrowth,
      epsTtm,
      roe,
      totalScore,
      eventScore,
      missingFields
    };
  }

  private calculateMarginGrowth(financials: any[]) {
    if (financials.length < 2) return { grossMarginGrowth: false, operatingMarginGrowth: false };
    const curr = financials[0];
    const prev = financials[1];
    
    const currGM = curr.grossProfit / curr.revenue;
    const prevGM = prev.grossProfit / prev.revenue;
    const currOM = curr.operatingIncome / curr.revenue;
    const prevOM = prev.operatingIncome / prev.revenue;

    return {
      grossMarginGrowth: currGM > prevGM,
      operatingMarginGrowth: currOM > prevOM
    };
  }

  private calculateEventScore(news: any[]): number {
    if (news.length === 0) return 0;
    const positiveKeywords = ['成長', '新高', '展望', '獲利', '上修', '利多'];
    const negativeKeywords = ['衰退', '下修', '風險', '保守', '利空', '虧損'];
    
    let score = 50; // 基礎中性分
    for (const item of news) {
      const title = item.title || '';
      if (positiveKeywords.some(k => title.includes(k))) score += 10;
      if (negativeKeywords.some(k => title.includes(k))) score -= 15;
    }
    return Math.max(0, Math.min(100, score));
  }

  private calculateEpsTtm(financials: any[]): number {
    // 取得最近 4 季 (financials 已在 provider 完成排序)
    return financials.slice(0, 4).reduce((acc, cur) => acc + (cur.eps || 0), 0);
  }

  private extractLatestRoe(financials: any[]): number {
    // 取得最新一季的 ROE
    return financials[0]?.roe || 0;
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
