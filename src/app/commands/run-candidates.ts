import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { CandidateResearchReportGenerator } from '../../modules/reporting/CandidateResearchReportGenerator.js';

async function main() {
  const tradeDate = process.argv.find(a => !a.startsWith('-') && /^\d{4}-\d{2}-\d{2}$/.test(a)) || toTaipeiDateString();
  const topN = parseInt(process.argv.find(a => /^\d+$/.test(a)) || '5', 10);
  const isMock = process.argv.includes('--mock');
  const forcedStocks = process.argv.find(a => a.startsWith('--stocks='))?.split('=')[1]?.split(',') || null;

  console.log(`[CLI] 啟動候選池研究任務 | 日期: ${tradeDate} | 取 Top: ${topN} ${isMock ? '(MOCK 模式)' : ''}`);
  if (forcedStocks) console.log(`[CLI] 強制研究指定股票: ${forcedStocks.join(', ')}`);

  const app = bootstrap();
  const reportGenerator = new CandidateResearchReportGenerator();

  // ... (Mock provider setup unchanged) ...

  // 1. 設定預算快照
  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  try {
    let results;
    if (forcedStocks) {
      // 若有指定股票，略過 Screening 直接對這些股票進行深度研究
      console.log(`[CLI] 略過初篩，直接對 ${forcedStocks.length} 檔股票執行 Pipeline...`);
      results = [];
      for (const stockId of forcedStocks) {
        try {
          const research = await app.researchPipeline.run({
            stockId,
            tradeDate,
            accountTier: 'free',
            useCache: true
          }, budget);
          results.push({
            stockId,
            preliminaryScore: 100, // 強制進入研究的基準分
            research
          });
        } catch (e) {
          console.error(`[CLI] 深度研究失敗 (${stockId}):`, e);
        }
      }
    } else {
      // 2. 執行全流程 (篩選 + 批次研究)
      results = await app.candidateResearchService.run({
        criteria: {
          minVolume: 2000,
          maxPe: 25
        },
        tradeDate,
        topN,
        accountTier: 'free'
      }, budget);
    }

    if (results.length === 0) {
      console.warn('[CLI] 找不到符合條件的候選股。');
      process.exit(0);
    }

    // 3. 產出報告
    console.log(`\n[CLI] 研究任務完成，結果已儲存至系統 (${process.env.STORAGE_TYPE || 'in-memory'})。`);
    console.log('\n--- 候選池研究報表 ---');
    const markdownReport = reportGenerator.buildMarkdownTable(results);
    console.log(markdownReport);
    process.exit(0);

  } catch (error) {
    console.error('[CLI] 任務執行失敗:', error);
    process.exit(1);
  }
}

main();
