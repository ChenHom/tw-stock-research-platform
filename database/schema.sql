-- PostgreSQL schema for tw-stock-research-platform

CREATE TABLE IF NOT EXISTS account_capability (
    provider_name            VARCHAR(50) NOT NULL,
    account_tier             VARCHAR(50) NOT NULL,
    api_request_limit        INTEGER,
    current_usage            INTEGER DEFAULT 0,
    supports_bulk            BOOLEAN NOT NULL DEFAULT FALSE,
    supports_realtime        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (provider_name, account_tier)
);

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

CREATE TABLE IF NOT EXISTS quarterly_financials (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    fiscal_year              INTEGER NOT NULL,
    fiscal_quarter           INTEGER NOT NULL,
    revenue                  NUMERIC(20,2),
    gross_profit             NUMERIC(20,2),
    operating_income         NUMERIC(20,2),
    net_income               NUMERIC(20,2),
    eps                      NUMERIC(14,4),
    gross_margin             NUMERIC(14,4),
    operating_margin         NUMERIC(14,4),
    net_margin               NUMERIC(14,4),
    roe                      NUMERIC(14,4),
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, fiscal_year, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS balance_sheet_snapshot (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    fiscal_year              INTEGER NOT NULL,
    fiscal_quarter           INTEGER NOT NULL,
    cash_and_equivalents     NUMERIC(20,2),
    total_assets             NUMERIC(20,2),
    total_liabilities        NUMERIC(20,2),
    total_equity             NUMERIC(20,2),
    inventory                NUMERIC(20,2),
    accounts_receivable      NUMERIC(20,2),
    long_term_debt           NUMERIC(20,2),
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, fiscal_year, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS cashflow_snapshot (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    fiscal_year              INTEGER NOT NULL,
    fiscal_quarter           INTEGER NOT NULL,
    operating_cash_flow      NUMERIC(20,2),
    investing_cash_flow      NUMERIC(20,2),
    financing_cash_flow      NUMERIC(20,2),
    free_cash_flow           NUMERIC(20,2),
    capex                    NUMERIC(20,2),
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, fiscal_year, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS institutional_flow_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    foreign_net              BIGINT DEFAULT 0,
    trust_net                BIGINT DEFAULT 0,
    dealer_net               BIGINT DEFAULT 0,
    total_institutional_net  BIGINT DEFAULT 0,
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS margin_short_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    margin_purchase_balance  BIGINT,
    short_sale_balance       BIGINT,
    margin_change            BIGINT,
    short_change             BIGINT,
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS securities_lending_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    lending_balance          BIGINT,
    lending_change           BIGINT,
    source_system            VARCHAR(50) NOT NULL,
    fetched_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS market_features_daily (
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    rsi_12                   NUMERIC(14,4),
    ma_20                    NUMERIC(14,4),
    bias_20                  NUMERIC(14,4),
    vol_20ma                 NUMERIC(20,2),
    volume_ratio_20          NUMERIC(14,4),
    alpha_vs_0050            NUMERIC(14,4),
    event_score              NUMERIC(14,4),
    value_score              NUMERIC(14,4),
    growth_score             NUMERIC(14,4),
    quality_score            NUMERIC(14,4),
    chip_score               NUMERIC(14,4),
    risk_score               NUMERIC(14,4),
    total_score              NUMERIC(14,4),
    generated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stock_id, trade_date)
);

CREATE TABLE IF NOT EXISTS company_events (
    event_id                 BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) REFERENCES stock_master(stock_id),
    event_type               VARCHAR(50) NOT NULL, -- earnings, month_revenue, dividend, announcement, product, law
    event_date               DATE NOT NULL,
    title                    TEXT NOT NULL,
    summary                  TEXT,
    source_system            VARCHAR(50) NOT NULL,
    source_ref               TEXT,
    severity                 VARCHAR(20),
    is_verified              BOOLEAN NOT NULL DEFAULT FALSE,
    verification_ref         TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_raw (
    news_id                  BIGSERIAL PRIMARY KEY,
    published_at             TIMESTAMPTZ,
    title                    TEXT NOT NULL,
    content                  TEXT,
    url                      TEXT NOT NULL UNIQUE,
    source_name              VARCHAR(100),
    source_system            VARCHAR(50) NOT NULL,
    related_stock_ids        JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending / verified / unverified
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS thesis_tracker (
    thesis_id                BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    direction                VARCHAR(10) NOT NULL, -- long / short / watch
    thesis_statement         TEXT NOT NULL,
    status                   VARCHAR(20) NOT NULL, -- intact / weakened / broken / archived
    confidence               VARCHAR(20) NOT NULL, -- high / medium / low
    pillars                  JSONB NOT NULL,
    disconfirming_evidence   JSONB NOT NULL,
    risks                    JSONB NOT NULL DEFAULT '[]'::jsonb,
    catalysts                JSONB NOT NULL DEFAULT '[]'::jsonb,
    entry_conditions         JSONB NOT NULL DEFAULT '[]'::jsonb,
    trim_conditions          JSONB NOT NULL DEFAULT '[]'::jsonb,
    exit_conditions          JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS valuation_snapshots (
    valuation_id             BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    snapshot_date            DATE NOT NULL,
    primary_method           VARCHAR(50) NOT NULL,
    peer_group               JSONB NOT NULL DEFAULT '[]'::jsonb,
    fair_value_bear          NUMERIC(14,4),
    fair_value_base          NUMERIC(14,4),
    fair_value_bull          NUMERIC(14,4),
    upside_downside_pct      NUMERIC(14,4),
    assumptions              JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    stock_id                 VARCHAR(10) PRIMARY KEY REFERENCES stock_master(stock_id),
    entry_price              NUMERIC(14,4) NOT NULL,
    shares                   INTEGER NOT NULL,
    strategy                 VARCHAR(50) NOT NULL DEFAULT 'fixed',
    stop_loss                NUMERIC(14,4),
    take_profit              NUMERIC(14,4),
    high_price               NUMERIC(14,4),
    trailing_pct             NUMERIC(14,4),
    strategy_note            TEXT,
    opened_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rule_execution_log (
    log_id                   BIGSERIAL PRIMARY KEY,
    stock_id                 VARCHAR(10) REFERENCES stock_master(stock_id),
    trade_date               DATE NOT NULL,
    rule_code                VARCHAR(100) NOT NULL,
    decision_action          VARCHAR(20) NOT NULL,
    decision_reason          TEXT NOT NULL,
    severity                 VARCHAR(20),
    context_json             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_fetch_log (
    fetch_id                 BIGSERIAL PRIMARY KEY,
    provider_name            VARCHAR(50) NOT NULL,
    dataset                  VARCHAR(100) NOT NULL,
    query_mode               VARCHAR(30) NOT NULL,
    account_tier             VARCHAR(50),
    request_count            INTEGER NOT NULL DEFAULT 1,
    status                   VARCHAR(20) NOT NULL, -- success / error / fallback / skipped
    latency_ms               INTEGER,
    is_fallback              BOOLEAN NOT NULL DEFAULT FALSE,
    error_message            TEXT,
    requested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
