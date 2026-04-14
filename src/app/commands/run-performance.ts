import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { PerformanceReportGenerator } from '../../modules/reporting/PerformanceReportGenerator.js';
import { buildRunLabel, resolveRunIds } from '../utils/run-id-resolver.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;
  const reportGenerator = new PerformanceReportGenerator();

  try {
    if (mode === 'range' && (!param || !process.argv[4])) {
      console.log('請提供開始與結束日期: npm run performance range 2024-04-01 2024-04-10');
      return;
    }
    if (mode === 'runs' && !param) {
      console.log('請提供 runId 清單: npm run performance runs <runId1,runId2,...>');
      return;
    }

    const runIds = await resolveRunIds(mode, param, queryService, process.argv.slice(4));

    if (runIds.length === 0) {
      console.log('找不到符合條件的任務紀錄。');
      return;
    }

    if (mode === 'range') {
      console.log(`[CLI] 正在查詢日期區間任務: ${param} ~ ${process.argv[4]}`);
    } else if (mode === 'runs') {
      console.log(`[CLI] 正在使用明確 runId 清單分析: ${runIds.join(', ')}`);
    }

    console.log(`[CLI] 正在分析任務績效 (共 ${runIds.length} 個任務)...`);
    
    // 1. 獲取多維度分析數據
    const [stats, actionBreakdown, ruleBreakdown, thesisBreakdown] = await Promise.all([
      perfService.getBatchPerformance(runIds),
      perfService.getBatchActionBreakdown(runIds),
      perfService.getBatchRuleBreakdown(runIds),
      perfService.getBatchThesisBreakdown(runIds)
    ]);

    if (!stats || actionBreakdown.length === 0) {
      console.log('尚無符合條件的任務成效數據。');
      return;
    }

    console.log('\n--- 執行深度績效分析 (包含 Rules & Thesis) ---\n');
    const mdReport = reportGenerator.buildPerformanceMarkdown(
      buildRunLabel(runIds),
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
