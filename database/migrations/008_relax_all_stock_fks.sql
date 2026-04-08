-- 008: 徹底移除所有對 stock_master 的強外鍵約束，改由程式面處理

DO $$ 
BEGIN 
    -- 1. 移除 final_decisions 的外鍵
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='final_decisions_stock_id_fkey') THEN
        ALTER TABLE final_decisions DROP CONSTRAINT final_decisions_stock_id_fkey;
    END IF;

    -- 2. 移除 valuation_snapshots 的外鍵 (如果有的話)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='valuation_snapshots_stock_id_fkey') THEN
        ALTER TABLE valuation_snapshots DROP CONSTRAINT valuation_snapshots_stock_id_fkey;
    END IF;

    -- 3. 二次檢查 feature_snapshots (確保名稱正確)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='feature_snapshots_stock_id_fkey') THEN
        ALTER TABLE feature_snapshots DROP CONSTRAINT feature_snapshots_stock_id_fkey;
    END IF;
END $$;
