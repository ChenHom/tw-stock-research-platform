import { execSync } from 'node:child_process';
import { createSqlContext } from '../src/modules/storage/SqlContext.js';

async function run() {
  console.log('🚀 開始 E2E Smoke Test...');
  
  // 1. 初始化環境
  process.env.STORAGE_TYPE = 'postgres';
  const sql = createSqlContext();
  
  try {
    console.log('[1/4] 清空資料庫...');
    execSync('npm run db:clear', { stdio: 'inherit' });

    console.log('\n[2/4] 執行 MVP 測試腳本...');
    // 使用 2024-04-03 確保有後續的 T+1, T+5 可以抓
    execSync('./scripts/mvp-daily.sh 2024-04-03', { stdio: 'inherit' });

    console.log('\n[3/4] 驗證資料層完整性...');
    const runs = await sql`SELECT * FROM research_runs`;
    if (runs.length !== 1) throw new Error(`預期 1 筆 run，實際 ${runs.length} 筆`);
    const runId = runs[0].run_id;

    const results = await sql`SELECT * FROM candidate_research_results WHERE run_id = ${runId}`;
    if (results.length !== 5) throw new Error(`預期 5 筆 result，實際 ${results.length} 筆`);

    const outcomes = await sql`SELECT * FROM research_outcomes WHERE run_id = ${runId}`;
    if (outcomes.length < 4) throw new Error(`預期大於等於 4 筆 outcome，實際 ${outcomes.length} 筆`);

    const validReturns = outcomes.filter((o: any) => o.t_plus_5_return !== null);
    if (validReturns.length < 4) throw new Error(`預期大於等於 4 筆 T+5 報酬，實際 ${validReturns.length} 筆，回填可能失敗或日期有誤`);

    console.log('✅ 資料層斷言全數通過！');

  } catch (err: any) {
    console.error('\n❌ E2E 測試失敗:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
