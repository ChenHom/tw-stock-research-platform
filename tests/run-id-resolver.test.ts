import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRunLabel, resolveRunIds } from '../src/app/utils/run-id-resolver.js';

test('resolveRunIds: 應支援明確 runId 清單與去重', async () => {
  const queryService: any = {
    getLatestRunSummary: async () => null,
    findCompletedRunsByDate: async () => []
  };

  const runIds = await resolveRunIds('runs', 'run-1, run-2, run-1', queryService);
  assert.deepStrictEqual(runIds, ['run-1', 'run-2']);
});

test('resolveRunIds: 應支援 latest 與 range 模式', async () => {
  const queryService: any = {
    getLatestRunSummary: async () => ({ run: { runId: 'latest-run' } }),
    findCompletedRunsByDate: async (date: string) => {
      if (date === '2024-04-01') return [{ runId: 'run-a' }];
      if (date === '2024-04-02') return [{ runId: 'run-b' }, { runId: 'run-c' }];
      return [];
    }
  };

  const latest = await resolveRunIds('latest', undefined, queryService);
  const range = await resolveRunIds('range', '2024-04-01', queryService, ['2024-04-02']);

  assert.deepStrictEqual(latest, ['latest-run']);
  assert.deepStrictEqual(range, ['run-a', 'run-b', 'run-c']);
  assert.strictEqual(buildRunLabel(range), 'BATCH (3 runs)');
});
