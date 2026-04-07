import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { 
      marketDaily, valuationDaily, institutionalFlow, 
      monthRevenue, history, marginShort, 
      financialStatements, news 
    } = input as any;
    
    const missingFields: string[] = [];

    // 1. 基礎欄位檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');
    if (!financialStatements || financialStatements.length === 0) missingFields.push('financial_statements');

    // 2. 基本面特徵 (Fundamental Layer)
    const epsTtm = this.calculateEpsTtm(financialStatements || []);
    const roe = this.extractLatestRoe(financialStatements || []);
    const { grossMarginGrowth, operatingMarginGrowth } = this.calculateMarginGrowth(financialStatements || []);
    const revenueYoy = monthRevenue?.revenueYoy ?? 0;
    const revenueAcceleration = this.isRevenueAccelerating(monthRevenue, financialStatements);

    // 3. 籌碼與風險 (Chip/Risk Layer)
    const institutionalNet = institutionalFlow?.totalNet ?? 0;
    const marginRiskScore = this.calculateMarginRiskScore(marginShort);

    // 4. 交易位置 (Technical Layer)
    const ma20 = this.calculateMA(history || [], 20);
    const closePrice = marketDaily?.close ?? 0;
    const bias20 = ma20 > 0 ? ((closePrice - ma20) / ma20) * 100 : 0;
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const volumeRatio20 = vol20Ma > 0 ? (marketDaily?.volume ?? 0) / vol20Ma : 1;
    const alphaVs0050 = this.calculateAlpha(history || []);

    // 5. 事件與新聞 (Event Layer)
    const eventScore = this.calculateEventScore(news || []);

    // 6. 綜合計分 (總分 100)
    let totalScore = 0;
    if (epsTtm > 20) totalScore += 10;
    if (roe > 15) totalScore += 10;
    if (revenueYoy > 0.2) totalScore += 10;
    if (grossMarginGrowth) totalScore += 10;
    if (institutionalNet > 0) totalScore += 25;
    if (closePrice > ma20 && ma20 > 0) totalScore += 15;
    if (marketDaily && marketDaily.volume > vol20Ma && vol20Ma > 0) totalScore += 10;
    totalScore += Math.min(10, eventScore / 10);

    return {
      stockId: input.stockId,
      tradeDate: input.tradeDate,
      closePrice,
      ma20,
      bias20,
      volume: marketDaily?.volume ?? 0,
      vol20Ma,
      volumeRatio20,
      alphaVs0050,
      institutionalNet,
      foreignNet: institutionalFlow?.foreignNet ?? 0,
      trustNet: institutionalFlow?.trustNet ?? 0,
      marginChange: marginShort?.marginChange ?? 0,
      marginRiskScore,
      revenueYoy,
      revenueAcceleration,
      grossMarginGrowth,
      epsTtm,
      roe,
      totalScore,
      eventScore,
      missingFields
    };
  }

  private isRevenueAccelerating(current: any, financialStatements: any[]): boolean {
    if (!current) return false;
    // 加速判定：本月 YoY > 前一季平均 YoY 或 本月 YoY > 上月 YoY
    return current.revenueYoy > (current.revenueMom || 0);
  }

  private calculateMarginRiskScore(margin: any): number {
    if (!margin) return 0;
    // 考慮餘額門檻與變化率
    const balanceRisk = margin.marginBalance > 20000 ? 60 : 20;
    const changeRisk = margin.marginChange > 500 ? 20 : 0;
    return Math.min(100, balanceRisk + changeRisk);
  }

  private calculateAlpha(history: any[]): number {
    if (history.length < 20) return 0;
    // 簡單版 Alpha: 個股 20 日漲幅 - 假設大盤 20 日漲幅 (固定值模擬，未來改為抓 0050)
    const latest = history[history.length - 1].close;
    const start = history[0].close;
    const stockReturn = (latest - start) / start;
    const benchmarkReturn = 0.02; // 模擬 2%
    return (stockReturn - benchmarkReturn) * 100;
  }

  private calculateMarginGrowth(financials: any[]) {
    if (financials.length < 2) return { grossMarginGrowth: false, operatingMarginGrowth: false };
    const curr = financials[0];
    const prev = financials[1];
    return {
      grossMarginGrowth: (curr.grossProfit / curr.revenue) > (prev.grossProfit / prev.revenue),
      operatingMarginGrowth: (curr.operatingIncome / curr.revenue) > (prev.operatingIncome / prev.revenue)
    };
  }

  private calculateEventScore(news: any[]): number {
    if (!news || news.length === 0) return 50;
    const positiveKeywords = ['成長', '新高', '展望', '獲利', '上修', '利多', '優於預期'];
    const negativeKeywords = ['衰退', '下修', '風險', '保守', '利空', '虧損', '低於預期'];
    let score = 50;
    for (const item of news) {
      const title = item.title || '';
      if (positiveKeywords.some(k => title.includes(k))) score += 10;
      if (negativeKeywords.some(k => title.includes(k))) score -= 15;
    }
    return Math.max(0, Math.min(100, score));
  }

  private calculateEpsTtm(financials: any[]): number {
    return financials.slice(0, 4).reduce((acc, cur) => acc + (cur.eps || 0), 0);
  }

  private extractLatestRoe(financials: any[]): number {
    return financials[0]?.roe || 0;
  }

  private calculateMA(history: any[], window: number): number {
    if (!history || history.length < window) return 0;
    const subset = history.slice(-window);
    const sum = subset.reduce((acc, cur) => acc + (cur.close ?? cur.close_price ?? 0), 0);
    return sum / window;
  }

  private calculateVolMA(history: any[], window: number): number {
    if (!history || history.length < window) return 0;
    const subset = history.slice(-window);
    const sum = subset.reduce((acc, cur) => acc + (cur.volume ?? cur.TradeVolume ?? 0), 0);
    return sum / window;
  }
}
