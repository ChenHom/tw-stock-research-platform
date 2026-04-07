import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  console.log(`[CLI] 啟動成效回填任務 | 模式: ${mode}`);

  const app = bootstrap();
  const outcomeService = app.researchOutcomeService;
  const queryService = app.researchRunQueryService;

  try {
    let runId = param;

    // 1. 決定目標 runId
    if (mode === 'latest') {
      const latest = await queryService.getLatestRunSummary();
      if (!latest) {
        console.log('找不到任何研究任務。');
        return;
      }
      runId = latest.run.runId;
    }

    if (!runId) {
      console.error('請提供任務 ID。用法: npm run outcomes <runId>');
      process.exit(1);
    }

    // 2. 執行回填
    console.log(`[CLI] 正在為任務 ${runId} 回填後續行情資料...`);
    await outcomeService.backfillOutcomes(runId);
    
    console.log(`[CLI] 任務 ${runId} 的成效數據已成功更新。`);

  } catch (error) {
    console.error('[CLI] 成效回填失敗:', error);
    process.exit(1);
  }
}

main();
