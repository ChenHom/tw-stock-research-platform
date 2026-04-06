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

## Phase 2 - Persistence & Storage (In Progress)
- [ ] PostgreSQL repositories (支援 versioning 讀寫)
- [ ] Redis cache adapter (替代 MemoryCache)
- [ ] Data lineage logger (紀錄採用與衝突決策)

## Phase 3 - Feature Layer (Evidence Generation)
- [x] **FeatureBuilder** (實作基礎計分與均線計算)
- [ ] Price features (RSI, Alpha)
- [ ] Chip features (Institutions, Margin)
- [ ] Fundamental features (Revenue Accel, Margin Growth)

## Phase 4 - Research & Thesis
- [x] **Thesis Tracker** 自動狀態評估 (Intact/Broken)
- [ ] Valuation Service (PER Band / Peer Group)
- [ ] Catalyst Calendar 標準化

## Phase 5 - Rule Implementation (Plugins)
- [x] **RuleEngine** 分相執行與熔斷機制
- [x] 基礎風險規則 (Stop loss, Thesis broken)
- [ ] 策略規則 (Momentum, Value)

## Phase 6 - Outputs & Reporting
- [x] **ReportGenerator** 中文化 Markdown 報告
- [ ] JSON decision packet for automation
- [ ] LINE / Mobile summary integration
