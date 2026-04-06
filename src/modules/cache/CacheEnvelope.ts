import type { NormalizedResponse } from '../../core/types/provider.js';

/**
 * 快取信封：包裝正規化後的響應，並帶有過期資訊
 */
export interface CacheEnvelope<T> {
  response: NormalizedResponse<T>;
  expiresAt: number; // Timestamp (ms)
  createdAt: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<CacheEnvelope<T> | null>;
  set<T>(key: string, value: CacheEnvelope<T>, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 記憶體快取實作 (開發期與測試用)
 */
export class MemoryCacheStore implements CacheStore {
  private store = new Map<string, CacheEnvelope<any>>();

  async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item;
  }

  async set<T>(key: string, value: CacheEnvelope<T>): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
