# TW Stock Research Platform (台股研究決策平台)

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)

這是一個以**數據驅動 (Data-Driven)**、**證據連結 (Evidence-Linked)** 為核心的台股研究平台。目標是建立一套嚴謹的自動化研究流程，從全市場篩選到深度特徵評估，並最終追蹤決策的真實成效。

## 核心理念

1.  **官方資料優先 (Official First)**：全市場快照優先採用 TWSE OpenAPI，確保資料權威性。
2.  **證據連結論點 (Evidence-Linked Thesis)**：所有的投資論點必須綁定當時的數據快照 (Snapshot)，確保研究「事後可回溯、可驗證」。
3.  **績效反饋閉環 (Performance Feedback Loop)**：自動回填 T+N 報酬率，透過真實勝率修正規則引擎與投資邏輯。
4.  **階層感知路由 (Tier-aware Routing)**：根據 API 配額自動切換抓取模式與資料源，極大化利用 FinMind 等第三方資源。

---

## 快速啟動

### 1. 環境準備
確保您的環境已安裝 Docker 與 Node.js。

```bash
# 複製環境變數範本並填入您的 FINMIND_API_TOKEN
cp .env.example .env

# 啟動基礎設施 (PostgreSQL 16 & Redis 7)
docker-compose up -d

# 安裝依賴並套用資料庫遷移
npm install
npm run db:up
```

### 2. 執行研究任務 (CLI)

系統提供完整的研究生命週期指令：

```bash
# A. 執行候選池篩選與批次研究 (初篩 -> 深挖 -> 產出 Markdown 報告)
npm run candidates -- 2024-04-03 10

# B. 對特定單一股票進行深度研究
npm run research -- 2330 2024-04-03

# C. 回填歷史研究任務的後續表現 (T+1, T+5, T+20 報酬率)
npm run outcomes latest

# D. 查詢研究任務的真實績效統計 (勝率、平均報酬)
npm run performance latest

# E. 查閱歷史研究紀錄清單
npm run run-history date 2024-04-03
```

---

## 系統架構

### 研究漏斗流程
1.  **Screening (篩選)**：利用 TWSE Bulk 資料進行量價、估值、營收動能初篩。
2.  **Research (研究)**：針對候選股抓取 30 日歷史、籌碼流向、詳細財報與新聞。
3.  **Features (特徵)**：三層特徵引擎（基本面趨勢、籌碼風險、交易位置）。
4.  **Decision (決策)**：外掛式規則引擎配合 Decision Composer 產出行動建議。
5.  **Outcome (追蹤)**：回填後續行情，產出績效分析報告。

### 目錄總覽
- `src/core/`：核心契約 (Contracts) 與標準型別。
- `src/modules/providers/`：TWSE 與 FinMind 資料擷取層。
- `src/modules/features/`：特徵工程與篩選服務。
- `src/modules/rules/`：註冊制的外掛規則引擎。
- `src/modules/storage/`：支援版本化與 Lineage 的 PostgreSQL 儲存層。
- `src/modules/cache/`：基於資料更新節奏的 Redis 熱快取。

---

## 技術棧
- **Runtime**: Node.js (ESM 模式)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Test**: Node.js Native Test Runner (ts-node/esm)

## 品質保證
專案具備嚴格的 Pre-commit Hook，每次提交前均會執行：
- `npm run lint`：型別與語法檢查。
- `npm test`：執行 23 項核心單元與整合測試。

---
*本專案為研究工具，不構成任何投資建議。*
