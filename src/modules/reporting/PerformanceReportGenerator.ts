import type { PerformanceStats, ActionBreakdown, RuleBreakdown, ThesisBreakdown } from '../../app/services/ResearchPerformanceService.js';

export class PerformanceReportGenerator {
  /**
   * 產出成效總覽報告
   */
  buildPerformanceMarkdown(
    runId: string, 
    stats: PerformanceStats, 
    actionBreakdown: ActionBreakdown[],
    ruleBreakdown: RuleBreakdown[],
    thesisBreakdown: ThesisBreakdown[]
  ): string {
    const formatRet = (val: number | undefined) => {
      return (val !== undefined && Number.isFinite(val)) ? (val * 100).toFixed(2) + '%' : 'N/A';
    };

    const summary = [
      `# 研究任務成效分析報告`,
      `任務 ID: ${runId}`,
      `產出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      '',
      `## 1. 整體概況`,
      `- 總研究個股數: ${stats.totalCount}`,
      `- 可評估方向樣本數: ${stats.evaluableCount} (isCorrectDirection 可判定者)`,
      `- 5D 報酬可計算筆數: ${stats.validReturnCount} (覆蓋率: ${((stats.validReturnCount / stats.totalCount) * 100).toFixed(1)}%)`,
      `- 方向預測正確數: ${stats.correctDirectionCount}`,
      `- **綜合準確率: ${(stats.accuracy * 100).toFixed(1)}%**`,
      `- **5日平均報酬率: ${formatRet(stats.averageReturn5D as any)}**`,
      ''
    ];

    const actionHeader = [
      `## 2. 決策動作拆解`,
      '| 動作 | 樣本數 | 可評估數 | 準確率 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: |'
    ];
    const actionRows = actionBreakdown.map(b => {
      const acc = (b.accuracy * 100).toFixed(1) + '%';
      const ret = formatRet(b.avgReturn as any);
      return `| **${b.action}** | ${b.count} | ${b.evaluableCount} | ${acc} | ${ret} |`;
    });

    const ruleHeader = [
      '',
      `## 3. 判斷規則 (Rules) 成效`,
      '| 規則 ID | 觸發次數 | 可評估數 | 準確率 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: |'
    ];
    const ruleRows = ruleBreakdown.map(b => {
      const acc = (b.accuracy * 100).toFixed(1) + '%';
      const ret = formatRet(b.avgReturn as any);
      return `| \`${b.ruleId}\` | ${b.hitCount} | ${b.evaluableCount} | ${acc} | ${ret} |`;
    });

    const thesisHeader = [
      '',
      `## 4. 論點狀態 (Thesis) 成效`,
      '| 狀態 | 樣本數 | 可評估數 | 準確率 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: |'
    ];
    const thesisRows = thesisBreakdown.map(b => {
      const acc = (b.accuracy * 100).toFixed(1) + '%';
      const ret = formatRet(b.avgReturn as any);
      return `| **${b.status}** | ${b.count} | ${b.evaluableCount} | ${acc} | ${ret} |`;
    });

    return [
      ...summary,
      ...actionHeader,
      ...actionRows,
      ...ruleHeader,
      ...ruleRows,
      ...thesisHeader,
      ...thesisRows,
      '',
      '---',
      '*註：準確率計算基準為「當該規則/論點達成時，後續 5 日股價走勢方向與動作是否一致」。*'
    ].join('\n');
  }
}
