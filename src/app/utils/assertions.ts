import type { PerformanceStats, RuleBreakdown, ThesisBreakdown } from '../services/ResearchPerformanceService.js';

export interface BatchValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 統一驗收規則斷言工具
 */
export class ResearchAssertions {
  /**
   * 驗證單日或批次任務的資料完整性與品質
   */
  static validateQuality(
    stats: PerformanceStats,
    options: {
      minReturnCoverage?: number;
      expectedRunCount?: number;
      actualRunCount?: number;
    } = {}
  ): BatchValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { minReturnCoverage = 80, expectedRunCount, actualRunCount } = options;

    // 1. 檢查任務數量 (若有提供預期值)
    if (expectedRunCount !== undefined && actualRunCount !== undefined) {
      if (actualRunCount !== expectedRunCount) {
        errors.push(`任務數量不符: 預期 ${expectedRunCount} 天，實際僅產出 ${actualRunCount} 個。`);
      }
    }

    // 2. 檢查報酬覆蓋率
    const coverage = stats.totalCount > 0 ? (stats.validReturnCount / stats.totalCount) * 100 : 0;
    if (coverage < minReturnCoverage) {
      errors.push(`5D 報酬覆蓋率過低: ${coverage.toFixed(1)}% < ${minReturnCoverage}%`);
    }

    // 3. 檢查基本樣本數 (P0: 至少要有資料)
    if (stats.totalCount === 0) {
      errors.push('資料品質異常: 總研究個股數為 0。');
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 檢查統計顯著性門檻
   */
  static checkStatisticalSignificance(
    ruleBreakdown: RuleBreakdown[],
    thesisBreakdown: ThesisBreakdown[],
    minSamples = 10
  ): { isSignificant: boolean; message: string } {
    const hasSignificantRule = ruleBreakdown.some(r => r.evaluableCount >= minSamples);
    const hasSignificantThesis = thesisBreakdown.some(t => t.evaluableCount >= minSamples);

    if (hasSignificantRule || hasSignificantThesis) {
      return {
        isSignificant: true,
        message: '✅ 統計門檻: 已有規則或論點達到 10 筆以上樣本。'
      };
    }

    return {
      isSignificant: false,
      message: '⚠️ 警告: 目前尚無任何規則或論點樣本數達到 10 筆，洞察建議可能不具統計意義。'
    };
  }
}
