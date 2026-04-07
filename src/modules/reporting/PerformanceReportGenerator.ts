import type { PerformanceStats, ActionBreakdown } from '../../app/services/ResearchPerformanceService.js';

export class PerformanceReportGenerator {
  /**
   * 產出成效總覽報告
   */
  buildPerformanceMarkdown(runId: string, stats: PerformanceStats, breakdown: ActionBreakdown[]): string {
    const summary = [
      `# 研究任務成效分析報告`,
      `任務 ID: ${runId}`,
      `產出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      '',
      `## 1. 整體概況`,
      `- 總研究個股數: ${stats.totalCount}`,
      `- 方向預測正確數: ${stats.correctDirectionCount}`,
      `- **綜合準確率: ${(stats.accuracy * 100).toFixed(1)}%**`,
      `- **5日平均報酬率: ${(stats.averageReturn5D * 100).toFixed(2)}%**`,
      ''
    ];

    const breakdownHeader = [
      `## 2. 決策動作拆解`,
      '| 動作 | 樣本數 | 準確率 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: |'
    ];

    const breakdownRows = breakdown.map(b => {
      const acc = (b.accuracy * 100).toFixed(1) + '%';
      const ret = (b.avgReturn * 100).toFixed(2) + '%';
      return `| **${b.action}** | ${b.count} | ${acc} | ${ret} |`;
    });

    return [
      ...summary,
      ...breakdownHeader,
      ...breakdownRows,
      '',
      '---',
      '*註：準確率計算基準為「動作與後續 5 日股價走勢方向是否一致」。*'
    ].join('\n');
  }
}
