import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchRangeService } from '../src/app/services/ResearchRangeService.js';

test('ResearchRangeService: 應逐日執行研究並彙整區間摘要', async () => {
  const service = new ResearchRangeService({
    run: async ({ tradeDate }: { tradeDate: string }) => ({
      stockId: '6761',
      tradeDate,
      rawData: {},
      diagnostics: {
        isHistoricalPointInTime: true,
        isNonTradingDay: tradeDate === '2024-04-03'
      },
      featureSnapshot: {
        id: `${tradeDate}-snapshot`,
        stockId: '6761',
        snapshotAt: tradeDate,
        featureSetVersion: 'test',
        payload: {
          stockId: '6761',
          tradeDate,
          totalScore: tradeDate === '2024-04-02' ? 30 : 55,
          closePrice: 90,
          ma20: 80,
          institutionalNet: tradeDate === '2024-04-02' ? -1000 : 1000,
          revenueYoy: 0.15,
          missingFields: tradeDate === '2024-04-03' ? ['market_daily'] : []
        }
      },
      thesisStatus: tradeDate === '2024-04-02' ? 'broken' : 'weakened',
      ruleResults: [],
      finalDecision: {
        stockId: '6761',
        decisionDate: tradeDate,
        action: tradeDate === '2024-04-02' ? 'BLOCK' : 'WATCH',
        confidence: 0.45,
        summary: 'summary',
        supportingRules: [],
        blockingRules: [],
        thesisStatus: tradeDate === '2024-04-02' ? 'broken' : 'weakened',
        composerVersion: 'test'
      }
    })
  } as any);

  const result = await service.run({
    stockId: '6761',
    startDate: '2024-04-01',
    endDate: '2024-04-03'
  });

  assert.strictEqual(result.days.length, 2);
  assert.strictEqual(result.summary.requestedDays, 3);
  assert.strictEqual(result.summary.totalDays, 2);
  assert.strictEqual(result.summary.skippedNonTradingDays, 1);
  assert.strictEqual(result.summary.watchCount, 1);
  assert.strictEqual(result.summary.blockCount, 1);
  assert.strictEqual(result.summary.degradedDays, 0);
  assert.strictEqual(result.days[1].tradeDate, '2024-04-02');
});

test('ResearchRangeService: 指定 includeCalendarDays 時應保留非交易日', async () => {
  const service = new ResearchRangeService({
    run: async ({ tradeDate }: { tradeDate: string }) => ({
      stockId: '6761',
      tradeDate,
      rawData: {},
      diagnostics: {
        isHistoricalPointInTime: true,
        isNonTradingDay: tradeDate === '2024-04-03'
      },
      featureSnapshot: {
        id: `${tradeDate}-snapshot`,
        stockId: '6761',
        snapshotAt: tradeDate,
        featureSetVersion: 'test',
        payload: {
          stockId: '6761',
          tradeDate,
          totalScore: 5,
          closePrice: 0,
          ma20: 0,
          institutionalNet: 0,
          revenueYoy: 0,
          missingFields: ['market_daily']
        }
      },
      thesisStatus: 'broken',
      ruleResults: [],
      finalDecision: {
        stockId: '6761',
        decisionDate: tradeDate,
        action: 'WATCH',
        confidence: 0.2,
        summary: 'non-trading',
        supportingRules: [],
        blockingRules: [],
        thesisStatus: 'broken',
        composerVersion: 'test'
      }
    })
  } as any);

  const result = await service.run({
    stockId: '6761',
    startDate: '2024-04-03',
    endDate: '2024-04-03',
    includeCalendarDays: true
  });

  assert.strictEqual(result.days.length, 1);
  assert.strictEqual(result.summary.watchCount, 1);
  assert.strictEqual(result.days[0].isNonTradingDay, true);
  assert.strictEqual(result.summary.skippedNonTradingDays, 0);
});
