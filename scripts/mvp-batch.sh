#!/bin/bash

# MVP Batch Backtest Script
# 用途: 針對日期區間跑完所有研究，最後產出聚合績效與洞察

START_DATE=$1
END_DATE=$2
STOCKS=${3:-"2330,3363,1560,6187,2002"}

if [ -z "$START_DATE" ] || [ -z "$END_DATE" ]; then
  echo "使用方式: ./scripts/mvp-batch.sh <開始日期> <結束日期> [股票清單]"
  echo "範例: ./scripts/mvp-batch.sh 2024-04-01 2024-04-05"
  exit 1
fi

echo "==========================================="
echo "🚀 啟動 MVP 批次回測任務"
echo "📅 區間: $START_DATE ~ $END_DATE"
echo "🎯 樣本: $STOCKS"
echo "==========================================="

export STORAGE_TYPE=${STORAGE_TYPE:-postgres}

# 迭代日期 (Linux date 格式)
current_date="$START_DATE"
while [ "$current_date" != "$(date -I -d "$END_DATE + 1 day")" ]; do
  echo -e "\n--- 處理日期: $current_date ---"
  
  echo "[Step 1] 執行深度研究 (Candidates)..."
  npm run candidates -- "$current_date" --stocks="$STOCKS"
  
  echo "[Step 2] 執行成效回填 (Outcomes)..."
  npm run outcomes latest
  
  current_date=$(date -I -d "$current_date + 1 day")
done

echo -e "\n==========================================="
echo "📊 產出聚合分析報表"
echo "==========================================="

echo -e "\n[Step 3] 產出聚合績效報表 (Performance Range)..."
npm run performance range "$START_DATE" "$END_DATE"

echo -e "\n[Step 4] 產出聚合策略洞察 (Insights Range)..."
npm run insights range "$START_DATE" "$END_DATE"

echo -e "\n✅ MVP 批次回測執行完畢。"
