# 🏛 系統架構說明 (Architecture)

本平台採用分層架構，旨在建立一個自動化的「研究 -> 執行 -> 績效回填 -> 策略優化」的完整數據閉環。

## 1. 核心分層

### A. 資料獲取層 (Data Providers)
- **TWSE Provider**: 負責全市場的最新量價、估值（PE/PB/Yield）Bulk 資料抓取。
- **FinMind Provider**: 負責深度的歷史資料、營收、法人籌碼、財報及新聞。支援 Free/Backer/Sponsor 不同等級的調度。

### B. 特徵與篩選層 (Feature & Screening)
- **ScreeningService**: 產品第一層門檻。利用 TWSE Bulk 資料快速篩選出具備潛力的 Candidate Pool。
- **FeatureBuilder**: 對單一股票構建多維度特徵（基本面、技術面、籌碼面、Alpha、事件評分）。

### C. 決策與規則層 (Decision & Rules)
- **RuleEngine**: 執行過濾 (Filter)、風險 (Risk) 與 策略 (Strategy) 規則。
- **ThesisTracker**: 追蹤研究論點的生命週期與版本。
- **DecisionComposer**: 整合規則結果與論點狀態，產出最終的決策動作（BUY/SELL/WATCH）與置信度。

### D. 協調與流程層 (Orchestration)
- **CandidateResearchService**: 串接「初篩」與「深度研究」。實現從全市場掃描到 Top N 個股深度剖析的流程。
- **ResearchPipelineService**: 單檔研究的核心流水線。

### E. 績效與洞察層 (Performance & Insights) - *新增*
- **ResearchOutcomeService**: 負責推算交易日後的行情，計算 T+1, T+5 報酬。
- **ResearchPerformanceService**: 提供多維度的績效拆解（按動作、規則、論點狀態）。
- **ResearchInsightsService**: **策略大腦**。自動分析績效數據，識別低效規則並產出具體的「優化建議（降權/調整）」。

## 2. 數據閉環流程 (The Data Loop)
1. **研究 (Research)**: 篩選候選股並產出決策，記錄於 `research_runs` 與 `candidate_research_results`。
2. **回填 (Outcome)**: 經過 N 日後，抓取實際行情回填至 `research_outcomes`。
3. **分析 (Performance)**: 統計勝率與報酬，產出績效報表。
4. **進化 (Insights)**: 洞察引擎根據回填數據，對策略邏輯提出反饋，指導下一輪規則調整。

## 3. 持久化與基礎設施
- **PostgreSQL**: 儲存研究留痕、成效與洞察結果。
- **Redis**: 提供跨 Provider 的資料快取，優化 API 使用額度。
- **RateBudgetGuard**: 監控並保護 API 配額，自動切換降級模式。
