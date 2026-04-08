-- 010: 修正 final_decisions 的欄位名稱以對齊程式碼

DO $$ 
BEGIN 
    -- 1. 重新命名 supporting_rule_ids -> supporting_rules
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='final_decisions' AND column_name='supporting_rule_ids') THEN
        ALTER TABLE final_decisions RENAME COLUMN supporting_rule_ids TO supporting_rules;
    END IF;

    -- 2. 重新命名 blocking_rule_ids -> blocking_rules
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='final_decisions' AND column_name='blocking_rule_ids') THEN
        ALTER TABLE final_decisions RENAME COLUMN blocking_rule_ids TO blocking_rules;
    END IF;
END $$;
