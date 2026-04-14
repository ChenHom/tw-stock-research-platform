import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheKeyFactory } from '../src/modules/cache/CacheKeyFactory.js';

test('CacheKeyFactory: 不同 provider 應產生不同 key，避免 fallback 快取污染', () => {
  const twseKey = CacheKeyFactory.create('twse', 'market_daily_latest', 'free', '6761', '2024-04-03');
  const finmindKey = CacheKeyFactory.create('finmind', 'market_daily_latest', 'free', '6761', '2024-04-03');

  assert.notStrictEqual(twseKey, finmindKey);
  assert.strictEqual(twseKey, 'twse:market_daily_latest:free:6761:2024-04-03');
});
