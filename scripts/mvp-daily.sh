#!/bin/bash

# MVP Daily Test Script
# 用途: 針對固定 5 檔股票跑完研究到洞察的完整鏈路

DATE=${1:-$(date +%Y-%m-%d)}
STOCKS="2330,3363,1560,6187,2002"

echo "==========================================="
echo "🚀 啟動 MVP 每日測試任務 | 日期: $DATE"
echo "🎯 測試樣本: $STOCKS"
echo "==========================================="

export STORAGE_TYPE=postgres

echo -e "\n[Step 1/5] 執行深度研究 (Candidates)..."
npm run candidates -- $DATE --stocks=$STOCKS

echo -e "\n[Step 2/5] 驗證歷史紀錄 (History)..."
npm run run-history latest

echo -e "\n[Step 3/5] 執行成效回填 (Outcomes)..."
npm run outcomes latest

echo -e "\n[Step 4/5] 產出績效報表 (Performance)..."
npm run performance latest

echo -e "\n[Step 5/5] 產出策略洞察 (Insights)..."
npm run insights latest

echo -e "\n✅ MVP 測試鏈路執行完畢。"
