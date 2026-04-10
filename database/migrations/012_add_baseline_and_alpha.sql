-- 新增大盤基準與超額報酬欄位
ALTER TABLE research_outcomes ADD COLUMN IF NOT EXISTS baseline_return NUMERIC(10,4);
ALTER TABLE research_outcomes ADD COLUMN IF NOT EXISTS alpha NUMERIC(10,4);
