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
    
    // 獲取整體統計
    const stats = await perfService.getRunPerformance(runId);
    // 獲取動作拆解
    const breakdown = await perfService.getActionBreakdown(runId);

    if (!stats || breakdown.length === 0) {
      console.log('尚無該任務的成效數據 (可能尚未執行回填任務: npm run outcomes latest)。');
      return;
    }

    console.log('\n--- 執行深度績效分析 ---\n');
    const mdReport = reportGenerator.buildPerformanceMarkdown(runId, stats, breakdown);
    console.log(mdReport);

  } catch (error) {
    console.error('[CLI] 績效分析失敗:', error);
    process.exit(1);
  }
}

main();
