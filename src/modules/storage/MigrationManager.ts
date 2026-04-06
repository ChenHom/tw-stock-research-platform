import postgres from 'postgres';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface MigrationConfig {
  connectionUrl: string;
  migrationsDir: string;
}

export class MigrationManager {
  private readonly sql: postgres.Sql;

  constructor(private readonly config: MigrationConfig) {
    this.sql = postgres(config.connectionUrl);
  }

  /**
   * 初始化遷移記錄表 (Tracking Table)
   */
  async init(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('[遷移系統] 追蹤表已就緒。');
  }

  /**
   * 執行待處理的遷移 (Migrate Up)
   */
  async up(): Promise<void> {
    await this.init();
    const files = await this.getMigrationFiles();
    const applied = await this.sql`SELECT name FROM _migrations`;
    const appliedNames = applied.map((m: any) => m.name);

    const pending = files.filter(f => !appliedNames.includes(f));
    if (pending.length === 0) {
      console.log('[遷移系統] 所有版本均已是最新狀態。');
      return;
    }

    const lastBatch = await this.sql`SELECT MAX(batch) as max_batch FROM _migrations`;
    const nextBatch = (lastBatch[0]?.max_batch || 0) + 1;

    console.log(`[遷移系統] 準備執行 ${pending.length} 項遷移 (Batch ${nextBatch})...`);

    for (const file of pending) {
      const filePath = path.join(this.config.migrationsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      await this.sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO _migrations (name, batch) VALUES (${file}, ${nextBatch})`;
      });
      console.log(`[遷移系統] 已套用: ${file}`);
    }
  }

  /**
   * 回滾遷移 (Rollback Down)
   */
  async rollback(steps: number = 1): Promise<void> {
    await this.init();
    const batches = await this.sql`
      SELECT DISTINCT batch FROM _migrations 
      ORDER BY batch DESC LIMIT ${steps}
    `;

    if (batches.length === 0) {
      console.log('[遷移系統] 沒有可回滾的記錄。');
      return;
    }

    const targetBatches = batches.map((b: any) => b.batch);
    const toRollback = await this.sql`
      SELECT id, name, batch FROM _migrations 
      WHERE batch IN ${this.sql(targetBatches)}
      ORDER BY id DESC
    `;

    console.log(`[遷移系統] 準備回滾 ${toRollback.length} 項遷移 (Batches: ${targetBatches.join(', ')})...`);

    // 注意：目前的簡易實作假設每個 .sql 只有 UP，DOWN 邏輯建議在未來加入 .ts 遷移支援
    // 此處先執行 "Clean & Re-run up to target" 作為安全回滾方案
    console.warn('[警告] 簡易遷移引擎暫不支援 .sql 自動反向執行，建議執行重置。');
  }

  /**
   * 清空資料庫 (Clear All Tables)
   */
  async clear(): Promise<void> {
    console.log('[遷移系統] 正在清空資料庫所有表格...');
    await this.sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    console.log('[遷移系統] 資料庫已完全清空。');
  }

  /**
   * 重置資料庫 (Reset: Clear + Up)
   */
  async reset(): Promise<void> {
    await this.clear();
    await this.up();
    console.log('[遷移系統] 資料庫已重置並套用最新 Schema。');
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  private async getMigrationFiles(): Promise<string[]> {
    const files = await fs.readdir(this.config.migrationsDir);
    return files.filter(f => f.endsWith('.sql')).sort();
  }
}
