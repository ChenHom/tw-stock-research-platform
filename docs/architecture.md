# 架構總覽

## 1. 設計原則

### 1.1 官方資料優先
- 全市場掃描：TWSE OpenAPI / 官方 bulk
- 候選股補強：FinMind
- 新聞：只做線索，不當真值來源

### 1.2 Tier-aware
FinMind 資料集可用性受會員等級與 request limit 影響。
系統不得預設所有資料集都能一次拉全市場。

### 1.3 先資料，後推理
LLM / 規則引擎只處理「結構化結果」，不直接去抓網頁。

### 1.4 可回溯
每次 thesis 變動、規則觸發、資料 fallback、cache stale 皆需有紀錄。

---

## 2. 資料流

```text
TWSE OpenAPI / 官方資料
        │
        ▼
Universe Builder
        │
        ▼
Candidate Pool (20 ~ 100 檔)
        │
        ▼
FinMind Enrichment
        │
        ▼
Feature Builder
        │
        ├── Thesis Tracker
        ├── Valuation Snapshot
        ├── Catalyst Calendar
        └── Rule Engine
                │
                ▼
       Report / JSON / LINE Summary
```

---

## 3. 模組分層

### Providers
負責：
- 對外 API 呼叫
- 原始欄位正規化
- 不做研究推理

### Router
負責：
- 根據 dataset、會員等級、成本、fallback 規則決定走哪個 provider

### Feature Builder
負責：
- 把價量、月營收、財報、法人、融資融券、衍生性商品資料轉成研究可用特徵

### Research
負責：
- thesis
- valuation snapshot
- catalyst tracking

### Rules
負責：
- 風控
- 策略
- 特例覆寫
- 動作決策

### Reporting
負責：
- Markdown / JSON / bot message 輸出

### Storage
負責：
- DB persistence
- query abstraction
