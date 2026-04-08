import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { CandidateResearchReportGenerator } from '../../modules/reporting/CandidateResearchReportGenerator.js';
import type { CandidateResearchResultRecord } from '../../core/contracts/storage.js';

async function main() {
  const tradeDate = process.argv.find(a => !a.startsWith('-') && /^\d{4}-\d{2}-\d{2}$/.test(a)) || toTaipeiDateString();
  const topN = parseInt(process.argv.find(a => /^\d+$/.test(a)) || '5', 10);
  const isMock = process.argv.includes('--mock');
  const forcedStocks = process.argv.find(a => a.startsWith('--stocks='))?.split('=')[1]?.split(',') || null;

  const app = bootstrap();
  const reportGenerator = new CandidateResearchReportGenerator();
  const runId = randomUUID();

  console.log(`[CLI] 啟動任務: ${runId} | 日期: ${tradeDate}`);

  if (isMock) {
    class InternalMockProvider {
      public providerName = 'mock';
      constructor(private mockData: any) {}
      supports(dataset: string) { return true; }
      async fetch(query: any) {
        return { 
          data: this.mockData[query.dataset] || [], 
          source: { provider: 'mock', dataset: query.dataset, fetchedAt: new Date().toISOString(), asOf: tradeDate } 
        };
      }
    }
    const mockData = {
      'market_daily_latest': [{ stockId: '2330', Code: '2330', OpeningPrice: '600', HighestPrice: '610', LowestPrice: '595', ClosingPrice: '605', TradeVolume: '1000', TradeValue: '1000000', Transaction: '100' }],
      'daily_valuation': [{ stockId: '2330', Code: '2330', PEratio: '12', PBratio: '2.5', DividendYield: '3' }],
      'month_revenue': [{ stockId: '2330', revenueYoy: 0.3, yearMonth: '2024-03' }],
      'institutional_flow': [{ stockId: '2330', totalNet: 1000 }]
    };
    const mockProvider = new InternalMockProvider(mockData);
    (app.providerRegistry as any).providers = [(mockProvider as any)];
  }

  const budget = app.budgetGuard.evaluate('finmind', 0, 600);

  try {
    // 1. 初始化研究紀錄 (關鍵修正：不論模式都必須有 Run 紀錄)
    await app.repositories.researchRuns.save({
      runId,
      tradeDate,
      criteria: forcedStocks ? { forced: forcedStocks } : { minVolume: 2000, maxPe: 25 },
      topN: forcedStocks ? forcedStocks.length : topN,
      accountTier: 'free',
      status: 'running',
      startedAt: new Date()
    });

    let results = [];

    if (forcedStocks) {
      console.log(`[CLI] 強制研究模式: ${forcedStocks.join(', ')}`);
      for (const stockId of forcedStocks) {
        try {
          const research = await app.researchPipeline.run({
            stockId, tradeDate, accountTier: 'free', useCache: true
          }, budget);
          results.push({ stockId, preliminaryScore: 0, research }); // 假分數歸 0
        } catch (e) {
          console.error(`[CLI] 深度研究失敗 (${stockId}):`, e);
        }
      }
    } else {
      // 使用協調器執行 (原本就具備 UUID 內部邏輯，但為了統一改手動呼叫)
      // 注意：這裡為了確保 runId 一致，直接調用內層組件而非 Service.run
      const candidates = await app.screeningService.screen({ minVolume: 2000, maxPe: 25 });
      const topCandidates = candidates.slice(0, topN);
      for (const cand of topCandidates) {
        const research = await app.researchPipeline.run({
          stockId: cand.stockId, tradeDate, accountTier: 'free', useCache: true
        }, budget);
        results.push({ stockId: cand.stockId, preliminaryScore: cand.preliminaryScore, research });
      }
    }

    // 2. 儲存結果並更新狀態 (確保資料鏈串接)
    const records: CandidateResearchResultRecord[] = results.map(r => ({
      runId,
      stockId: r.stockId,
      preliminaryScore: r.preliminaryScore,
      researchTotalScore: r.research.featureSnapshot.payload.totalScore,
      finalAction: r.research.finalDecision.action,
      confidence: r.research.finalDecision.confidence,
      summary: r.research.finalDecision.summary,
      ruleResults: r.research.ruleResults,
      thesisStatus: r.research.thesisStatus
    }));

    await app.repositories.researchRuns.saveResults(records);
    await app.repositories.researchRuns.updateStatus(runId, 'completed');

    console.log(`\n[CLI] 研究任務完成。RunId: ${runId}`);
    console.log('\n--- 候選池研究報表 ---');
    console.log(reportGenerator.buildRunResultTable(results.map(r => ({
      ...r.research,
      preliminaryScore: r.preliminaryScore
    })), tradeDate));

    process.exit(0);

  } catch (error) {
    console.error('[CLI] 任務執行失敗:', error);
    await app.repositories.researchRuns.updateStatus(runId, 'failed');
    process.exit(1);
  }
}

main();
