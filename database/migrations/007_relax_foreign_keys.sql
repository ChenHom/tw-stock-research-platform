-- 007: 移除外鍵約束，改由程式面約束，提升研究系統的彈性

DO $$ 
BEGIN 
    -- 1. 移除 feature_snapshots 的外鍵
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='feature_snapshots_stock_id_fkey') THEN
        ALTER TABLE feature_snapshots DROP CONSTRAINT feature_snapshots_stock_id_fkey;
    END IF;

    -- 2. 移除 candidate_research_results 的外鍵
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_candidate_results_stock') THEN
        ALTER TABLE candidate_research_results DROP CONSTRAINT fk_candidate_results_stock;
    END IF;

    -- 3. 移除 research_outcomes 的外鍵 (如果有的話)
    -- 注意：如果是無名約束，通常會是 research_outcomes_stock_id_fkey
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='research_outcomes_stock_id_fkey') THEN
        ALTER TABLE research_outcomes DROP CONSTRAINT research_outcomes_stock_id_fkey;
    END IF;
END $$;
