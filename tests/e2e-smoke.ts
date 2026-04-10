import { execSync } from 'node:child_process';
import { bootstrap } from '../src/app/bootstrap.js';
import { ResearchAssertions } from '../src/app/utils/assertions.js';

async function run() {
  console.log('🚀 開始 E2E Smoke Test...');
  
  // 1. 初始化環境
  process.env.STORAGE_TYPE = 'postgres';
  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;
  
  try {
    console.log('[1/4] 清空資料庫...');
    execSync('npm run db:clear', { stdio: 'inherit' });

    console.log('\n[2/4] 執行 MVP 測試腳本...');
    // 使用 2024-04-03 確保有後續的 T+1, T+5 可以抓
    execSync('./scripts/mvp-daily.sh 2024-04-03', { stdio: 'inherit' });

    console.log('\n[3/4] 驗證資料層完整性與品質...');
    const latest = await queryService.getLatestRunSummary();
    if (!latest) throw new Error('找不到任務紀錄');
    
    const runId = latest.run.runId;
    if (latest.results.length !== 5) throw new Error(`預期 5 筆 result，實際 ${latest.results.length} 筆`);

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

    console.log(`✅ 品質指標達標: 5D 報酬覆蓋=${stats.validReturnCount}/${stats.totalCount}`);
    console.log('✅ 資料層斷言全數通過！');

  } catch (err: any) {
    console.error('\n❌ E2E 測試失敗:', err.message);
    process.exit(1);
  } finally {
    // SqlContext 會在 bootstrap 建立，但我們需要關閉它
    // 這裡簡單處理，或者在 bootstrap 回傳 sql context
    if (app.repositories.researchRuns && (app.repositories.researchRuns as any).sql) {
      await (app.repositories.researchRuns as any).sql.end();
    }
  }
}

run();
