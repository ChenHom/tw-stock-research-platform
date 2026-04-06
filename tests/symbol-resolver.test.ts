import test from 'node:test';
import assert from 'node:assert/strict';
import { SymbolResolver } from '../src/modules/symbol/SymbolResolver.js';

test('SymbolResolver: 應能建立基礎解析結構', (t) => {
  const resolver = new SymbolResolver();
  const result = resolver.resolve('2330');
  
  assert.strictEqual(result.input, '2330');
  assert.strictEqual(typeof result.confidence, 'number');
  assert.ok(Array.isArray(result.candidates));
});
