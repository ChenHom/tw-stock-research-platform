-- 009: 徹底修正 feature_snapshots 的 id 型別

-- 1. 移除舊主鍵
ALTER TABLE feature_snapshots DROP CONSTRAINT IF EXISTS feature_snapshots_pkey;

-- 2. 移除舊的 id 欄位 (及其序列預設值)
ALTER TABLE feature_snapshots DROP COLUMN IF EXISTS id;

-- 3. 新增 UUID 型別的 id 欄位，並設為主鍵
ALTER TABLE feature_snapshots ADD COLUMN id UUID PRIMARY KEY;
