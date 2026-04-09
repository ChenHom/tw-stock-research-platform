import 'dotenv/config';
import { execSync } from 'node:child_process';
import { bootstrap } from '../bootstrap.js';

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

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
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

  if (runIds.length === 0) {
    console.error('❌ 失敗: 未產出任何研究任務。');
    process.exit(1);
  }

  console.log('\n===========================================');
  console.log('📊 執行聚合分析與驗收斷言');
  console.log('===========================================');

  // 2. 獲取聚合績效數據
  const [stats, ruleBreakdown] = await Promise.all([
    perfService.getBatchPerformance(runIds),
    perfService.getBatchRuleBreakdown(runIds)
  ]);

  if (!stats) {
    console.error('❌ 失敗: 無法獲取聚合績效數據。');
    process.exit(1);
  }

  const coverage = (stats.validReturnCount / stats.totalCount) * 100;
  console.log(`\n✅ 聚合指標: 任務數=${runIds.length}, 總個股=${stats.totalCount}, 5D報酬覆蓋=${stats.validReturnCount} (${coverage.toFixed(1)}%)`);

  // --- 驗收斷言 (Assertions) ---
  console.log('\n[批次驗收斷言]');

  // 1. 任務數量需符合預期 (至少要大於 0)
  if (runIds.length === 0) {
    console.error('❌ 失敗: 任務數量為 0');
    process.exit(1);
  }

  // 2. 5D 報酬覆蓋率需 >= 80%
  if (coverage < 80) {
    console.error(`❌ 失敗: 5D 報酬覆蓋率過低 (${coverage.toFixed(1)}% < 80%)`);
    process.exit(1);
  }

  // 3. 確保至少有一項規則樣本數達到統計意義 (MIN_SAMPLES = 10)
  const hitsThreshold = ruleBreakdown.some(r => r.evaluableCount >= 10);
  if (!hitsThreshold) {
    console.warn('⚠️ 警告: 目前尚無任何規則樣本數達到 10 筆，洞察建議可能不具統計意義。');
  } else {
    console.log('✅ 統計門檻: 已有規則達到 10 筆以上樣本。');
  }

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
