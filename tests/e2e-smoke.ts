import { bootstrap } from '../src/app/bootstrap.js';
import { ResearchAssertions } from '../src/app/utils/assertions.js';
import { clearResearchData } from '../src/app/utils/clear-research-data.js';
import { PerformanceReportGenerator } from '../src/modules/reporting/PerformanceReportGenerator.js';
import { ResearchInsightsService } from '../src/app/services/ResearchInsightsService.js';
import { InsightsReportGenerator } from '../src/modules/reporting/InsightsReportGenerator.js';

async function run() {
  console.log('🚀 開始 E2E Smoke Test...');
  let exitCode = 0;
  
  // 1. 初始化環境
  process.env.STORAGE_TYPE = 'postgres';
  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;
  const performanceReportGenerator = new PerformanceReportGenerator();
  const insightsService = new ResearchInsightsService();
  const insightsReportGenerator = new InsightsReportGenerator();
  const tradeDate = '2024-04-03';
  const stockIds = ['2330', '3363', '1560', '6187', '2002'];
  
  try {
    console.log('[1/4] 清空資料庫...');
    await clearResearchData();

    console.log('\n[2/4] 直接執行專案研究閉環...');
    const { runId, results } = await app.candidateResearchService.runDetailed({
      criteria: { minVolume: 2000, maxPe: 25 },
      tradeDate,
      topN: stockIds.length,
      accountTier: 'free',
      stockIds
    }, app.budgetGuard.evaluate('finmind', 0, 600));
    await app.researchOutcomeService.backfillOutcomes(runId);

    const actionBreakdown = await perfService.getBatchActionBreakdown([runId]);
    const ruleBreakdown = await perfService.getBatchRuleBreakdown([runId]);
    const thesisBreakdown = await perfService.getBatchThesisBreakdown([runId]);

    console.log('\n[3/4] 驗證資料層完整性與品質...');
    const latest = await queryService.getLatestRunSummary();
    if (!latest) throw new Error('找不到任務紀錄');
    
    if (latest.run.runId !== runId) throw new Error('latest runId 與本次研究任務不一致');
    if (latest.results.length !== 5) throw new Error(`預期 5 筆 result，實際 ${latest.results.length} 筆`);
    if (results.length !== 5) throw new Error(`預期 5 筆直接研究結果，實際 ${results.length} 筆`);

    const stats = await perfService.getRunPerformance(runId);
    if (!stats) throw new Error('無法獲取效能統計');

    const result = ResearchAssertions.validateQuality(stats, {
      minReturnCoverage: 80,
      expectedRunCount: 1,
      actualRunCount: 1
    });

    if (!result.success) {
      throw new Error(`品質驗證失敗: ${result.errors.join(', ')}`);
    }

    const performanceReport = performanceReportGenerator.buildPerformanceMarkdown(
      runId,
      stats,
      actionBreakdown,
      ruleBreakdown,
      thesisBreakdown
    );
    const insightsReport = insightsReportGenerator.buildInsightsMarkdown(
      insightsService.analyze(
        runId,
        stats,
        actionBreakdown,
        ruleBreakdown,
        thesisBreakdown
      )
    );

    if (!performanceReport.includes('總研究個股數')) throw new Error('績效報表未成功產出');
    if (!insightsReport.includes('研究任務優化建議報告')) throw new Error('洞察報表未成功產出');

    console.log(`✅ 品質指標達標: 5D 報酬覆蓋=${stats.validReturnCount}/${stats.totalCount}`);
    console.log('✅ 資料層斷言全數通過！');

  } catch (err: any) {
    console.error('\n❌ E2E 測試失敗:', err.message);
    exitCode = 1;
  } finally {
    if (typeof (app.cache as any)?.close === 'function') {
      await (app.cache as any).close();
    }
    // SqlContext 會在 bootstrap 建立，但我們需要關閉它
    // 這裡簡單處理，或者在 bootstrap 回傳 sql context
    if (app.repositories.researchRuns && (app.repositories.researchRuns as any).sql) {
      await (app.repositories.researchRuns as any).sql.end();
    }
    process.exit(exitCode);
  }
}

run();
