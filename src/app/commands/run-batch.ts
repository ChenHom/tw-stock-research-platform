import 'dotenv/config';
import { execSync } from 'node:child_process';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { ResearchAssertions } from '../utils/assertions.js';

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

  console.log('===========================================');
  console.log('🚀 啟動跨平台 MVP 批次驗證任務');
  console.log(`📅 區間: ${startDateStr} ~ ${endDateStr}`);
  console.log(`🎯 樣本: ${stocks}`);
  console.log('===========================================');

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;

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
      execSync(`npm run candidates -- ${dateStr} --stocks=${stocks}`, { stdio: 'inherit' });

      console.log('[Step 2] 執行成效回填 (Outcomes) latest...');
      execSync('npm run outcomes latest', { stdio: 'inherit' });

      // 獲取該日期產出的 runId
      const runs = await queryService.findRunsByDate(dateStr);
      if (runs.length > 0) {
        runIds.push(runs[0].runId);
      }
    } catch (error: any) {
      console.error(`❌ 日期 ${dateStr} 處理失敗: ${error.message}`);
    }

    current.setDate(current.getDate() + 1);
  }

  console.log('\n===========================================');
  console.log('📊 執行聚合分析與驗收斷言');
  console.log('===========================================');

  // 2. 獲取聚合績效數據
  const [stats, ruleBreakdown, thesisBreakdown] = await Promise.all([
    perfService.getBatchPerformance(runIds),
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

  const sig = ResearchAssertions.checkStatisticalSignificance(ruleBreakdown, thesisBreakdown);
  console.log(sig.message);

  console.log('\n[Step 3] 產出聚合績效報表 (Performance Range)...');
  execSync(`npm run performance range ${startDateStr} ${endDateStr}`, { stdio: 'inherit' });

  console.log('\n[Step 4] 產出聚合策略洞察 (Insights Range)...');
  execSync(`npm run insights range ${startDateStr} ${endDateStr}`, { stdio: 'inherit' });

  console.log('\n✅ MVP 批次驗收測試全數通過。');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 批次驗證失敗:', err);
  process.exit(1);
});
