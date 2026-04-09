#!/bin/bash

# MVP Daily Test Script
# 用途: 針對固定 5 檔股票跑完研究到洞察的完整鏈路

DATE=${1:-$(date +%Y-%m-%d)}
STOCKS="2330,3363,1560,6187,2002"

echo "==========================================="
echo "🚀 啟動 MVP 每日測試任務 | 日期: $DATE"
echo "🎯 測試樣本: $STOCKS"
echo "==========================================="

export STORAGE_TYPE=${STORAGE_TYPE:-postgres}

echo -e "\n[Step 1/5] 執行深度研究 (Candidates)..."
npm run candidates -- $DATE --stocks=$STOCKS

echo -e "\n[Step 2/5] 驗證歷史紀錄 (History)..."
npm run run-history latest

echo -e "\n[Step 3/5] 執行成效回填 (Outcomes)..."
npm run outcomes latest

echo -e "\n[Step 4/5] 產出績效報表 (Performance)..."
PERF_OUTPUT=$(npm run performance latest)
echo "$PERF_OUTPUT"

# --- 驗收斷言 (Assertions) ---
echo -e "\n[Step 4.1/5] 執行 Smoke Test 驗收..."

# 提取指標
TOTAL_COUNT=$(echo "$PERF_OUTPUT" | grep "總研究個股數:" | sed 's/[^0-9]//g')
EVAL_COUNT=$(echo "$PERF_OUTPUT" | grep "可評估方向樣本數:" | sed 's/.*樣本數: \([0-9]*\).*/\1/')
RET_COUNT=$(echo "$PERF_OUTPUT" | grep "5D 報酬可計算筆數:" | sed 's/.*筆數: \([0-9]*\).*/\1/')

echo "📊 驗收指標: 總數=$TOTAL_COUNT, 可評估方向=$EVAL_COUNT, 5D報酬=$RET_COUNT"

# 1. 總數需為 5
if [ "$TOTAL_COUNT" -ne 5 ]; then
  echo "❌ 失敗: 總研究筆數預期 5，實際為 $TOTAL_COUNT"
  exit 1
fi

# 2. 可評估方向需 >= 4 (考慮到 2330 可能是 WATCH 或資料缺失)
if [ "$EVAL_COUNT" -lt 4 ]; then
  echo "❌ 失敗: 可評估方向樣本數預期 >= 4，實際為 $EVAL_COUNT"
  exit 1
fi

# 3. 5D 報酬可計算需 >= 4 (核心檢驗: 確保有回填到資料)
if [ "$RET_COUNT" -lt 4 ]; then
  echo "❌ 失敗: 5D 報酬覆蓋筆數預期 >= 4，實際為 $RET_COUNT (這表示回填機制失效或無後續行情資料)"
  exit 1
fi

echo "✅ Smoke Test 驗收通過。"

echo -e "\n[Step 5/5] 產出策略洞察 (Insights)..."
npm run insights latest

echo -e "\n✅ MVP 測試鏈路執行完畢。"
