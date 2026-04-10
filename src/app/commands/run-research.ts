import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { ReportGenerator } from '../../modules/reporting/ReportGenerator.js';

async function main() {
  const stockId = process.argv[2] || '2330';
  const tradeDate = process.argv[3] || toTaipeiDateString();
  const hasPosition = process.argv.includes('--position');

  console.log(`[CLI] 執行研究命令: ${stockId} @ ${tradeDate} (持倉: ${hasPosition})`);

  const app = bootstrap();
  const reportGenerator = new ReportGenerator();

  // 1. 取得預算快照 (模擬初次調用)
  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  // 2. 執行完整 Pipeline
  try {
    const result = await app.researchPipeline.run({
      stockId,
      tradeDate,
      accountTier: 'free',
      useCache: true,
      hasPosition
    }, budget);

    console.log('\n--- 1. 研究結果 (JSON) ---');
    console.log(JSON.stringify({
      stockId: result.stockId,
      tradeDate: result.tradeDate,
      action: result.finalDecision.action,
      confidence: result.finalDecision.confidence,
      summary: result.finalDecision.summary,
      totalScore: result.featureSnapshot.payload.totalScore,
      missingFields: result.featureSnapshot.payload.missingFields
    }, null, 2));

    console.log('\n--- 2. 研究報告 (Markdown) ---');
    const mdReport = reportGenerator.buildPositionReport(
      result.featureSnapshot.payload,
      result.thesisSnapshot || null,
      null, // Valuation 暫不提供
      result.finalDecision
    );
    console.log(mdReport);

  } catch (error) {
    console.error('[CLI] 執行失敗:', error);
    process.exit(1);
  }
}

main();
