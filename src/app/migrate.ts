import { MigrationManager } from '../modules/storage/MigrationManager.js';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const command = process.argv[2] || 'up';
  const steps = parseInt(process.argv[3] || '1', 10);

  const dbUser = process.env.DB_USER || 'researcher';
  const dbPass = process.env.DB_PASSWORD || 'research_pass';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'tw_stock_research';

  const connectionUrl = `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');

  const manager = new MigrationManager({ connectionUrl, migrationsDir });

  try {
    switch (command) {
      case 'up':
        await manager.up();
        break;
      case 'rollback':
        await manager.rollback(steps);
        break;
      case 'clear':
        await manager.clear();
        break;
      case 'reset':
        await manager.reset();
        break;
      default:
        console.error(`未知命令: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('[遷移失敗]', error);
    process.exit(1);
  } finally {
    await manager.close();
  }
}

main();
