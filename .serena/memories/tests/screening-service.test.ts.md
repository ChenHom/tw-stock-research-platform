import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreeningService } from '../src/app/services/ScreeningService.js';
import { ProviderRegistry } from '../src/modules/providers/ProviderRegistry.js';
import { MockProvider } from './mocks/MockProvider.js';

test('ScreeningService (產品第一層): 應能僅透過市場量價與估值資料執行初篩', async (t) => {
  // 1. Mock 資料：包含量價 (market_daily_latest) 與 估值 (daily_valuation)
  const mockProvider = new MockProvider({
    'market_daily_latest': [
      { stockId: '2330', close: 600, volume: 5000 },
      { stockId: '2454', close: 1000, volume: 1000 },
      { stockId: '2317', close: 150, volume: 10000 }
    ],
    'daily_valuation': [
      { stockId: '2330', peRatio: 12, pbRatio: 2.5, dividendYield: 3 },
      { stockId: '2454', peRatio: 20, pbRatio: 3.5, dividendYield: 2 },
      { stockId: '2317', peRatio: 8, pbRatio: 1.2, dividendYield: 6 }
    ]
  });
  const providerRegistry = new ProviderRegistry([mockProvider]);

  // 2. Mock Router：強迫走 mock
  const mockRouter: any = {
    decide: (dataset: string) => ({
      dataset,
      finalProviderOrder: ['mock'],
      canProceed: true,
      queryMode: 'bulk'
    })
  };

  const service = new ScreeningService(mockRouter, providerRegistry);

  // 3. 執行篩選 (minVolume=2000, maxPe=15)
  const results = await service.screen({
    minVolume: 2000,
    maxPe: 15
  });

  // 預期結果：
  // 2330: vol=5000 (>2000), pe=12 (<15) -> 通過
  // 2454: vol=1000 (<2000) -> 失敗
  // 2317: vol=10000 (>2000), pe=8 (<15) -> 通過
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].stockId, '2317'); 
  assert.strictEqual(results[1].stockId, '2330');

  // 確認預設分數有計算
  assert.ok(results[0].preliminaryScore > 0);
  
  // 確認已移除的欄位不在結果中 (TypeScript 應會報錯，但這裡我們檢查執行期屬性)
  assert.strictEqual((results[0] as any).revenueYoy, undefined, '初篩結果不應包含 revenueYoy');
  assert.strictEqual((results[0] as any).institutionalNet, undefined, '初篩結果不應包含 institutionalNet');
});