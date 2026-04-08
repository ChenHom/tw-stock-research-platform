# 🧪 MVP 測試計畫 (Minimum Viable Product Test Plan)

本文件定義了台灣股票研究平台的 MVP 階段測試流程、固定測試集與預期檢查點，旨在驗證「研究 -> 執行 -> 回填 -> 績效 -> 洞察」閉環的完整性。

## 1. 測試環境準備
- **資料庫**: PostgreSQL (STORAGE_TYPE=postgres)
- **快取**: In-Memory (預設)
- **測試日期**: 2024-04-03 (清明節前夕，有明確的市場波動可驗證)
- **固定測試股**: 
  - `2330` (台積電): 權值股標竿
  - `2317` (鴻海): 組裝龍頭
  - `2454` (聯發科): 高價 IC 設計

## 2. 核心測試鏈路 (Happy Path)

### 步驟 A: 執行研究任務 (Candidates)
```bash
npm run candidates -- --tradeDate 2024-04-03 --topN 3
```
- **預期產出**: 
  - 成功篩選出符合條件的候選股。
  - 對前 3 檔進行深度研究並產出 Markdown 報表。
  - 資料成功寫入 `research_runs` 與 `candidate_research_results` 表。

### 步驟 B: 驗證歷史紀錄 (History)
```bash
npm run run-history latest
```
- **預期產出**: 
  - 準確顯示剛才執行任務的 `runId` 與摘要。
  - 顯示研究股票清單與初步決策動作。

### 步驟 C: 執行成效回填 (Outcomes)
```bash
npm run outcomes latest
```
- **預期產出**: 
  - 系統自動推算 2024-04-03 之後的 T+1, T+5 價格。
  - 計算報酬率並判斷決策方向是否正確。
  - 資料成功寫入 `research_outcomes` 表。

### 步驟 D: 產出績效分析報表 (Performance)
```bash
npm run performance latest
```
- **預期產出**: 
  - 產出 Markdown 績效報表。
  - 包含整體準確率、平均報酬。
  - 包含決策動作、規則 (Rules) 與 論點 (Thesis) 的 Breakdown 拆解。

### 步驟 E: 產出策略優化洞察 (Insights)
```bash
npm run insights latest
```
- **預期產出**: 
  - 產出 Markdown 優化建議報告。
  - 列出高效與低效規則排行榜。
  - 針對低勝率規則給出「降權/調整」建議。

## 3. 異常流程測試 (Negative Cases)
- **無符合候選股**: 傳入極端條件 (如 `minVolume=1000000`)，驗證系統不崩潰。
- **重複執行回填**: 對同一任務多次執行 `outcomes`，驗證資料冪等性 (Idempotency)。
- **資料缺失**: 模擬 Provider 回傳空資料，驗證系統是否有優雅降級提示。

## 4. 資料驗證檢查點 (SQL Checkpoints)
- [ ] `research_runs` 是否有 `completed` 狀態紀錄？
- [ ] `candidate_research_results` 是否包含 `rule_results` (JSONB) 判定細節？
- [ ] `research_outcomes` 的報酬率是否與市場實際價格相符？
