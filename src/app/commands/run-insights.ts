import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { ResearchInsightsService } from '../services/ResearchInsightsService.js';
import { InsightsReportGenerator } from '../../modules/reporting/InsightsReportGenerator.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;
  const insightsService = new ResearchInsightsService();
  const reportGenerator = new InsightsReportGenerator();

  try {
    let runIds: string[] = [];

    if (mode === 'latest') {
      const latest = await queryService.getLatestRunSummary();
      const latestId = latest?.run.runId || '';
      if (latestId) runIds = [latestId];
    } else if (mode === 'range') {
      const startDate = param;
      const endDate = process.argv[4];
      if (!startDate || !endDate) {
        console.log('請提供開始與結束日期: npm run insights range 2024-04-01 2024-04-10');
        return;
      }
      console.log(`[CLI] 正在查詢日期區間任務: ${startDate} ~ ${endDate}`);
      let current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const runs = await queryService.findRunsByDate(dateStr);
        runIds.push(...runs.map(r => r.runId));
        current.setDate(current.getDate() + 1);
      }
    } else {
      runIds = [mode];
    }

    if (runIds.length === 0) {
      console.log('找不到符合條件的任務紀錄。');
      return;
    }

    console.log(`[CLI] 正在分析任務洞察 (共 ${runIds.length} 個任務)...`);
    
    // 1. 獲取績效數據
    const [stats, actionBreakdown, ruleBreakdown, thesisBreakdown] = await Promise.all([
      perfService.getBatchPerformance(runIds),
      perfService.getBatchActionBreakdown(runIds),
      perfService.getBatchRuleBreakdown(runIds),
      perfService.getBatchThesisBreakdown(runIds)
    ]);

    if (!stats || actionBreakdown.length === 0) {
      console.log('尚無符合條件的任務成效數據，無法產出洞察。');
      return;
    }

    // 2. 產出洞察分析
    const insights = insightsService.analyze(
      runIds.length === 1 ? runIds[0] : `BATCH (${runIds.length} runs)`,
      stats,
      actionBreakdown,
      ruleBreakdown,
      thesisBreakdown
    );

    // 3. 產出報告
    console.log('\n--- 執行策略優化分析 ---\n');
    const mdReport = reportGenerator.buildInsightsMarkdown(insights);
    console.log(mdReport);
    process.exit(0);

  } catch (error) {
    console.error('[CLI] 洞察分析失敗:', error);
    process.exit(1);
  }
}

main();