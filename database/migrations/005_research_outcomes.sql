-- 研究成效追蹤表格

CREATE TABLE IF NOT EXISTS research_outcomes (
    id                       BIGSERIAL PRIMARY KEY,
    run_id                   UUID NOT NULL REFERENCES research_runs(run_id) ON DELETE CASCADE,
    stock_id                 VARCHAR(10) NOT NULL REFERENCES stock_master(stock_id),
    action                   VARCHAR(20) NOT NULL,
    entry_reference_price    NUMERIC(14,4) NOT NULL,
    t_plus_1_return          NUMERIC(10,4), -- 1日報酬率
    t_plus_5_return          NUMERIC(10,4), -- 5日報酬率
    t_plus_20_return         NUMERIC(10,4), -- 20日報酬率 (月)
    max_drawdown             NUMERIC(10,4), -- 最大回撤
    is_correct_direction     BOOLEAN,       -- 方向是否正確 (基於 action)
    recorded_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_outcomes_run_id ON research_outcomes(run_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_stock_date ON research_outcomes(stock_id, recorded_at);
