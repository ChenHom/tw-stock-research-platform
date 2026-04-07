import type { CandidateResearchResult } from '../../app/services/CandidateResearchService.js';

export class CandidateResearchReportGenerator {
  /**
   * 產出 Markdown 表格報告
   */
  buildMarkdownTable(results: CandidateResearchResult[]): string {
    const header = [
      '| 排名 | 代號 | 初篩分 | 研究總分 | 決策動作 | 置信度 | 摘要理由 |',
      '| :--- | :--- | :---: | :---: | :---: | :---: | :--- |'
    ];

    const rows = results.map((r, i) => {
      const res = r.research;
      const confidence = (res.finalDecision.confidence * 100).toFixed(0) + '%';
      return `| ${i + 1} | ${r.stockId} | ${r.preliminaryScore} | ${res.featureSnapshot.payload.totalScore} | **${res.finalDecision.action}** | ${confidence} | ${res.finalDecision.summary} |`;
    });

    return [
      '# 候選池研究綜整報告',
      '',
      `產出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      `研究數量: ${results.length}`,
      '',
      ...header,
      ...rows,
      '',
      '---',
      '*註：研究總分權重包含基本面(40%)、技術面(25%)、籌碼面(25%)與事件面(10%)。*'
    ].join('\n');
  }

  /**
   * 產出 JSON 摘要 (供系統整合或 Bot 使用)
   */
  buildSummaryJson(results: CandidateResearchResult[]) {
    return results.map(r => ({
      stockId: r.stockId,
      scores: {
        preliminary: r.preliminaryScore,
        research: r.research.featureSnapshot.payload.totalScore
      },
      decision: {
        action: r.research.finalDecision.action,
        confidence: r.research.finalDecision.confidence
      },
      summary: r.research.finalDecision.summary
    }));
  }

  /**
   * 產出特定任務的詳細結果表格 (供讀回歷史使用)
   */
  buildRunResultTable(results: any[], tradeDate: string): string {
    const header = [
      '| 排名 | 代號 | 初篩分 | 研究總分 | 決策動作 | 置信度 | 摘要理由 |',
      '| :--- | :--- | :---: | :---: | :---: | :---: | :--- |'
    ];

    const rows = results.map((r, i) => {
      const confidence = (Number(r.confidence) * 100).toFixed(0) + '%';
      return `| ${i + 1} | ${r.stockId} | ${r.preliminaryScore} | ${r.researchTotalScore} | **${r.finalAction}** | ${confidence} | ${r.summary} |`;
    });

    return [
      `# 研究任務詳細結果 (${tradeDate})`,
      '',
      ...header,
      ...rows
    ].join('\n');
  }

  /**
   * 產出研究任務歷史列表表格
   */
  buildRunHistoryTable(runs: any[]): string {
    const header = [
      '| 任務日期 | 執行狀態 | 帳戶等級 | TopN | 任務 ID |',
      '| :--- | :--- | :---: | :---: | :--- |'
    ];

    const rows = runs.map(r => {
      return `| ${r.tradeDate} | ${r.status} | ${r.accountTier} | ${r.topN} | ${r.runId} |`;
    });

    return [
      '# 研究任務歷史清單',
      '',
      ...header,
      ...rows
    ].join('\n');
  }
}
