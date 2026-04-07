import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  const app = bootstrap();
  const perfService = app.researchPerformanceService;
  const queryService = app.researchRunQueryService;

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

    console.log(`[CLI] 正在查詢任務績效: ${runId}`);
    const stats = await perfService.getRunPerformance(runId);

    if (!stats) {
      console.log('尚無該任務的成效數據 (可能尚未回填)。');
      return;
    }

    console.log('\n--- 研究成效統計 ---');
    console.log(`- 總研究檔數: ${stats.totalCount}`);
    console.log(`- 方向正確數: ${stats.correctDirectionCount}`);
    console.log(`- 預測準確率: ${(stats.accuracy * 100).toFixed(1)}%`);
    console.log(`- 5日平均報酬: ${(stats.averageReturn5D * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('[CLI] 績效查詢失敗:', error);
    process.exit(1);
  }
}

main();
