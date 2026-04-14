# TW Stock Research Platform（台股研究決策平台）

以公開資訊為核心的台股研究平台。  
目標不是喊單，而是把台股研究流程拆成可追蹤、可驗證、可回顧的完整閉環：

1. 先篩出值得看的股票
2. 評估基本面、營收、籌碼、交易位置、新聞事件
3. 輸出 `WATCH / BUY / ADD / HOLD / TRIM / SELL / EXIT / BLOCK`
4. 回填後續表現，檢查規則、論點與決策是否真的有效

---

## 目前已完成的主流程

系統目前已具備這條完整鏈：

1. **候選池篩選**：`run-candidates`
2. **單檔研究**：`run-research`
3. **單檔區間研究**：`run-research-range`
4. **研究留痕與歷史查詢**：`run-history`
5. **成效回填**：`run-outcomes`
6. **績效分析**：`run-performance`
7. **優化洞察**：`run-insights`

這代表目前已可做 **MVP 流程測試**。

---

## 核心原則

### 1. 先資料，後結論
先抓結構化資料，再做特徵、規則、決策。  
不先看新聞標題再補理由。

### 2. 官方優先
- **TWSE**：全市場最新快照、估值底座
- **FinMind**：單檔歷史、月營收、財報、法人、融資融券、新聞
- **新聞**：只做事件加成，不作主判斷

### 3. 條件決策，不猜日期
進出場不是喊某一天，而是看條件是否成立。

### 4. 研究可回溯
研究結果、任務歷史、後續報酬、規則成效、論點狀態都可追蹤。

---

## 資料分工

### TWSE
用途：
- 全市場
- 官方最新資料
- 當日 market snapshot
- 當日估值底座

對應 dataset：
- `market_daily_latest`
- `daily_valuation`

### FinMind
用途：
- 單檔歷史價量
- 月營收
- 財報
- 法人買賣
- 融資融券
- 新聞

對應 dataset：
- `market_daily_history`
- `month_revenue`
- `financial_statements`
- `institutional_flow`
- `margin_short`
- `stock_news`

---

## 系統流程

### 1. Screening
先從全市場初篩 candidate pool。

### 2. Research
對候選股做單檔深挖，抓歷史、籌碼、財報、營收、新聞。

### 3. Features
把原始資料轉成研究特徵：
- 基本面：`epsTtm`、`roe`、`grossMarginGrowth`、`operatingMarginGrowth`
- 營收動能：`revenueYoy`、`revenueAcceleration`
- 籌碼風險：`institutionalNet`、`marginChange`、`marginRiskScore`
- 交易位置：`ma20`、`bias20`、`volumeRatio20`、`alphaVs0050`
- 事件加成：`eventScore`

### 4. Decision
規則引擎 + thesis + decision composer 輸出最終動作。

### 5. Outcome
回填 T+1 / T+5 / T+20 表現。

### 6. Performance
統計：
- 整體勝率
- 平均報酬
- action breakdown
- rule breakdown
- thesis breakdown

### 7. Insights
根據績效資料產出優化建議：
- 哪些 rule 應保留
- 哪些 rule 應降權
- 哪種 thesis 狀態易失效
- 哪種 action 表現差

---

## 專案結構

```text
src/
├─ app/
│  ├─ commands/          # CLI 入口
│  ├─ services/          # 研究、查詢、成效、洞察服務
│  └─ bootstrap.ts       # 組裝入口
├─ core/
│  ├─ contracts/         # repository / storage / provider 契約
│  ├─ types/             # 核心型別
│  └─ utils/             # 日期與共用工具
├─ modules/
│  ├─ budget/            # 配額與預算控制
│  ├─ cache/             # In-memory / Redis cache
│  ├─ features/          # FeatureBuilder
│  ├─ providers/         # TWSE / FinMind provider
│  ├─ reporting/         # Markdown / JSON / 分析報表
│  ├─ research/          # Thesis / DecisionComposer
│  ├─ router/            # Dataset Router
│  ├─ rules/             # RuleEngine 與規則
│  └─ storage/           # In-memory / PostgreSQL repository
tests/                   # 單元與整合測試
database/migrations/     # SQL migration
```

---

## 環境與執行模式

### 快取層
可用環境變數切換：
- `CACHE_TYPE=redis`
- `CACHE_TYPE=in-memory`

預設為：
- `redis` (需準備對應服務，若無 Redis 請手動設定為 `in-memory`)

### 儲存層
可用環境變數切換：
- `STORAGE_TYPE=postgres`
- `STORAGE_TYPE=in-memory`

預設為：
- `in-memory`

---

## 安裝與啟動

### 1. 安裝依賴
```bash
npm install
```

### 2. 型別與測試
```bash
npm run validate
```

### 3. 資料庫維運指令 (PostgreSQL 模式)
初始化與套用 migration：
```bash
npm run db:up
```

清空所有研究數據 (保留表格結構)：
```bash
npm run db:clear
```

完全重置資料庫 (刪除所有表並重新建置)：
```bash
npm run db:reset
```

---

## CLI 指令

### 單檔研究
```bash
npm run research -- 2330 2024-04-03
```

### 單檔區間研究
```bash
npm run research:range -- 6761 2024-04-03 2024-04-13
```
區間研究現在有正式 CLI 入口，不需要再用臨時 `tsx` / shell 迴圈直接呼叫內部 service。  
預設只輸出**交易日**；若要保留週末/休市日，請加上 `--calendar-days`。

歷史日期研究會優先使用**point-in-time 歷史資料**：
- 價格快照：由 `market_daily_history` 的當日資料還原
- 歷史估值：優先使用可按日期查詢的 FinMind 資料

這可避免把 TWSE 的「最新快照」誤標成過去日期。

### 候選池研究
預設抓今天、Top 5。也可指定日期與數量。
```bash
npm run candidates
npm run candidates -- 2024-04-03 10
npm run candidates -- --mock
```

### 查詢歷史研究任務
```bash
npm run run-history latest
npm run run-history date 2024-04-03
npm run run-history detail <runId>
```

### 回填後續成效
```bash
npm run outcomes latest
npm run outcomes <runId>
```

### 產出績效分析
```bash
npm run performance latest
npm run performance <runId>
npm run performance range <start-date> <end-date>  # 批次聚合分析
npm run performance runs <runId1,runId2,...>       # 用明確 runId 隔離批次分析
```

### 產出優化洞察
```bash
npm run insights latest
npm run insights <runId>
npm run insights range <start-date> <end-date>     # 批次聚合分析
npm run insights runs <runId1,runId2,...>          # 用明確 runId 隔離批次分析
```

---

## 自動化與 MVP 測試

專案已具備端到端 (E2E) 的測試能力，可用來驗證功能、儲存與績效分析。

### 執行單一 Smoke Test (自動化驗收)
會自動清空資料庫並連貫執行全鏈路，且包含資料層斷言 (Data-layer assertions)：
```bash
./scripts/e2e-smoke-test.sh
```
外層 shell script 只保留為便利入口；真正的驗證邏輯在 `tests/e2e-smoke.ts` 內直接呼叫專案 service。

### 執行每日例行 MVP 測試
```bash
./scripts/mvp-daily.sh <YYYY-MM-DD>
```

### 執行多日批次回測與聚合分析
針對指定區間自動執行每日研究與回填，並產出聚合後的績效與洞察報告，以累積評估樣本數。
```bash
npm run test:batch 2024-04-01 2024-04-10
```
批次指令現在會以**當次 runId 清單**產出聚合報表，避免同日期的舊任務混入分析結果。
而且批次驗證流程已改為**直接呼叫專案 service / report generator**，不再透過 `child_process` 轉呼叫其他 CLI。

建議把批次驗證分成三種口徑解讀：

| 期間 | 定位 | 可做判讀 | 不該做的事 |
| --- | --- | --- | --- |
| 1-2 日 | Smoke | 驗流程、驗閉環、驗資料回填 | 不要根據結果調規則 |
| 3-5 日 | Stability | 驗連續執行穩定性、驗 action 語意 | 不要把 insights 當長期證據 |
| 6-10 日 | Observation | 初步比較 BUY/WATCH/BLOCK 或 thesis 的 Alpha 表現 | 不要直接砍規則或大幅調參 |

只有在樣本持續累積、且規則或 thesis 的可評估樣本數開始達到顯著門檻後，才適合討論升降權。

### 持續整合 (CI)
專案已接入 GitHub Actions，在每次 Push / Pull Request 時會自動建立 PostgreSQL 與 Redis 服務容器，並執行 `npm run test:e2e` 與 `npm run test:batch` 以確保端到端閉環與資料斷言的正確性。

### 測試時要確認
- 候選股能正常產出
- 單檔研究能正常輸出決策 (帶有具體的未達標條件說明)
- run 歷史能查回
- outcome 能自動偏移節假日並回填真實價格
- performance 能統計正確的分母與報酬率
- insights 能根據樣本數給出信賴度與建議
- 沒資料時 CLI 會顯示 N/A 而不會炸掉
- 關鍵資料不足時，系統會降為 `WATCH`，避免把缺資料誤判成可交易訊號

---

## 技術棧

- **Runtime**：Node.js（ESM）
- **Language**：TypeScript
- **Database**：PostgreSQL
- **Cache**：Redis / In-memory
- **Test**：Node.js Native Test Runner + tsx

---

## 目前定位

這個專案目前不是單純研究原型，已經進階到：

**具備單日 smoke 與多日批次驗收、支援區間批次聚合績效分析的研究閉環 MVP**

也就是可以開始做：
- MVP 流程測試
- 端到端 smoke test
- in-memory / PostgreSQL 路徑驗證

---

## 注意事項

- 本專案是研究工具，不構成任何投資建議。
- 新聞僅作事件加成，不應取代基本面與籌碼資料。
- 若要走 PostgreSQL / Redis，需先準備對應服務與連線設定。
