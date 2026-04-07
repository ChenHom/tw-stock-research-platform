-- 精進研究執行記錄：加入明確的開始與結束時間

ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 修正欄位名稱以符合用戶要求 (total_score -> research_total_score)
-- 注意：使用 DO 塊確保冪等性，避免重複執行報錯
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_research_results' AND column_name='total_score') THEN
    ALTER TABLE candidate_research_results RENAME COLUMN total_score TO research_total_score;
  END IF;
END $$;
