# 實作計畫 (Implementation Plan)

## Phase 0 - Scaffold & Core Contract (Completed)
- [x] 目錄結構與模組分層
- [x] 資料溯源介面 (SourceMetadata)
- [x] 外掛式規則引擎介面 (BaseRule / RuleRegistry)
- [x] 論點版本化與證據連結機制
- [x] 決策合成層 (Decision Composer)
- [x] PostgreSQL 版本化 Schema (Lineage/Snapshots)
- [x] 預算預估與成本模型 (Cost Model)
- [x] 核心單元測試 (tests/core-modules.test.ts)
- [x] 資料庫遷移管理系統 (MigrationManager)
- [x] 節奏驅動快取系統 (CacheStore / TTL Policy)

## Phase 1 - Data Providers (Completed)
- [x] **TwseOpenApiProvider** (實作 fetch + 快取接入)
- [x] **FinMindProvider** (實作 fetch + 快取接入 + Token 驗證)
- [ ] RssNewsProvider
- [ ] Official backfill adapters (MOPS/TAIFEX)

## Phase 2 - Persistence & Storage (Completed)
- [x] PostgreSQL repositories (支援 versioning 讀寫)
- [x] **Research Run 留痕** (StartedAt/CompletedAt/Results)
- [x] **ResearchRunQueryService** (歷史任務回溯查詢)
- [x] 資料庫遷移管理系統 (MigrationManager)
- [x] 儲存方案靈活切換 (In-Memory / Postgres)

## Phase 3 - Feature Layer (Evidence Generation)
- [x] **FeatureBuilder** 三層架構 (Fundamental, Chip, Technical)
- [x] **Alpha vs 0050** 真基準計算
- [x] **新聞事件加成** (具備時間衰減權重)

## Phase 4 - Research & Thesis
- [x] **Thesis Tracker** 自動狀態評估 (Intact/Broken)
- [x] **ScreeningService** 候選池動能篩選
- [ ] Valuation Service (PER Band / Peer Group)
- [ ] Catalyst Calendar 標準化

## Phase 5 - Rule Implementation (Plugins)
- [x] **RuleEngine** 分相執行與熔斷機制
- [x] 基礎風險規則 (Stop loss, Thesis broken)
- [ ] 策略規則 (Momentum, Value)

## Phase 6 - Outputs & Reporting
- [x] **CandidateResearchReportGenerator** Markdown 表格綜整
- [x] **CLI 工具** (run-research / run-candidates)
- [ ] JSON decision packet for automation
- [ ] LINE / Mobile summary integration
