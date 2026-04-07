-- 增加研究執行記錄支援

CREATE TABLE IF NOT EXISTS research_runs (
    run_id                   UUID PRIMARY KEY,
    trade_date               DATE NOT NULL,
    criteria_json            JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_n                    INTEGER,
    account_tier             TEXT,
    status                   TEXT NOT NULL, -- running / completed / failed
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_research_results (
    id                       BIGSERIAL PRIMARY KEY,
    run_id                   UUID NOT NULL REFERENCES research_runs(run_id) ON DELETE CASCADE,
    stock_id                 VARCHAR(10) NOT NULL,
    preliminary_score        NUMERIC(10,2),
    total_score              NUMERIC(10,2),
    final_action             VARCHAR(20),
    confidence               NUMERIC(5,2),
    summary                  TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_research_runs_date ON research_runs(trade_date);
CREATE INDEX IF NOT EXISTS idx_candidate_results_run ON candidate_research_results(run_id);
