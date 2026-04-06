# 模組責任 (Module Responsibilities)

## `src/modules/router/DatasetRouter.ts`
### 責任
- 根據 `dataset + query intent + account tier` 決定 provider 與查詢模式。
- **成本控管**：在分發前計算點數消耗 (Cost Model)，實施降級或轉向官方免費來源。
- **決策日誌**：產出 `SourceMetadata` 用於追蹤資料採用邏輯。

---

## `src/modules/budget/RateBudgetGuard.ts`
### 責任
- 追蹤各 Provider 的即時 API 配額。
- 提供中文 Log 預警：當達到門檻時提醒進入「降級模式」或「強制中止」。

---

## `src/modules/features/FeatureBuilder.ts`
### 責任
- 聚合 Market / Chip / Fundamental / Event 等原始資料。
- **凍結快照**：產出 `FeatureSnapshot` 並寫入 DB，作為後續研究論點的「證據來源」。

---

## `src/modules/research/ThesisTracker.ts`
### 責任
- **論點版本化**：分離 `createThesis` (建立 Head) 與 `appendVersion` (版本推進)，維持 `thesisId` 的持續性。
- **證據連結 (Evidence Linking)**：將 論點 與具體的 `FeatureSnapshot` 或事件 ID 進行關聯。
- **自動狀態追蹤**：具備自動狀態評估邏輯與五層狀態模型 (`draft` / `active` / `weakened` / `broken` / `archived`)。

---

## `src/modules/rules/RuleEngine.ts`
### 責任
- **註冊制 (Registry)**：管理所有實作 `BaseRule` 介面的外掛規則。
- **依序執行**：按優先權 (Priority) 執行規則並回傳 `RuleResult` 陣列。

---

## `src/modules/research/DecisionComposer.ts`
### 責任 (拍板層)
- **多維彙整**：接收 Rule Results、Thesis Status 與 Valuation Gap。
- **最終決策**：產出 `FinalDecision`，包含明確動作 (BUY/SELL等)、信心度與中文摘要理由。
- **可解釋性**：列出支持性規則與阻斷性規則。

## `src/modules/storage/MigrationManager.ts`
### 責任
- **版本化遷移**：管理 `database/migrations` 下的 SQL 檔案執行。
- **狀態管理**：追蹤已套用的遷移版本，支援 Batch 批次管理。
- **開發工具**：提供 `up` (更新)、`rollback` (回滾)、`clear` (清空) 與 `reset` (重置) 功能。

---

## `src/modules/reporting/ReportGenerator.ts`
### 責任
- 輸出中文化報告：
  - 持股/追蹤報告 (Markdown)
  - 論點變動報告
  - 預算/點數警告摘要
