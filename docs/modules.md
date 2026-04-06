# 模組責任

## `src/modules/router/DatasetRouter.ts`
### 責任
- 根據 `dataset + query intent + account tier` 決定 provider 與查詢模式
- 執行 fallback
- 回傳 `provider`, `queryMode`, `isFallback`, `confidence`

### 不負責
- 真正發 API
- 算指標
- 下交易動作

---

## `src/modules/budget/RateBudgetGuard.ts`
### 責任
- 追蹤 FinMind request budget
- 決定某 job 是否允許執行
- 當達到門檻時降級：只抓 watchlist、不跑全量補強

---

## `src/modules/providers/*`
### 責任
- 呼叫外部資料源
- 原始資料正規化到內部型別
- 提供 metadata：source, fetchedAt, dataset, costWeight

### 不負責
- 做估值
- 做 thesis
- 拼報告

---

## `src/modules/symbol/SymbolResolver.ts`
### 責任
- 使用 stock master + fuzzy dictionary 做代號解析
- 回傳信心值與候選清單

---

## `src/modules/features/FeatureBuilder.ts`
### 責任
- 聚合 market / chip / fundamental / event data
- 產出統一特徵集
- 保證缺失欄位顯性化

### 產出
- RSI
- bias
- volume ratio
- institutional score
- margin risk score
- revenue acceleration
- event score
- alpha vs 0050

---

## `src/modules/research/ThesisTracker.ts`
### 責任
- 建立 / 更新 thesis
- 保存支持證據與反證條件
- 回傳 thesis 狀態：`intact | weakened | broken`

---

## `src/modules/research/ValuationService.ts`
### 責任
- 儲存估值快照
- 計算 base / bull / bear 合理價值區間
- 管理估值方法與 peer group

---

## `src/modules/research/CatalystCalendar.ts`
### 責任
- 標準化公司事件、法說、月營收、財報、股利等時點
- 產生 upcoming event list 與 event risk score

---

## `src/modules/rules/RuleEngine.ts`
### 責任
- 依序執行風控規則、策略規則、個股覆寫規則
- 合併結果成單一 `RuleDecision`

### 規則優先序
1. Risk rules
2. Strategy rules
3. Custom overrides

---

## `src/modules/reporting/ReportGenerator.ts`
### 責任
- 輸出：
  - Screen report
  - Position report
  - Thesis update report
  - JSON decision packet
