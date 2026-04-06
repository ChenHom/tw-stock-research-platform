# tw-stock-research-platform

台股研究平台 scaffold。

目標不是做另一個只會吐「買 / 賣」的聊天機器人，而是把研究流程拆成可維護的模組：

1. 官方 bulk 資料先建立全市場候選池
2. FinMind 依會員等級逐檔補強
3. 統一特徵計算
4. thesis / catalyst / valuation / risk rule 分層判斷
5. 產出可追蹤的研究報告與交易動作

## 當前狀態

- 已建立可落地目錄結構
- 已定義 provider interface / rule interface
- 已提供 PostgreSQL schema
- 已提供 dataset capability registry
- 已提供模組責任文件
- 尚未接上真實 API token / scheduler / worker runtime

## 建議技術棧

- Runtime: Node.js 20+
- Language: TypeScript
- Package manager: pnpm
- DB: PostgreSQL
- Cache: Redis / Upstash Redis
- Queue / Scheduler: 可先用 cron + app command，之後再接 BullMQ / Temporal

## 為何選 TypeScript

- 可直接吸收 `line-stock-bot` 既有的 provider fallback、cache envelope、symbol resolver、schema validation 思路
- `AI-Trading-Copilot` 的規則引擎與報告流程可平移到 TypeScript
- 對 API / ETL / webhook / bot / dashboard 都比較一致

## 目錄總覽

```text
docs/                       架構文件、模組責任、實作計畫
database/                   PostgreSQL schema
src/core/contracts/         provider / rule / repository 介面
src/core/types/             共享型別
src/config/                 dataset registry / app config
src/modules/router/         tier-aware dataset router
src/modules/cache/          cache envelope / key policy
src/modules/budget/         FinMind 額度守門
src/modules/providers/      TWSE / FinMind / RSS provider
src/modules/symbol/         股票代號解析
src/modules/features/       技術面 / 籌碼面 / 基本面 / 事件特徵
src/modules/rules/          風控 / 策略 / 覆寫規則 / rule engine
src/modules/research/       thesis / valuation / catalyst tracker
src/modules/reporting/      Markdown / JSON / message output
src/modules/events/         事件標準化
src/modules/storage/        repositories / persistence adapter
src/modules/positions/      持股狀態與 stop / trailing state
src/app/                    app composition / commands
tests/                      測試
```

## GitHub 建 repo

目前我無法直接呼叫 GitHub 建立新的 repository，因為現有 GitHub 工具只支援讀取 / 建檔 / 分支 / commit / PR，不支援 `create repository`。

你可以用下列流程建立空 repo 後推上去：

```bash
mkdir tw-stock-research-platform
cd tw-stock-research-platform
# 將本 scaffold 複製進來
git init
git add .
git commit -m "feat: initial scaffold for tw stock research platform"
gh repo create tw-stock-research-platform --private --source=. --remote=origin --push
```

沒有 `gh` 的話：

```bash
git init
git add .
git commit -m "feat: initial scaffold for tw stock research platform"
git branch -M main
git remote add origin git@github.com:<YOUR_ACCOUNT>/tw-stock-research-platform.git
git push -u origin main
```

## 下一步

1. 實作 `TwseOpenApiProvider`
2. 實作 `FinMindProvider`
3. 補上 `DatasetRouter` 的 tier-aware fallback
4. 實作 `FeatureBuilder`
5. 實作 `RuleEngine`
6. 接 PostgreSQL 與 Redis
7. 加入 daily / monthly / quarterly jobs
