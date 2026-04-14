import 'dotenv/config';
import { clearResearchData } from '../utils/clear-research-data.js';

async function clear() {
  console.log('[DB] 正在清空研究數據表...');
  try {
    await clearResearchData();
    console.log('✅ 資料庫已成功清空。');
  } catch (error) {
    console.error('❌ 清空失敗:', error);
    process.exit(1);
  }
  process.exit(0);
}

const mode = process.argv[2];
if (mode === 'clear') {
  clear();
} else {
  console.error('未知模式。請使用 clear');
  process.exit(1);
}
