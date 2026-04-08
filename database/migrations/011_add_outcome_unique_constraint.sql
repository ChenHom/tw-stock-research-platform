-- 011: 為 research_outcomes 增加唯一約束以支援 ON CONFLICT (Idempotency)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='unique_run_stock_outcome') THEN
        ALTER TABLE research_outcomes ADD CONSTRAINT unique_run_stock_outcome UNIQUE (run_id, stock_id);
    END IF;
END $$;
