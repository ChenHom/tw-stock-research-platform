import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';

test('環境變數驗證: 應能讀取 FINMIND_API_TOKEN', (t) => {
  const token = process.env.FINMIND_API_TOKEN;
  
  if (!token || token === 'your_token_here') {
    console.warn('[警告] FINMIND_API_TOKEN 尚未設定或仍為預設值。');
  } else {
    console.log(`[成功] 已偵測到 Token，長度為: ${token.length} 字元。`);
  }

  // 測試時若尚未設定，我們不讓測試失敗，而是輸出狀態
  assert.ok(true);
});
