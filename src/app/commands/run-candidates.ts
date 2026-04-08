import 'dotenv/config';
import { bootstrap } from '../bootstrap.js';
import { toTaipeiDateString } from '../../core/utils/date.js';
import { CandidateResearchReportGenerator } from '../../modules/reporting/CandidateResearchReportGenerator.js';

async function main() {
  const tradeDate = process.argv.find(a => !a.startsWith('-') && /^\d{4}-\d{2}-\d{2}$/.test(a)) || toTaipeiDateString();
  const topN = parseInt(process.argv.find(a => /^\d+$/.test(a)) || '5', 10);
  const isMock = process.argv.includes('--mock');

  console.log(`[CLI] 啟動候選池研究任務 | 日期: ${tradeDate} | 取 Top: ${topN} ${isMock ? '(MOCK 模式)' : ''}`);

  const app = bootstrap();
  const reportGenerator = new CandidateResearchReportGenerator();

  if (isMock) {
    // 內聯定義 MockProvider 以避免跨目錄引用 (RootDir 限制)
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
    const registry = app.providerRegistry as any;
    registry.providers = [mockProvider];
  }

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
