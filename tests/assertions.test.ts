import { test } from 'node:test';
import assert from 'node:assert';
import { ResearchAssertions } from '../src/app/utils/assertions.js';
import type { PerformanceStats } from '../src/app/services/ResearchPerformanceService.js';

test('ResearchAssertions: validateQuality', async (t) => {
  await t.test('應在資料品質達標時回傳成功', () => {
    const stats: PerformanceStats = {
      totalCount: 10,
      evaluableCount: 10,
      correctDirectionCount: 8,
      accuracy: 0.8,
      averageReturn5D: 0.05,
      validReturnCount: 9 // 90% coverage
    };

    const result = ResearchAssertions.validateQuality(stats, {
      minReturnCoverage: 80,
      expectedRunCount: 1,
      actualRunCount: 1
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test('應在報酬覆蓋率不足時回傳錯誤', () => {
    const stats: PerformanceStats = {
      totalCount: 10,
      evaluableCount: 10,
      correctDirectionCount: 5,
      accuracy: 0.5,
      averageReturn5D: 0.01,
      validReturnCount: 5 // 50% coverage
    };

    const result = ResearchAssertions.validateQuality(stats, {
      minReturnCoverage: 80
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.errors.some(e => e.includes('覆蓋率過低')));
  });

  await t.test('應在任務數量不符時回傳錯誤', () => {
    const stats: PerformanceStats = {
      totalCount: 5,
      evaluableCount: 5,
      correctDirectionCount: 3,
      accuracy: 0.6,
      averageReturn5D: 0.02,
      validReturnCount: 5
    };

    const result = ResearchAssertions.validateQuality(stats, {
      expectedRunCount: 5,
      actualRunCount: 3
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.errors.some(e => e.includes('任務數量不符')));
  });
});

test('ResearchAssertions: checkStatisticalSignificance', async (t) => {
  await t.test('應在有任一項達標時回傳顯著', () => {
    const rules = [{ evaluableCount: 10 }] as any;
    const thesis = [{ evaluableCount: 5 }] as any;
    const sig = ResearchAssertions.checkStatisticalSignificance(rules, thesis, 10);
    assert.strictEqual(sig.isSignificant, true);
  });

  await t.test('應在皆未達標時回傳警告', () => {
    const rules = [{ evaluableCount: 9 }] as any;
    const thesis = [{ evaluableCount: 9 }] as any;
    const sig = ResearchAssertions.checkStatisticalSignificance(rules, thesis, 10);
    assert.strictEqual(sig.isSignificant, false);
    assert.ok(sig.message.includes('警告'));
  });
});

test('ResearchAssertions: describeValidationWindow', async (t) => {
  await t.test('應對 3-5 日回傳 stability 規格', () => {
    const spec = ResearchAssertions.describeValidationWindow(3);
    assert.strictEqual(spec.stage, 'stability');
    assert.ok(spec.insightPolicy.includes('early-stage'));
  });

  await t.test('應對 6-10 日回傳 observation 規格', () => {
    const spec = ResearchAssertions.describeValidationWindow(8);
    assert.strictEqual(spec.stage, 'observation');
    assert.ok(spec.acceptanceCriteria.some(item => item.includes('runId')));
  });
});
