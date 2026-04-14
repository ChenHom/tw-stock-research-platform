import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';

function formatNumber(value: number | undefined, digits = 2): string {
  if (value === undefined || !Number.isFinite(value)) return 'N/A';
  return value.toFixed(digits);
}

async function main() {
  const stockId = process.argv[2] || '2330';
  const startDate = process.argv[3];
  const endDate = process.argv[4];
  const hasPosition = process.argv.includes('--position');
  const includeCalendarDays = process.argv.includes('--calendar-days');

  if (!startDate || !endDate) {
    console.log('使用方式: npm run research:range -- <stockId> <開始日期> <結束日期> [--position] [--calendar-days]');
    console.log('範例: npm run research:range -- 6761 2024-04-03 2024-04-13');
    process.exit(1);
  }

  const app = bootstrap();
  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  try {
    console.log(`[CLI] 執行區間研究命令: ${stockId} @ ${startDate} ~ ${endDate} (持倉: ${hasPosition}, 日曆日: ${includeCalendarDays})`);

    const result = await app.researchRangeService.run({
      stockId,
      startDate,
      endDate,
      accountTier: 'free',
      useCache: true,
      hasPosition,
      includeCalendarDays
    }, budget);

    console.log('\n--- 區間研究摘要 ---');
    console.log(JSON.stringify(result.summary, null, 2));

    console.log('\n--- 區間研究明細 ---');
    console.log('| 日期 | 動作 | 分數 | Thesis | 收盤 | MA20 | 法人 | 缺失資料 |');
    console.log('| --- | --- | ---: | --- | ---: | ---: | ---: | --- |');
    result.days.forEach(day => {
      console.log(
        `| ${day.tradeDate} | ${day.action} | ${day.totalScore} | ${day.thesisStatus} | ${formatNumber(day.closePrice)} | ${formatNumber(day.ma20)} | ${formatNumber(day.institutionalNet, 0)} | ${day.missingFields.join(', ') || '-'} |`
      );
    });

    if (result.summary.skippedNonTradingDays > 0) {
      console.log(`\n[CLI] 已略過 ${result.summary.skippedNonTradingDays} 個非交易日；若要保留日曆日，請加上 --calendar-days。`);
    }

    const effectiveDays = result.days.filter(day => day.missingFields.length === 0);
    if (effectiveDays.length > 0) {
      const strongest = [...effectiveDays].sort((a, b) => b.totalScore - a.totalScore)[0];
      console.log('\n--- 區間結論 ---');
      console.log(`有效研究日 ${effectiveDays.length}/${result.summary.totalDays}；BUY=${result.summary.buyCount}，WATCH=${result.summary.watchCount}，BLOCK=${result.summary.blockCount}。`);
      console.log(`最高分日期為 ${strongest.tradeDate}，動作 ${strongest.action}，分數 ${strongest.totalScore}。`);
    }

    process.exit(0);
  } catch (error) {
    console.error('[CLI] 區間研究執行失敗:', error);
    process.exit(1);
  }
}

main();
