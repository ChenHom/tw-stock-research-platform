import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';

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
          return;
        }
        // 複用現有的表格產生器
        // 為了對齊 CandidateResearchResult 介面，我們需要簡單轉換
        const results = summary.results.map(r => ({
          stockId: r.stockId,
          preliminaryScore: r.preliminaryScore,
          research: {
            stockId: r.stockId,
            tradeDate: summary.run.tradeDate,
            featureSnapshot: { payload: { totalScore: r.researchTotalScore } },
            finalDecision: { action: r.finalAction, confidence: r.confidence, summary: r.summary }
          }
        }));
        console.log(reportGenerator.buildMarkdownTable(results as any));
        break;
      }

      case 'date': {
        const date = param || new Date().toISOString().split('T')[0];
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
        // 轉換為報表格式
        const tableResults = results.map(r => ({
          stockId: r.stockId,
          preliminaryScore: r.preliminaryScore,
          research: {
            stockId: r.stockId,
            featureSnapshot: { payload: { totalScore: r.researchTotalScore } },
            finalDecision: { action: r.finalAction, confidence: r.confidence, summary: r.summary }
          }
        }));
        console.log(reportGenerator.buildMarkdownTable(tableResults as any));
        break;
      }

      default:
        console.error('未知模式。支援: latest, date, detail');
        process.exit(1);
    }
  } catch (error) {
    console.error('[CLI] 查詢失敗:', error);
    process.exit(1);
  }
}

main();
