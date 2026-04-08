-- 擴展研究結果表以支援規則與論點成效分析

ALTER TABLE candidate_research_results ADD COLUMN IF NOT EXISTS rule_results JSONB;
ALTER TABLE candidate_research_results ADD COLUMN IF NOT EXISTS thesis_status VARCHAR(50);

-- 為分析查詢建立索引
CREATE INDEX IF NOT EXISTS idx_candidate_results_thesis_status ON candidate_research_results(thesis_status);
-- 注意：JSONB 索引視分析頻率而定，目前先不建立 GIN 索引以維持寫入效能。