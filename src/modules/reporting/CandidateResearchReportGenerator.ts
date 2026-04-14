import type { RunResearchOutput } from '../../core/contracts/pipeline.js';

export interface CandidateResearchViewModel {
  stockId: string;
  preliminaryScore: number | null;
  totalScore: number;
  action: string;
  confidence: number;
  summary: string;
  thesisStatus: string;
  triggeredConditions?: string[];
  missingConditions?: string[];
  blockingConditions?: string[];
  thesisSignals?: string[];
}

/**
 * 候選池研究報表生成器
 * 負責將研究結果格式化為 Markdown 與 JSON
 */
export class CandidateResearchReportGenerator {
  /**
   * 產出 Markdown 表格 (用於 CLI 直接顯示)
   */
  buildMarkdownTable(results: Array<RunResearchOutput & { preliminaryScore: number | null }>): string {
    const models: CandidateResearchViewModel[] = results.map(r => ({
      stockId: r.stockId,
      preliminaryScore: r.preliminaryScore,
      totalScore: r.featureSnapshot.payload.totalScore,
      action: r.finalDecision.action,
      confidence: r.finalDecision.confidence,
      summary: r.finalDecision.summary,
      thesisStatus: r.thesisStatus,
      triggeredConditions: r.finalDecision.explanation?.triggeredConditions,
      missingConditions: r.finalDecision.explanation?.missingConditions,
      blockingConditions: r.finalDecision.explanation?.blockingConditions,
      thesisSignals: r.finalDecision.explanation?.thesisSignals
    }));
    return this.buildMarkdownTableFromModels(models, results[0]?.tradeDate || 'N/A');
  }

  /**
   * 產出 Markdown 表格 (基於 ViewModel)
   */
  buildMarkdownTableFromModels(models: CandidateResearchViewModel[], tradeDate: string): string {
    if (models.length === 0) return '目前沒有符合的研究結果。';

    let md = `# 候選池研究綜整報告\n\n`;
    md += `產出時間: ${new Date().toLocaleString('zh-TW')}\n`;
    md += `研究數量: ${models.length}\n\n`;
    md += `| 排名 | 代號 | 初篩分 | 研究總分 | 決策動作 | 置信度 | 摘要理由 |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

    // 依研究總分排序
    const sorted = [...models].sort((a, b) => b.totalScore - a.totalScore);

    sorted.forEach((m, idx) => {
      const rank = idx + 1;
      const preScoreVal = m.preliminaryScore !== null ? Number(m.preliminaryScore) : -1;
      const preScore = (preScoreVal === -1) ? '-' : preScoreVal.toFixed(0);
      const totalScore = Number(m.totalScore).toFixed(0);
      const conf = Math.round(Number(m.confidence) * 100);
      const actionStr = `**${m.action}**`;
      
      md += `| ${rank} | ${m.stockId} | ${preScore} | ${totalScore} | ${actionStr} | ${conf}% | ${m.summary} |\n`;
    });

    const explanationRows = sorted
      .filter(m =>
        (m.triggeredConditions?.length ?? 0) > 0 ||
        (m.missingConditions?.length ?? 0) > 0 ||
        (m.blockingConditions?.length ?? 0) > 0 ||
        (m.thesisSignals?.length ?? 0) > 0
      );

    if (explanationRows.length > 0) {
      md += `\n## 條件詳解\n\n`;
      explanationRows.forEach(m => {
        md += `### ${m.stockId} · ${m.action} · thesis=${m.thesisStatus}\n`;
        if (m.triggeredConditions?.length) md += `- 已達：${m.triggeredConditions.join('、')}\n`;
        if (m.missingConditions?.length) md += `- 未達：${m.missingConditions.join('、')}\n`;
        if (m.blockingConditions?.length) md += `- 攔截：${m.blockingConditions.join('、')}\n`;
        if (m.thesisSignals?.length) md += `- 論點：${m.thesisSignals.join('、')}\n`;
      });
    }

    md += `\n---\n*註：研究總分權重包含基本面(40%)、技術面(25%)、籌碼面(25%)與事件面(10%)。*\n`;
    return md;
  }

  /**
   * 產出任務歷史表格
   */
  buildRunHistoryTable(runs: any[]): string {
    if (runs.length === 0) return '找不到任何研究任務紀錄。';
    let md = `| 任務 ID | 交易日期 | 模式 | 狀態 | 開始時間 |\n`;
    md += `| :--- | :--- | :--- | :---: | :--- |\n`;
    runs.forEach(r => {
      md += `| \`${r.runId.slice(0, 8)}\` | ${r.tradeDate} | ${r.accountTier} | ${r.status} | ${new Date(r.startedAt).toLocaleString()} |\n`;
    });
    return md;
  }

  /**
   * 產出特定任務的結果表格 (用於 run-history detail 或 latest)
   */
  buildRunResultTable(results: any[], tradeDate: string): string {
    const models: CandidateResearchViewModel[] = results.map(r => ({
      stockId: r.stockId,
      preliminaryScore: r.preliminaryScore,
      totalScore: r.researchTotalScore,
      action: r.finalAction,
      confidence: r.confidence,
      summary: r.summary,
      thesisStatus: r.thesisStatus
    }));
    return this.buildMarkdownTableFromModels(models, tradeDate);
  }

  /**
   * 產出摘要 JSON
   */
  buildSummaryJson(results: any[]): any {
    return results.map(r => ({
      stockId: r.stockId,
      action: r.finalDecision?.action || r.finalAction,
      totalScore: r.featureSnapshot?.payload.totalScore || r.researchTotalScore,
      summary: r.finalDecision?.summary || r.summary
    }));
  }
}
