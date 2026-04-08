import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { PerformanceReportGenerator } from '../../modules/reporting/PerformanceReportGenerator.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;
  const reportGenerator = new PerformanceReportGenerator();

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

    console.log(`[CLI] 正在分析任務績效: ${runId}`);
    
    // 1. 獲取多維度分析數據
    const [stats, actionBreakdown, ruleBreakdown, thesisBreakdown] = await Promise.all([
      perfService.getRunPerformance(runId),
      perfService.getActionBreakdown(runId),
      perfService.getRuleBreakdown(runId),
      perfService.getThesisBreakdown(runId)
    ]);

    if (!stats || actionBreakdown.length === 0) {
      console.log('尚無該任務的成效數據 (可能尚未執行回填任務: npm run outcomes latest)。');
      return;
    }

    console.log('\n--- 執行深度績效分析 (包含 Rules & Thesis) ---\n');
    const mdReport = reportGenerator.buildPerformanceMarkdown(
      runId, 
      stats, 
      actionBreakdown,
      ruleBreakdown,
      thesisBreakdown
    );
    console.log(mdReport);
    process.exit(0);

  } catch (error) {
    console.error('[CLI] 績效分析失敗:', error);
    process.exit(1);
  }
}

main();
