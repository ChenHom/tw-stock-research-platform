-- 最終持久化校對：補齊外鍵與索引

-- 1. 補齊外鍵約束
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_candidate_results_stock') THEN
    ALTER TABLE candidate_research_results 
    ADD CONSTRAINT fk_candidate_results_stock 
    FOREIGN KEY (stock_id) REFERENCES stock_master(stock_id);
  END IF;
END $$;

-- 2. 補齊/更名索引以符合規範
DROP INDEX IF EXISTS idx_research_runs_date;
CREATE INDEX IF NOT EXISTS idx_research_runs_trade_date ON research_runs(trade_date);

DROP INDEX IF EXISTS idx_candidate_results_run;
CREATE INDEX IF NOT EXISTS idx_candidate_results_run_id ON candidate_research_results(run_id);
CREATE INDEX IF NOT EXISTS idx_candidate_results_stock_id ON candidate_research_results(stock_id);

-- 3. 確保所有欄位皆已存在且正確 (二次檢查)
-- research_runs: started_at, completed_at 已在 003 處理
-- candidate_research_results: research_total_score 已在 003 處理
