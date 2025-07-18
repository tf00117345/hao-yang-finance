-- 皓揚財務追蹤系統 - 改善版資料庫 Schema
-- 修正原 schema 的潛在問題

-- =====================================
-- 1. 基礎資料表 (Master Data) - 改善版
-- =====================================

-- 公司資料表 - 改善版
CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(20), -- 統一編號或其他國家稅號
    contact_person VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(100),
    country_code VARCHAR(2) DEFAULT 'TW', -- 國家代碼
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 改善的約束
    CONSTRAINT company_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT company_tax_id_format CHECK (
        tax_id IS NULL OR 
        (country_code = 'TW' AND LENGTH(tax_id) = 8 AND tax_id ~ '^[0-9]{8}$') OR
        (country_code != 'TW' AND LENGTH(tax_id) BETWEEN 5 AND 20)
    ),
    CONSTRAINT company_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT company_country_code_valid CHECK (country_code ~ '^[A-Z]{2}$')
);

-- 司機資料表 - 改善版
CREATE TABLE driver (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    license_number VARCHAR(20), -- 駕照號碼
    phone VARCHAR(20),
    id_number VARCHAR(20), -- 身分證字號或其他證件
    id_type VARCHAR(10) DEFAULT 'ID_CARD', -- 證件類型
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 改善的約束
    CONSTRAINT driver_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT driver_id_type_valid CHECK (
        id_type IN ('ID_CARD', 'PASSPORT', 'RESIDENCE_PERMIT', 'OTHER')
    ),
    CONSTRAINT driver_id_number_format CHECK (
        id_number IS NULL OR 
        (id_type = 'ID_CARD' AND LENGTH(id_number) = 10 AND id_number ~ '^[A-Z][12][0-9]{8}$') OR
        (id_type != 'ID_CARD' AND LENGTH(id_number) BETWEEN 6 AND 20)
    )
);

-- =====================================
-- 2. 託運單相關表格 - 改善版
-- =====================================

-- 託運單主表 - 改善版
CREATE TABLE waybill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    item VARCHAR(100) NOT NULL,
    tonnage NUMERIC(10,3) NOT NULL, -- 增加精度支援更小單位
    company_id UUID NOT NULL,
    working_time_start TIME NOT NULL,
    working_time_end TIME NOT NULL,
    fee NUMERIC(15,2) NOT NULL, -- 增加金額上限
    driver_id UUID NOT NULL,
    plate_number VARCHAR(15) NOT NULL, -- 增加長度支援較長車牌
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1, -- 樂觀鎖版本號
    
    -- 外鍵約束
    CONSTRAINT fk_waybill_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_waybill_driver FOREIGN KEY (driver_id) REFERENCES driver(id),
    
    -- 改善的業務約束
    CONSTRAINT waybill_number_not_empty CHECK (LENGTH(TRIM(waybill_number)) > 0),
    CONSTRAINT waybill_item_not_empty CHECK (LENGTH(TRIM(item)) > 0),
    CONSTRAINT waybill_tonnage_positive CHECK (tonnage > 0),
    CONSTRAINT waybill_tonnage_reasonable CHECK (tonnage <= 1000), -- 合理上限
    CONSTRAINT waybill_fee_non_negative CHECK (fee >= 0),
    CONSTRAINT waybill_fee_reasonable CHECK (fee <= 10000000), -- 合理上限
    CONSTRAINT waybill_working_time_valid CHECK (working_time_end > working_time_start),
    CONSTRAINT waybill_status_valid CHECK (status IN ('PENDING', 'INVOICED', 'NO_INVOICE_NEEDED')),
    CONSTRAINT waybill_date_reasonable CHECK (
        date >= '2020-01-01' AND 
        date <= CURRENT_DATE + INTERVAL '1 month'
    ),
    CONSTRAINT waybill_plate_number_format CHECK (
        LENGTH(TRIM(plate_number)) >= 6 AND 
        LENGTH(TRIM(plate_number)) <= 15
    )
);

-- 託運單額外費用表 - 改善版
CREATE TABLE waybill_extra_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL,
    description VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    expense_type VARCHAR(20) DEFAULT 'OTHER', -- 費用類型
    is_taxable BOOLEAN NOT NULL DEFAULT true, -- 是否計稅
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_waybill_extra_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 改善的業務約束
    CONSTRAINT waybill_extra_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT waybill_extra_amount_positive CHECK (amount > 0),
    CONSTRAINT waybill_extra_amount_reasonable CHECK (amount <= 1000000),
    CONSTRAINT waybill_extra_type_valid CHECK (
        expense_type IN ('FUEL', 'TOLL', 'PARKING', 'OVERTIME', 'OTHER')
    )
);

-- =====================================
-- 3. 發票相關表格 - 改善版
-- =====================================

-- 發票主表 - 改善版
CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    company_id UUID NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(7,6) NOT NULL DEFAULT 0.05, -- 增加稅率精度
    extra_expenses_include_tax BOOLEAN NOT NULL DEFAULT false,
    tax NUMERIC(15,2) NOT NULL,
    total NUMERIC(15,2) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'issued',
    payment_method VARCHAR(20),
    payment_note TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    paid_at TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1, -- 樂觀鎖版本號
    
    -- 外鍵約束
    CONSTRAINT fk_invoice_company FOREIGN KEY (company_id) REFERENCES company(id),
    
    -- 改善的業務約束
    CONSTRAINT invoice_number_not_empty CHECK (LENGTH(TRIM(invoice_number)) > 0),
    CONSTRAINT invoice_number_format CHECK (
        invoice_number ~ '^[A-Z]{2}[0-9]{8}$' OR -- 台灣發票格式
        LENGTH(invoice_number) BETWEEN 5 AND 50  -- 其他格式
    ),
    CONSTRAINT invoice_subtotal_positive CHECK (subtotal > 0),
    CONSTRAINT invoice_subtotal_reasonable CHECK (subtotal <= 100000000),
    CONSTRAINT invoice_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 0.5),
    CONSTRAINT invoice_tax_non_negative CHECK (tax >= 0),
    CONSTRAINT invoice_total_positive CHECK (total > 0),
    CONSTRAINT invoice_status_valid CHECK (status IN ('issued', 'paid', 'void')),
    CONSTRAINT invoice_payment_method_valid CHECK (
        payment_method IS NULL OR payment_method IN ('現金', '轉帳', '票據', '支票')
    ),
    CONSTRAINT invoice_paid_at_logic CHECK (
        (status = 'paid' AND paid_at IS NOT NULL) OR 
        (status != 'paid')
    ),
    CONSTRAINT invoice_payment_method_logic CHECK (
        (status = 'paid' AND payment_method IS NOT NULL) OR 
        (status != 'paid')
    ),
    CONSTRAINT invoice_date_reasonable CHECK (
        date >= '2020-01-01' AND 
        date <= CURRENT_DATE + INTERVAL '1 month'
    ),
    CONSTRAINT invoice_amount_calculation CHECK (
        ABS(total - (subtotal + tax)) < 0.01
    )
);

-- 唯一約束：發票編號唯一性
CREATE UNIQUE INDEX uk_invoice_number ON invoice(invoice_number) WHERE status != 'void';

-- =====================================
-- 4. 觸發器：版本號自動遞增
-- =====================================

-- 版本號自動遞增函數
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 應用版本號觸發器
CREATE TRIGGER update_waybill_version BEFORE UPDATE ON waybill
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER update_invoice_version BEFORE UPDATE ON invoice
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- =====================================
-- 5. 改善的索引策略
-- =====================================

-- 基礎索引
CREATE INDEX idx_company_name_active ON company(name, is_active);
CREATE INDEX idx_driver_name_active ON driver(name, is_active);

-- 託運單索引優化
CREATE INDEX idx_waybill_company_date_status ON waybill(company_id, date, status);
CREATE INDEX idx_waybill_driver_date ON waybill(driver_id, date);
CREATE INDEX idx_waybill_plate_number ON waybill(plate_number);

-- 發票索引優化
CREATE INDEX idx_invoice_company_date_status ON invoice(company_id, date, status);
CREATE INDEX idx_invoice_status_date ON invoice(status, date DESC);

-- 部分索引：只對活躍資料建立索引
CREATE INDEX idx_company_active_name ON company(name) WHERE is_active = true;
CREATE INDEX idx_driver_active_name ON driver(name) WHERE is_active = true;

-- =====================================
-- 6. 改善的視圖 - 使用物化視圖
-- =====================================

-- 託運單統計物化視圖
CREATE MATERIALIZED VIEW mv_waybill_statistics AS
SELECT 
    w.id,
    w.waybill_number,
    w.date,
    w.company_id,
    c.name as company_name,
    w.driver_id,
    d.name as driver_name,
    w.fee,
    w.status,
    COALESCE(extras.total_extras, 0) as total_extras,
    w.fee + COALESCE(extras.total_extras, 0) as total_amount
FROM waybill w
LEFT JOIN company c ON w.company_id = c.id
LEFT JOIN driver d ON w.driver_id = d.id
LEFT JOIN (
    SELECT 
        waybill_id,
        SUM(amount) as total_extras,
        COUNT(*) as extras_count
    FROM waybill_extra_expense
    GROUP BY waybill_id
) extras ON w.id = extras.waybill_id;

-- 建立物化視圖的索引
CREATE INDEX idx_mv_waybill_company_date ON mv_waybill_statistics(company_id, date);
CREATE INDEX idx_mv_waybill_status ON mv_waybill_statistics(status);

-- =====================================
-- 7. 定期更新物化視圖的函數
-- =====================================

CREATE OR REPLACE FUNCTION refresh_waybill_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_waybill_statistics;
END;
$$ LANGUAGE plpgsql;

-- 註解
COMMENT ON MATERIALIZED VIEW mv_waybill_statistics IS '託運單統計物化視圖，提升查詢效能';
COMMENT ON FUNCTION refresh_waybill_statistics() IS '更新託運單統計物化視圖';