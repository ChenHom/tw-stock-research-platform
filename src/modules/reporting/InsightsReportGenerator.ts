import type { ResearchInsights } from '../../app/services/ResearchInsightsService.js';

export class InsightsReportGenerator {
  buildInsightsMarkdown(insights: ResearchInsights): string {
    const header = [
      `# 🧠 研究任務優化建議報告`,
      `任務 ID: ${insights.runId}`,
      `產出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      ''
    ];

    const ruleSection = [
      `## 1. 規則效能排行`,
      '### ✅ 高效規則',
      '| 規則 ID | 準確率 | 樣本數 | 置信度 |',
      '| :--- | :---: | :---: | :---: |',
      ...insights.topEffectiveRules.map(r => `| \`${r.ruleId}\` | **${(r.accuracy * 100).toFixed(1)}%** | ${r.evaluableCount} | ${r.confidenceLevel} |`),
      '',
      '### ⚠️ 低效規則',
      '| 規則 ID | 準確率 | 樣本數 | 置信度 |',
      '| :--- | :---: | :---: | :---: |',
      ...insights.lowEffectiveRules.map(r => `| \`${r.ruleId}\` | ${(r.accuracy * 100).toFixed(1)}% | ${r.evaluableCount} | ${r.confidenceLevel} |`),
      ''
    ];

    const suggestionsSection = [
      `## 2. 具體優化建議`,
      insights.optimizationSuggestions.length === 0 
        ? '_目前數據尚不足以產出具體優化建議。_'
        : insights.optimizationSuggestions.map(s => {
            const sev = s.severity === 'high' ? '🔴 **[高風險]**' : s.severity === 'medium' ? '🟡 **[中風險]**' : '⚪️ **[低風險]**';
            return `### ${sev} ${s.type}: ${s.id}\n- **發現**: ${s.finding}\n- **建議**: ${s.recommendation}\n`;
          }).join('\n')
    ];

    const rankingsSection = [
      '',
      `## 3. 論點與動作表現`,
      '### 論點狀態勝率',
      ...insights.thesisPerformance.map(t => `- **${t.status}**: ${(t.accuracy * 100).toFixed(1)}% (n=${t.count})`),
      '',
      '### 決策動作勝率',
      ...insights.actionPerformance.map(a => `- **${a.action}**: ${(a.accuracy * 100).toFixed(1)}% (n=${a.count})`)
    ];

    return [
      ...header,
      ...ruleSection,
      ...suggestionsSection,
      ...rankingsSection,
      '',
      '---',
      '*註：以上建議基於歷史回測數據，僅供優化研究策略參考。*'
    ].join('\n');
  }
}