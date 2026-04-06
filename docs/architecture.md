# 架構總覽 (Architecture Overview)

## 1. 設計原則

### 1.1 官方資料優先 (Official First)
- 全市場掃描：優先採用 TWSE OpenAPI / 官方 Bulk 資料。
- 候選股補強：當官方資料缺失時，自動 fallback 至 FinMind。
- 新聞與線索：僅作為輔助，不作為絕對真值來源。

### 1.2 溯源與版本化 (Provenance & Versioning)
- **資料溯源 (Lineage)**：每一筆資料皆附帶 `SourceMetadata`，記錄原始來源、採用路徑及置信度。
- **證據連結 (Evidence-linked)**：所有的投資論點 (Thesis) 必須與具體的特徵快照 (Feature Snapshot) 或事件連結，確保研究「事後可回溯」。
- **凍結狀態**：研究當時看到的數據會被「凍結」在 Snapshot 中，避免資料更新導致論點失效卻無從查證。

### 1.3 預算感知路由 (Budget-aware Routing)
- 系統自動預估 API 消耗成本 (Cost Model)，並根據帳戶等級實施自動降級或轉向官方免費來源。

### 1.4 決策可解釋性 (Explainable Decisions)
- 規則引擎採「外掛式設計」，決策合成層 (Decision Composer) 負責彙整規則結果、論點狀態與估值，產出具備摘要理由的決策建議。

---

## 2. 資料流 (Data Flow)

```text
[資料來源層] TWSE / FinMind / MOPS / RSS
        │
        ▼
[資料路由層] DatasetRouter (成本預估 + Provider 選擇)
        │
        ▼
[資料處理層] FeatureBuilder (特徵工程) ───► [快照層] Feature Snapshots (凍結數據)
        │                                     │
        ▼                                     ▼
[研究層] ThesisTracker (證據連結) ◄───────────┘
        │
        ▼
[決策層] RuleEngine (執行外掛規則) ───► DecisionComposer (最終拍板)
                                              │
                                              ▼
                                     [輸出層] Markdown / LINE 報告
```

---

## 3. 模組分層 (Layers)

- **Providers**: 對外 API 呼叫、原始欄位正規化、提供溯源 Meta。
- **Router**: 根據預算、等級與 fallback 規則決定資料路徑。
- **Features**: 聚合多源資料產出統一特徵，並產出凍結快照。
- **Research**: 管理 Thesis 版本與證據鏈，計算估值區間。
- **Rules**: 註冊制的外掛規則，涵蓋風險、策略與個股覆寫。
- **Reporting**: 產出具備可解釋性的中文化研究報告。
- **Storage**: 支援版本化與決策日誌的資料持久化。
