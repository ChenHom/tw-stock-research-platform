import type { FeatureBuilder as FeatureBuilderContract, FeatureBuildInput } from '../../core/contracts/feature.js';
import type { StockFeatureSet } from '../../core/types/feature.js';

export class FeatureBuilder implements FeatureBuilderContract {
  build(input: FeatureBuildInput): StockFeatureSet {
    const { 
      marketDaily, valuationDaily, institutionalFlow, 
      monthRevenue, history, marginShort, 
      financialStatements, news, benchmarkHistory 
    } = input as any;
    
    const missingFields: string[] = [];

    // 1. 基礎欄位檢查
    if (!marketDaily) missingFields.push('market_daily');
    if (marketDaily && (!Number.isFinite(marketDaily.close) || marketDaily.close <= 0)) missingFields.push('market_daily_invalid');
    if (!valuationDaily) missingFields.push('daily_valuation');
    if (!institutionalFlow) missingFields.push('institutional_flow');
    if (!monthRevenue) missingFields.push('month_revenue');
    if (!financialStatements || financialStatements.length === 0) missingFields.push('financial_statements');
    if (!history || history.length < 20) missingFields.push('market_daily_history');

    // 2. 基本面特徵 (Fundamental Layer)
    const epsTtm = this.calculateEpsTtm(financialStatements || []);
    const roe = this.extractLatestRoe(financialStatements || []);
    const { grossMarginGrowth, operatingMarginGrowth } = this.calculateMarginGrowth(financialStatements || []);
    const revenueYoy = monthRevenue?.revenueYoy ?? 0;
    // 強化：營收加速判定 (本月 YoY > 前三個月平均 YoY)
    const revenueAcceleration = this.isRevenueAccelerating(monthRevenue, input as any);

    // 3. 籌碼與風險 (Chip/Risk Layer)
    const institutionalNet = institutionalFlow?.totalNet ?? 0;
    // 強化：融資風險分數 (考慮餘額水位與 5 日增幅)
    const marginRiskScore = this.calculateMarginRiskScore(marginShort);

    // 4. 交易位置 (Technical Layer)
    const ma20 = this.calculateMA(history || [], 20);
    const closePrice = marketDaily?.close ?? 0;
    const bias20 = ma20 > 0 ? ((closePrice - ma20) / ma20) * 100 : 0;
    const vol20Ma = this.calculateVolMA(history || [], 20);
    const volumeRatio20 = vol20Ma > 0 ? (marketDaily?.volume ?? 0) / vol20Ma : 1;
    // 強化：真 Alpha 計算 (個股 20日報酬 - 0050 20日報酬)
    const alphaVs0050 = this.calculateTrueAlpha(history || [], benchmarkHistory || []);

    // 5. 事件與新聞 (Event Layer)
    // 強化：加入時間衰減與相關性過濾
    const eventScore = this.calculateEventScore(news || [], input.tradeDate);

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

  private isRevenueAccelerating(current: any, input: any): boolean {
    if (!current || !input.monthRevenueHistory) return false;
    const history = input.monthRevenueHistory as any[];
    if (history.length < 3) return current.revenueYoy > (current.revenueMom || 0);
    const avgPrevYoY = history.slice(-3).reduce((acc, cur) => acc + (cur.revenueYoy || 0), 0) / 3;
    return current.revenueYoy > avgPrevYoY;
  }

  private calculateMarginRiskScore(margin: any): number {
    if (!margin) return 0;
    const balanceThreshold = 20000;
    const changeThreshold = 1000;
    let score = 20;
    if (margin.marginBalance > balanceThreshold) score += 40;
    if (margin.marginChange > changeThreshold) score += 30;
    return Math.min(100, score);
  }

  private calculateTrueAlpha(history: any[], benchmark: any[]): number {
    if (history.length < 20 || benchmark.length < 20) return 0;
    const stockReturn = (history[history.length - 1].close - history[0].close) / history[0].close;
    const benchReturn = (benchmark[benchmark.length - 1].close - benchmark[0].close) / benchmark[0].close;
    return (stockReturn - benchReturn) * 100;
  }

  private calculateEventScore(news: any[], tradeDate: string): number {
    if (!news || news.length === 0) return 50;
    const targetDate = new Date(tradeDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    let totalImpact = 0;
    for (const item of news) {
      const newsDate = new Date(item.publishedAt).getTime();
      const ageDays = (targetDate - newsDate) / dayMs;
      if (ageDays < 0 || ageDays > 7) continue;

      // 時間衰減權重 (越近期影響越大)
      const timeWeight = Math.max(0, 1 - (ageDays / 7));
      
      let sentiment = 0;
      if (['成長', '新高', '展望', '獲利', '上修', '利多'].some(k => item.title.includes(k))) sentiment = 10;
      if (['衰退', '下修', '風險', '保守', '利空', '虧損'].some(k => item.title.includes(k))) sentiment = -15;
      
      totalImpact += sentiment * timeWeight;
    }
    
    return Math.max(0, Math.min(100, 50 + totalImpact));
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

  private calculateMarginGrowth(financials: any[]) {
    if (financials.length < 2) return { grossMarginGrowth: false, operatingMarginGrowth: false };
    const curr = financials[0];
    const prev = financials[1];
    const currGM = curr.revenue > 0 ? curr.grossProfit / curr.revenue : 0;
    const prevGM = prev.revenue > 0 ? prev.grossProfit / prev.revenue : 0;
    const currOM = curr.revenue > 0 ? curr.operatingIncome / curr.revenue : 0;
    const prevOM = prev.revenue > 0 ? prev.operatingIncome / prev.revenue : 0;
    return { grossMarginGrowth: currGM > prevGM, operatingMarginGrowth: currOM > prevOM };
  }
}
