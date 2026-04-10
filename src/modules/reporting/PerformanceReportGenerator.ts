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
      runId.includes('BATCH') ? `- 平均每日研究數: ${(stats.totalCount / parseInt(runId.match(/\d+/)![0])).toFixed(1)}` : '',
      `- 可評估方向樣本數: ${stats.evaluableCount} (isCorrectDirection 可判定者)`,
      `- 5D 報酬可計算筆數: ${stats.validReturnCount} (覆蓋率: ${((stats.validReturnCount / stats.totalCount) * 100).toFixed(1)}%)`,
      `- 方向預測正確數: ${stats.correctDirectionCount}`,
      `- **綜合準確率: ${(stats.accuracy * 100).toFixed(1)}%**`,
      `- **5日平均報酬率: ${formatRet(stats.averageReturn5D as any)}**`,
      `- **5日大盤平均報酬: ${formatRet(stats.averageBaselineReturn)}**`,
      `- **平均超額報酬 (Alpha): ${formatRet(stats.averageAlpha)}**`,
      ''
    ].filter(line => line !== '');

    const actionHeader = [
      `## 2. 決策動作拆解`,
      '| 動作 | 樣本數 | 可評估數 | 準確率 | 穩定度 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: |'
    ];
    const actionRows = actionBreakdown.map(b => {
      const acc = b.evaluableCount > 0 ? (b.accuracy * 100).toFixed(1) + '%' : 'N/A';
      const ret = formatRet(b.avgReturn as any);
      const stability = b.action === 'WATCH' ? '-' : (b.accuracy > 0 ? 'N/A' : '-'); // Action 目前未算穩定度，留給 Rule/Thesis
      return `| **${b.action}** | ${b.count} | ${b.evaluableCount} | ${acc} | ${stability} | ${ret} |`;
    });

    const ruleHeader = [
      '',
      `## 3. 判斷規則 (Rules) 成效`,
      '| 規則 ID | 觸發次數 | 可評估數 | 準確率 | 穩定度 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: |'
    ];
    const ruleRows = ruleBreakdown.map(b => {
      const acc = b.evaluableCount > 0 ? (b.accuracy * 100).toFixed(1) + '%' : 'N/A';
      const ret = formatRet(b.avgReturn as any);
      const stability = b.consistency !== undefined ? (b.consistency * 100).toFixed(0) + '%' : 'N/A';
      return `| \`${b.ruleId}\` | ${b.hitCount} | ${b.evaluableCount} | **${acc}** | ${stability} | ${ret} |`;
    });

    const thesisHeader = [
      '',
      `## 4. 論點狀態 (Thesis) 成效`,
      '| 狀態 | 樣本數 | 可評估數 | 準確率 | 穩定度 | 平均報酬 (5D) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: |'
    ];
    const thesisRows = thesisBreakdown.map(b => {
      const acc = b.evaluableCount > 0 ? (b.accuracy * 100).toFixed(1) + '%' : 'N/A';
      const ret = formatRet(b.avgReturn as any);
      const stability = b.consistency !== undefined ? (b.consistency * 100).toFixed(0) + '%' : 'N/A';
      return `| **${b.status}** | ${b.count} | ${b.evaluableCount} | **${acc}** | ${stability} | ${ret} |`;
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
      '### 💡 準確率判定說明 (Success Metrics)',
      '- **BUY / ADD**: 5日超額報酬 (Alpha) > 0% (即跑贏大盤)。',
      '- **EXIT / SELL / BLOCK**: 5日超額報酬 (Alpha) < 0% (即跑輸大盤，避開弱勢股)。',
      '- **WATCH**: 暫不列入準確率評分。',
      '*註：若無大盤資料，則以絕對報酬率進行判定。*',
      '',
      '---',
      '*註：準確率計算基準為「當該規則/論點達成時，後續 5 日股價走勢方向與動作是否一致」。*'
    ].join('\n');
  }
}
