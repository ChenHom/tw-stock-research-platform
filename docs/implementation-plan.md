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

## Phase 1 - Data Providers (Current)
- [ ] **TwseOpenApiProvider** (實作 fetch + 官方資料優先映射)
- [ ] **FinMindProvider** (實作 fetch + 支援歷史序列)
- [ ] RssNewsProvider
- [ ] Official backfill adapters (MOPS/TAIFEX)

## Phase 2 - Persistence & Storage
- [ ] PostgreSQL repositories (支援 versioning 讀寫)
- [ ] Redis cache adapter (支援 SourceMetadata 儲存)
- [ ] Data lineage logger (紀錄採用與衝突決策)

## Phase 3 - Feature Layer (Evidence Generation)
- [ ] Price features (RSI, MA, Alpha)
- [ ] Chip features (Institutions, Margin)
- [ ] Fundamental features (Revenue Accel, Margin Growth)
- [ ] Event features (Earnings, Calendar)

## Phase 4 - Research & Thesis
- [ ] Thesis Tracker 自動狀態評估 (Intact/Broken)
- [ ] Valuation Service (PER Band / Peer Group)
- [ ] Catalyst Calendar 標準化

## Phase 5 - Rule Implementation (Plugins)
- [ ] Risk Rules (Stop loss, Drawdown)
- [ ] Strategy Rules (Momentum, Value)
- [ ] Custom Override Rules
- [ ] Decision Synthesis Logic

## Phase 6 - Outputs & Reporting
- [ ] 中文化 Markdown 報告產出
- [ ] JSON decision packet for automation
- [ ] LINE / Mobile summary integration
