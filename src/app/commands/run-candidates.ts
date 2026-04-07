import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { CandidateResearchReportGenerator } from '../../modules/reporting/CandidateResearchReportGenerator.js';

async function main() {
  const tradeDate = process.argv[2] || toTaipeiDateString();
  const topN = parseInt(process.argv[3] || '5', 10);

  console.log(`[CLI] 啟動候選池研究任務 | 日期: ${tradeDate} | 取 Top: ${topN}`);

  const app = bootstrap();
  const reportGenerator = new CandidateResearchReportGenerator();

  // 1. 設定預算快照
  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  try {
    // 2. 執行全流程 (篩選 + 批次研究)
    const results = await app.candidateResearchService.run({
      criteria: {
        minVolume: 2000,
        maxPe: 25
      },
      tradeDate,
      topN,
      accountTier: 'free'
    }, budget);

    if (results.length === 0) {
      console.warn('[CLI] 找不到符合條件的候選股。');
      return;
    }

    // 3. 產出報告
    console.log('\n--- 候選池研究報表 ---');
    const markdownReport = reportGenerator.buildMarkdownTable(results);
    console.log(markdownReport);

    // 4. 同時儲存為 JSON 以供後續使用
    const summaryJson = reportGenerator.buildSummaryJson(results);
    // console.log('\n--- 摘要 JSON ---');
    // console.log(JSON.stringify(summaryJson, null, 2));

  } catch (error) {
    console.error('[CLI] 任務執行失敗:', error);
    process.exit(1);
  }
}

main();
