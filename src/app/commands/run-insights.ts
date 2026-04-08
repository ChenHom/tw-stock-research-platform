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
    let runId = param;

    if (mode === 'latest') {
      const latest = await queryService.getLatestRunSummary();
      runId = latest?.run.runId || '';
    }

    if (!runId) {
      console.log('找不到任務紀錄或未提供 runId。');
      return;
    }

    console.log(`[CLI] 正在分析任務洞察: ${runId}`);
    
    // 1. 獲取績效數據
    const [stats, actionBreakdown, ruleBreakdown, thesisBreakdown] = await Promise.all([
      perfService.getRunPerformance(runId),
      perfService.getActionBreakdown(runId),
      perfService.getRuleBreakdown(runId),
      perfService.getThesisBreakdown(runId)
    ]);

    if (!stats || actionBreakdown.length === 0) {
      console.log('尚無該任務的成效數據，無法產出洞察。');
      return;
    }

    // 2. 產出洞察分析
    const insights = insightsService.analyze(
      runId,
      stats,
      actionBreakdown,
      ruleBreakdown,
      thesisBreakdown
    );

    // 3. 產出報告
    console.log('\n--- 執行策略優化分析 ---\n');
    const mdReport = reportGenerator.buildInsightsMarkdown(insights);
    console.log(mdReport);

  } catch (error) {
    console.error('[CLI] 洞察分析失敗:', error);
    process.exit(1);
  }
}

main();