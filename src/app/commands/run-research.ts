import { bootstrap } from '../bootstrap.js';

async function main() {
  const stockId = process.argv[2] || '2330';
  const tradeDate = process.argv[3] || new Date().toISOString().split('T')[0];

  console.log(`[CLI] 執行研究命令: ${stockId} @ ${tradeDate}`);

  const app = bootstrap();

  // 1. 取得預算快照 (模擬初次調用)
  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  // 2. 執行完整 Pipeline
  try {
    const result = await app.researchPipeline.run({
      stockId,
      tradeDate,
      accountTier: 'free',
      useCache: true
    }, budget);

    console.log('\n--- 研究結果 (JSON) ---');
    console.log(JSON.stringify({
      stockId: result.stockId,
      tradeDate: result.tradeDate,
      action: result.finalDecision.action,
      confidence: result.finalDecision.confidence,
      summary: result.finalDecision.summary,
      totalScore: result.featureSnapshot.payload.totalScore,
      missingFields: result.featureSnapshot.payload.missingFields
    }, null, 2));

  } catch (error) {
    console.error('[CLI] 執行失敗:', error);
    process.exit(1);
  }
}

main();
