import type { PerformanceStats, RuleBreakdown, ThesisBreakdown } from '../services/ResearchPerformanceService.js';

export interface BatchValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationWindowSpec {
  stage: 'smoke' | 'stability' | 'observation' | 'extended';
  label: string;
  interpretation: string;
  acceptanceCriteria: string[];
  insightPolicy: string;
}

/**
 * 統一驗收規則斷言工具
 */
export class ResearchAssertions {
  static describeValidationWindow(runCount: number): ValidationWindowSpec {
    if (runCount <= 2) {
      return {
        stage: 'smoke',
        label: 'Smoke / 單次閉環驗證',
        interpretation: '用於驗證流程是否能跑通、資料是否能回填、報表是否能產出。',
        acceptanceCriteria: [
          '任務數量需與預期一致',
          '5D 報酬覆蓋率至少 80%',
          '至少要有研究結果可供分析'
        ],
        insightPolicy: '僅能用來檢查流程與語意，不應據此調整規則權重。'
      };
    }

    if (runCount <= 5) {
      return {
        stage: 'stability',
        label: 'Stability / 3-5 日穩定性驗證',
        interpretation: '用於驗證連續多日執行穩定性、API 格式邊界與 action 語意是否一致。',
        acceptanceCriteria: [
          '每日任務都需成功產出',
          '5D 報酬覆蓋率至少 80%',
          '研究閉環與批次聚合報表需可重現'
        ],
        insightPolicy: '可做 early-stage tuning，但不能當成長期有效性的證據。'
      };
    }

    if (runCount <= 10) {
      return {
        stage: 'observation',
        label: 'Observation / 6-10 日觀察驗證',
        interpretation: '用於初步觀察 action、rule、thesis 的 Alpha 與穩定性分布。',
        acceptanceCriteria: [
          '每日任務都需成功產出',
          '5D 報酬覆蓋率至少 80%',
          '聚合分析需使用明確 runId 隔離'
        ],
        insightPolicy: '可比較 action 表現，但樣本仍偏小，不應直接砍規則或大幅調參。'
      };
    }

    return {
      stage: 'extended',
      label: 'Extended / 10+ 日累積觀察',
      interpretation: '開始具備較高的比較價值，可持續累積做策略觀察。',
      acceptanceCriteria: [
        '每日任務都需成功產出',
        '5D 報酬覆蓋率至少 80%',
        '至少一部分規則或 thesis 需進入顯著樣本區間'
      ],
      insightPolicy: '仍需搭配更多交易日與交易成本假設，不能直接視為實戰證明。'
    };
  }

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
    const spec = this.describeValidationWindow(expectedRunCount ?? actualRunCount ?? 1);

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

    warnings.push(`[${spec.label}] ${spec.insightPolicy}`);

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
