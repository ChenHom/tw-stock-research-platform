# 📦 模組定義 (Modules)

## 1. 核心應用服務 (src/app/services)
- **CandidateResearchService**: 候選池研究協調器。
- **ResearchPipelineService**: 單檔研究核心流水線。
- **ResearchOutcomeService**: 成效回填服務。
- **ResearchPerformanceService**: 績效統計分析。
- **ResearchInsightsService**: 策略優化洞察引擎。
- **ResearchRunQueryService**: 歷史任務查詢服務。
- **ScreeningService**: 全市場初步篩選服務。

## 2. 報表生成器 (src/modules/reporting)
- **ReportGenerator**: 個股研究報表 (Markdown)。
- **CandidateResearchReportGenerator**: 候選池摘要報表 (Markdown/JSON)。
- **PerformanceReportGenerator**: 任務績效報表 (Markdown)。
- **InsightsReportGenerator**: 策略優化建議報表 (Markdown)。

## 3. CLI 指令入口 (src/app/commands)
- **npm run research**: 執行單檔研究。
- **npm run candidates**: 執行候選池研究 (初篩 + 深度)。
- **npm run run-history**: 檢視歷史任務紀錄。
- **npm run outcomes**: 執行成效回填任務。
- **npm run performance**: 查看任務績效報表。
- **npm run insights**: 查看策略優化建議。

## 4. 資料與儲存 (src/modules/storage)
- **PostgresRepositories**: PostgreSQL 持久化實作。
- **InMemoryRepositories**: 測試與 MVP 用的記憶體儲存實作。
- **MigrationManager**: 資料庫遷移管理。
- **SqlContext**: 統一的資料庫連線池。

## 5. 基礎設施 (src/modules/)
- **Budget**: 預算守衛 (RateBudgetGuard)。
- **Cache**: Redis 快取機制。
- **Providers**: TWSE, FinMind 資料對接。
- **Rules**: 規則引擎與規則集。
