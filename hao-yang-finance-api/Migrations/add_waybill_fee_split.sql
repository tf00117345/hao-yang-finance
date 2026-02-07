-- 新增 waybill_fee_split 表（運費分攤）
-- 用途：一筆託運單的運費可分攤給多位司機，影響統計與結算，但不改變原始運費金額

CREATE TABLE waybill_fee_split (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    waybill_id       TEXT NOT NULL,
    target_driver_id TEXT NOT NULL,
    amount           DECIMAL(12, 2) NOT NULL,
    notes            TEXT,
    created_at       TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    updated_at       TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),

    -- 關聯：刪除託運單時，自動刪除其所有分攤記錄（CASCADE）
    CONSTRAINT fk_waybill_fee_split_waybill
        FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,

    -- 關聯：不允許刪除仍有分攤記錄指向的司機（RESTRICT）
    CONSTRAINT fk_waybill_fee_split_driver
        FOREIGN KEY (target_driver_id) REFERENCES driver(id) ON DELETE RESTRICT
);

-- 索引：依託運單查詢分攤記錄
CREATE INDEX idx_fee_split_waybill ON waybill_fee_split(waybill_id);

-- 索引：依目標司機查詢分攤記錄
CREATE INDEX idx_fee_split_driver ON waybill_fee_split(target_driver_id);
