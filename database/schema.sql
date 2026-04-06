-- PostgreSQL schema for tw-stock-research-platform
-- Optimized for: Provenance, Versioning, Evidence-linked Research, and Plugin-based Rules

-- ---------------------------------------------------------
-- 1. System & Provider Management
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS account_capability (
    provider_name            VARCHAR(50) NOT NULL,
    account_tier             VARCHAR(50) NOT NULL, -- free / backer / sponsor
    api_request_limit        INTEGER,
    current_usage            INTEGER DEFAULT 0,
    supports_bulk            BOOLEAN NOT NULL DEFAULT FALSE,
    supports_realtime        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (provider_name, account_tier)
);

-- 追蹤資料採用的決策過程 (Data Lineage)
CREATE TABLE IF NOT EXISTS data_lineage_decisions (
    id                       BIGSERIAL PRIMARY KEY,
    entity_type              TEXT NOT NULL, -- e.g., 'market_daily', 'financials'
    entity_key               TEXT NOT NULL, -- e.g., '2330:2026-04-06'
    field_name               TEXT NOT NULL, -- e.g., 'close_price'
    selected_provider        TEXT NOT NULL,
    rejected_providers       JSONB,         -- 記錄被捨棄的資料來源與其數值
    decision_reason          TEXT,          -- e.g., 'official_priority', 'outlier_detected'
    decided_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. Core Market Data (Raw-ish)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS stock_master (
    stock_id                 VARCHAR(10) PRIMARY KEY,
    stock_name               VARCHAR(100) NOT NULL,
    board                    VARCHAR(10) NOT NULL, -- TW / TWO / ESB
    industry_category        VARCHAR(100),
    market                   VARCHAR(20) DEFAULT 'TW',
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    aliases                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    open_price               NUMERIC(14,4),
    high_price               NUMERIC(14,4),
    low_price                NUMERIC(14,4),
    close_price              NUMERIC(14,4),
    volume                   BIGINT,
    turnover                 BIGINT,
    transaction_count        BIGINT,
    source_system            VARCHAR(50) NOT NULL,
    source_meta              JSONB, -- 儲存 SourceMetadata 內容
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS valuation_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    pe_ratio                 NUMERIC(14,4),
    pb_ratio                 NUMERIC(14,4),
    dividend_yield           NUMERIC(14,4),
    market_cap               NUMERIC(20,2),
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS month_revenue (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    revenue_month            DATE NOT NULL,
    monthly_revenue          NUMERIC(20,2) NOT NULL,
    revenue_yoy              NUMERIC(14,4),
    revenue_mom              NUMERIC(14,4),
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, revenue_month)
);

-- ---------------------------------------------------------
-- 3. Research Features & Snapshots (The "Frozen" State)
-- ---------------------------------------------------------

-- 凍結特徵快照：記錄當時研究看到的特徵集
CREATE TABLE IF NOT EXISTS feature_snapshots (
    id                       BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    snapshot_at              TIMESTAMPTZ NOT NULL,
    feature_set_version      TEXT NOT NULL,
    payload                  JSONB NOT NULL, -- 完整的特徵鍵值對
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 估值快照版本化
CREATE TABLE IF NOT EXISTS valuation_snapshots (
    id                       BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    as_of_date               DATE NOT NULL,
    method                   TEXT NOT NULL, -- e.g., 'PER_BAND', 'DCF', 'PEER_COMP'
    fair_value_base          NUMERIC(12,4),
    fair_value_bull          NUMERIC(12,4),
    fair_value_bear          NUMERIC(12,4),
    assumptions              JSONB, -- 關鍵假設 (e.g., WACC, Growth Rate)
    source_refs              JSONB, -- 關連的證據 ID (e.g., feature_snapshot_id)
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 4. Thesis & Evidence Linking
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS thesis_heads (
    thesis_id                UUID PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS thesis_versions (
    id                       BIGSERIAL PRIMARY KEY,
    thesis_id                UUID NOT NULL REFERENCES thesis_heads(thesis_id),
    version                  INT NOT NULL,
    status                   TEXT NOT NULL, -- intact / weakened / broken / archived
    statement                TEXT NOT NULL,
    direction                TEXT NOT NULL, -- long / short / neutral
    conviction_score         NUMERIC(5,2),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (thesis_id, version)
);

-- 證據連結表：將 Thesis 與具體證據 (Feature/Event/Valuation) 連結
CREATE TABLE IF NOT EXISTS thesis_evidence_links (
    id                       BIGSERIAL PRIMARY KEY,
    thesis_id                UUID NOT NULL,
    thesis_version           INT NOT NULL,
    evidence_type            TEXT NOT NULL, -- feature_snapshot / event / valuation_snapshot / news_verified
    evidence_ref_id          TEXT NOT NULL, -- 指向對應表的 ID
    pillar_key               TEXT,          -- 該證據支持的論點支柱 Key
    polarity                 TEXT NOT NULL, -- support / risk / disconfirm
    note                     TEXT,
    linked_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 5. Rules & Decisions
-- ---------------------------------------------------------

-- 規則執行日誌 (Plugin-based Rule Engine 產出)
CREATE TABLE IF NOT EXISTS rule_execution_log (
    log_id                   BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    rule_id                  VARCHAR(100) NOT NULL,
    category                 VARCHAR(20) NOT NULL, -- risk / entry / exit / filter / thesis
    action                   VARCHAR(20) NOT NULL, -- BUY / HOLD / SELL / BLOCK / etc.
    severity                 VARCHAR(20) NOT NULL, -- info / warning / critical
    triggered                BOOLEAN NOT NULL,
    reason                   TEXT NOT NULL,
    context_json             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 最終決策合成層 (Decision Composer 產出)
CREATE TABLE IF NOT EXISTS final_decisions (
    id                       BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    decision_date            DATE NOT NULL,
    action                   VARCHAR(20) NOT NULL, -- BUY / ADD / HOLD / TRIM / SELL / EXIT / WATCH
    confidence               NUMERIC(5,2),
    summary                  TEXT NOT NULL,
    thesis_status            TEXT NOT NULL,
    supporting_rule_ids      JSONB,
    blocking_rule_ids        JSONB,
    composer_version         TEXT NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 6. Support Data & Logs
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_events (
    event_id                 BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) REFERENCES stock_master(stock_id),
    event_type               VARCHAR(50) NOT NULL,
    event_date               DATE NOT NULL,
    title                    TEXT NOT NULL,
    summary                  TEXT,
    source_system            VARCHAR(50) NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_fetch_log (
    fetch_id                 BIGSERIAL PRIMARY KEY,
    provider_name            VARCHAR(50) NOT NULL,
    dataset                  VARCHAR(100) NOT NULL,
    query_mode               VARCHAR(30) NOT NULL,
    status                   VARCHAR(20) NOT NULL,
    latency_ms               INTEGER,
    cost_units               NUMERIC(10,2), -- 記錄消耗的 FinMind 點數或額度
    is_fallback              BOOLEAN NOT NULL DEFAULT FALSE,
    error_message            TEXT,
    requested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    stock_id                 VARCHAR(10) PRIMARY KEY REFERENCES stock_master(stock_id),
    entry_price              NUMERIC(14,4) NOT NULL,
    shares                   INTEGER NOT NULL,
    stop_loss                NUMERIC(14,4),
    take_profit              NUMERIC(14,4),
    opened_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
