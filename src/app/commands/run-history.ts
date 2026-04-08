import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';

async function main() {
  const mode = process.argv[2] || 'latest';
  const param = process.argv[3];

  const app = bootstrap();
  const queryService = app.researchRunQueryService;
  const reportGenerator = app.candidateResearchReportGenerator;

  try {
    switch (mode) {
      case 'latest': {
        console.log('[CLI] 正在獲取最近一次研究摘要...');
        const summary = await queryService.getLatestRunSummary();
        if (!summary) {
          console.log('找不到任何研究紀錄。');
          process.exit(0);
        }
        console.log(reportGenerator.buildRunResultTable(summary.results, summary.run.tradeDate));
        break;
      }

      case 'date': {
        const date = param || toTaipeiDateString();
        console.log(`[CLI] 正在查詢 ${date} 的任務列表...`);
        const runs = await queryService.findRunsByDate(date);
        console.log(reportGenerator.buildRunHistoryTable(runs));
        break;
      }

      case 'detail': {
        if (!param) {
          console.error('請提供任務 ID。用法: npm run run-history detail <runId>');
          process.exit(1);
        }
        console.log(`[CLI] 正在獲取任務細節: ${param}`);
        const results = await queryService.getRunDetail(param);
        if (results.length === 0) {
          console.log('找不到該任務或該任務無結果。');
          process.exit(0);
        }
        console.log(reportGenerator.buildRunResultTable(results, '任務內容'));
        break;
      }

      default:
        console.error('未知模式。支援: latest, date, detail');
        process.exit(1);
    }
    
    // 強制結束以關閉連線池
    process.exit(0);

  } catch (error) {
    console.error('[CLI] 查詢失敗:', error);
    process.exit(1);
  }
}

main();
