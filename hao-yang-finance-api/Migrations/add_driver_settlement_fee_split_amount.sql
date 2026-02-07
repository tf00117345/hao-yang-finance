-- 新增 driver_settlement 表的分攤金額欄位
-- 用途：記錄該司機當月被分攤掉的淨金額（出帳分攤 - 入帳分攤）

ALTER TABLE driver_settlement
ADD COLUMN "FeeSplitAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0;
