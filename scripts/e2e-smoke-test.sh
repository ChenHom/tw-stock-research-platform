#!/bin/bash

# E2E Smoke Test Script
# 用途: 全自動化驗證 PostgreSQL / Redis 環境下的研究閉環，並包含資料層斷言。

set -e # 若有指令失敗即中斷

echo "==========================================="
echo "🧪 啟動 E2E Smoke Test 自動化驗收"
echo "==========================================="

export STORAGE_TYPE=${STORAGE_TYPE:-postgres}
export CACHE_TYPE=${CACHE_TYPE:-redis}

# 確認依賴服務可用 (這部分交由 Node.js 執行期處理連線池，此處僅呼叫 TypeScript 腳本)
node --test --import tsx tests/e2e-smoke.ts

echo -e "\n✅ E2E Smoke Test 圓滿成功，MVP 閉環與資料品質達標！"
