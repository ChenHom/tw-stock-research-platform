# 🗓 實作進度計畫 (Implementation Plan)

## 第一階段：核心框架與 Provider (已完成 ✅)
- [x] 資料 Provider 抽象層與 TWSE/FinMind 對接。
- [x] 特徵構建與規則引擎初步實作。
- [x] CLI 研究指令雛形。

## 第二階段：候選池與持久化 (已完成 ✅)
- [x] 全市場初篩服務 (ScreeningService)。
- [x] 候選池協調器 (CandidateResearchService)。
- [x] PostgreSQL 儲存層與 Migration 系統。
- [x] 歷史任務查詢功能。

## 第三階段：績效與優化閉環 (已完成 ✅)
- [x] 成效回填服務 (ResearchOutcomeService)。
- [x] 績效分析與報表 (PerformanceReportGenerator)。
- [x] 策略優化洞察引擎 (ResearchInsightsService)。
- [x] 修正 CLI 懸掛與 Provider 穩定性問題。

## 第四階段：產品化與進階優化 (進行中 🚀)
- [ ] 支援更多維度的優化建議（如自動調整參數）。
- [ ] 強化新聞情緒分析與事件加權。
- [ ] 開發 Web UI 視覺化報表（由 CLI 延伸）。
- [ ] 支援批次並行研究以提升效能（配合 Budget Guard）。

## 核心里程碑 (Milestones)
1. **MVP 1.0**: 實現單檔研究與報表。 (已達成)
2. **MVP 2.0**: 實現候選池掃描與資料持久化。 (已達成)
3. **Loop 1.0**: 完成研究-回填-分析-洞察閉環。 (已達成 ✅)
