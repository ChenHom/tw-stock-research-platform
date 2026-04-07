import { createClient } from 'redis';
import type { CacheEnvelope, CacheStore } from './CacheEnvelope.js';

export interface RedisCacheConfig {
  url: string;
}

export class RedisCacheStore implements CacheStore {
  private client;

  constructor(config: RedisCacheConfig) {
    this.client = createClient({ url: config.url });
    this.client.on('error', (err) => console.error('[Redis] Client Error', err));
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
    await this.connect();
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as CacheEnvelope<T>;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: CacheEnvelope<T>, ttlSeconds: number): Promise<void> {
    await this.connect();
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  }

  async delete(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.connect();
    await this.client.flushDb();
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
