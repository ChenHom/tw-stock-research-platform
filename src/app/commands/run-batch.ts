import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { ResearchAssertions } from '../utils/assertions.js';
import { PerformanceReportGenerator } from '../../modules/reporting/PerformanceReportGenerator.js';
import { ResearchInsightsService } from '../services/ResearchInsightsService.js';
import { InsightsReportGenerator } from '../../modules/reporting/InsightsReportGenerator.js';

async function main() {
  const startDateStr = process.argv[2];
  const endDateStr = process.argv[3];
  const stocks = process.argv[4] || '2330,3363,1560,6187,2002';

  if (!startDateStr || !endDateStr) {
    console.log('使用方式: npm run test:batch <開始日期> <結束日期> [股票清單]');
    console.log('範例: npm run test:batch 2024-04-01 2024-04-05');
    process.exit(1);
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('日期格式錯誤。請使用 YYYY-MM-DD。');
    process.exit(1);
  }

  const plannedDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const validationSpec = ResearchAssertions.describeValidationWindow(plannedDays);

  console.log('===========================================');
  console.log('🚀 啟動跨平台 MVP 批次驗證任務');
  console.log(`📅 區間: ${startDateStr} ~ ${endDateStr}`);
  console.log(`🎯 樣本: ${stocks}`);
  console.log(`🧭 驗證階段: ${validationSpec.label}`);
  console.log(`📝 判讀口徑: ${validationSpec.interpretation}`);
  validationSpec.acceptanceCriteria.forEach((criterion, index) => {
    console.log(`   ${index + 1}. ${criterion}`);
  });
  console.log('===========================================');

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const performanceReportGenerator = new PerformanceReportGenerator();
  const insightsService = new ResearchInsightsService();
  const insightsReportGenerator = new InsightsReportGenerator();
  const stockIds = stocks.split(',').map(stock => stock.trim()).filter(Boolean);
  const dayRuns: Array<{ tradeDate: string; runId: string; resultCount: number }> = [];

  // 1. 迭代日期執行研究與回填
  const current = new Date(startDate);
  const runIds: string[] = [];
  let expectedDays = 0;

  while (current <= endDate) {
    expectedDays++;
    const dateStr = toTaipeiDateString(current);
    console.log(`\n--- 處理日期: ${dateStr} ---`);

    try {
      console.log(`[Step 1] 執行深度研究 (Candidates) for ${dateStr}...`);
      const { runId, results } = await app.candidateResearchService.runDetailed({
        criteria: { minVolume: 2000, maxPe: 25 },
        tradeDate: dateStr,
        topN: stockIds.length,
        accountTier: 'free',
        stockIds
      }, app.budgetGuard.evaluate('finmind', 0, 600));

      if (results.length === 0) {
        console.warn(`[CLI] ${dateStr} 無有效研究結果，略過後續回填。`);
        current.setDate(current.getDate() + 1);
        continue;
      }

      console.log(`[Step 2] 執行成效回填 (Outcomes) for ${runId}...`);
      await app.researchOutcomeService.backfillOutcomes(runId);
      runIds.push(runId);
      dayRuns.push({
        tradeDate: dateStr,
        runId,
        resultCount: results.length
      });
    } catch (error: any) {
      console.error(`❌ 日期 ${dateStr} 處理失敗: ${error.message}`);
    }

    current.setDate(current.getDate() + 1);
  }

  console.log('\n===========================================');
  console.log('📊 執行聚合分析與驗收斷言');
  console.log('===========================================');

  // 2. 獲取聚合績效數據
  const [stats, actionBreakdown, ruleBreakdown, thesisBreakdown] = await Promise.all([
    perfService.getBatchPerformance(runIds),
    perfService.getBatchActionBreakdown(runIds),
    perfService.getBatchRuleBreakdown(runIds),
    perfService.getBatchThesisBreakdown(runIds)
  ]);

  if (!stats) {
    console.error('❌ 失敗: 無法獲取聚合績效數據。');
    process.exit(1);
  }

  // --- 驗收斷言 (Assertions) ---
  const result = ResearchAssertions.validateQuality(stats, {
    expectedRunCount: expectedDays,
    actualRunCount: runIds.length,
    minReturnCoverage: 80
  });

  console.log(`\n✅ 聚合指標: 任務數=${runIds.length}/${expectedDays}, 總個股=${stats.totalCount}, 5D報酬覆蓋=${stats.validReturnCount}`);

  if (!result.success) {
    console.error('\n❌ 批次驗收失敗:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  result.warnings.forEach(warning => console.log(`ℹ️ ${warning}`));

  const sig = ResearchAssertions.checkStatisticalSignificance(ruleBreakdown, thesisBreakdown);
  console.log(sig.message);

  const isolatedRunIds = runIds.join(',');
  const batchLabel = `BATCH (${runIds.length} runs)`;
  const coveragePct = stats.totalCount > 0 ? (stats.validReturnCount / stats.totalCount) * 100 : 0;
  const insights = insightsService.analyze(
    isolatedRunIds,
    stats,
    actionBreakdown,
    ruleBreakdown,
    thesisBreakdown
  );

  console.log('\n--- Batch Isolation ---');
  dayRuns.forEach(day => {
    console.log(`- ${day.tradeDate}: ${day.runId} (${day.resultCount} 檔)`);
  });
  console.log(`- Follow-up performance: npm run performance runs ${isolatedRunIds}`);
  console.log(`- Follow-up insights: npm run insights runs ${isolatedRunIds}`);
  console.log(`- 覆蓋率摘要: evaluable=${stats.evaluableCount}, returnCoverage=${coveragePct.toFixed(1)}%, insightStage=${insights.sampleAssessment.stage}`);

  console.log('\n[Step 3] 產出聚合績效報表 (Performance Runs)...');
  console.log('\n--- 執行深度績效分析 (包含 Rules & Thesis) ---\n');
  console.log(performanceReportGenerator.buildPerformanceMarkdown(
    batchLabel,
    stats,
    actionBreakdown,
    ruleBreakdown,
    thesisBreakdown
  ));

  console.log('\n[Step 4] 產出聚合策略洞察 (Insights Runs)...');
  console.log('\n--- 執行策略優化分析 ---\n');
  console.log(insightsReportGenerator.buildInsightsMarkdown(insights));

  console.log('\n✅ MVP 批次驗收測試全數通過。');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 批次驗證失敗:', err);
  process.exit(1);
});
