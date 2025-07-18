-- 皓揚財務追蹤系統 - 完整資料庫 Schema
-- 修正版本：解決原設計的缺陷與漏洞

-- =====================================
-- 1. 基礎資料表 (Master Data)
-- =====================================

-- 公司資料表
CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(20), -- 統一編號
    contact_person VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 約束
    CONSTRAINT company_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT company_tax_id_format CHECK (tax_id IS NULL OR LENGTH(tax_id) = 8),
    CONSTRAINT company_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 司機資料表
CREATE TABLE driver (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    license_number VARCHAR(20), -- 駕照號碼
    phone VARCHAR(20),
    id_number VARCHAR(12), -- 身分證字號
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 約束
    CONSTRAINT driver_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT driver_id_number_format CHECK (id_number IS NULL OR LENGTH(id_number) = 10)
);

-- =====================================
-- 2. 託運單相關表格
-- =====================================

-- 託運單主表
CREATE TABLE waybill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    item VARCHAR(100) NOT NULL,
    tonnage NUMERIC(8,2) NOT NULL,
    company_id UUID NOT NULL,
    working_time_start TIME NOT NULL,
    working_time_end TIME NOT NULL,
    fee NUMERIC(12,2) NOT NULL,
    driver_id UUID NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1, -- 樂觀鎖版本號
    
    -- 外鍵約束
    CONSTRAINT fk_waybill_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_waybill_driver FOREIGN KEY (driver_id) REFERENCES driver(id),
    
    -- 業務約束
    CONSTRAINT waybill_number_not_empty CHECK (LENGTH(TRIM(waybill_number)) > 0),
    CONSTRAINT waybill_item_not_empty CHECK (LENGTH(TRIM(item)) > 0),
    CONSTRAINT waybill_tonnage_positive CHECK (tonnage > 0),
    CONSTRAINT waybill_fee_non_negative CHECK (fee >= 0),
    CONSTRAINT waybill_working_time_valid CHECK (working_time_end > working_time_start),
    CONSTRAINT waybill_status_valid CHECK (status IN ('PENDING', 'INVOICED', 'NO_INVOICE_NEEDED')),
    CONSTRAINT waybill_date_reasonable CHECK (date >= '2020-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year'),
    CONSTRAINT waybill_plate_number_format CHECK (LENGTH(TRIM(plate_number)) > 0)
);

-- 託運單額外費用表
CREATE TABLE waybill_extra_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL,
    description VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_waybill_extra_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 業務約束
    CONSTRAINT waybill_extra_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT waybill_extra_amount_positive CHECK (amount > 0)
);

-- =====================================
-- 3. 發票相關表格
-- =====================================

-- 發票主表
CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    company_id UUID NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.05,
    extra_expenses_include_tax BOOLEAN NOT NULL DEFAULT false,
    tax NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
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
    
    -- 業務約束
    CONSTRAINT invoice_number_not_empty CHECK (LENGTH(TRIM(invoice_number)) > 0),
    CONSTRAINT invoice_subtotal_positive CHECK (subtotal > 0),
    CONSTRAINT invoice_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 1),
    CONSTRAINT invoice_tax_non_negative CHECK (tax >= 0),
    CONSTRAINT invoice_total_positive CHECK (total > 0),
    CONSTRAINT invoice_status_valid CHECK (status IN ('issued', 'paid', 'void')),
    CONSTRAINT invoice_payment_method_valid CHECK (
        payment_method IS NULL OR payment_method IN ('現金', '轉帳', '票據')
    ),
    CONSTRAINT invoice_paid_at_logic CHECK (
        (status = 'paid' AND paid_at IS NOT NULL) OR 
        (status != 'paid' AND paid_at IS NULL)
    ),
    CONSTRAINT invoice_payment_method_logic CHECK (
        (status = 'paid' AND payment_method IS NOT NULL) OR 
        (status != 'paid')
    ),
    CONSTRAINT invoice_date_reasonable CHECK (date >= '2020-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year'),
    CONSTRAINT invoice_amount_calculation CHECK (ABS(total - (subtotal + tax)) < 0.01) -- 浮點數精度容忍
);

-- 發票與託運單關聯表
CREATE TABLE invoice_waybill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    waybill_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_invoice_waybill_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_waybill_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 唯一約束：同一個託運單不能關聯到多個發票
    CONSTRAINT uk_invoice_waybill_waybill UNIQUE (waybill_id)
);

-- 發票包含的額外費用
CREATE TABLE invoice_extra_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    waybill_extra_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL, -- 冗餘存儲，避免歷史資料問題
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_invoice_extra_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_extra_waybill_extra FOREIGN KEY (waybill_extra_id) REFERENCES waybill_extra_expense(id) ON DELETE CASCADE,
    
    -- 業務約束
    CONSTRAINT invoice_extra_amount_positive CHECK (amount > 0),
    
    -- 唯一約束：同一個額外費用不能被多個發票包含
    CONSTRAINT uk_invoice_extra_waybill_extra UNIQUE (waybill_extra_id)
);

-- =====================================
-- 4. 索引設計
-- =====================================

-- 基礎資料表索引
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_tax_id ON company(tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_company_active ON company(is_active);

CREATE INDEX idx_driver_name ON driver(name);
CREATE INDEX idx_driver_active ON driver(is_active);

-- 託運單索引
CREATE INDEX idx_waybill_number ON waybill(waybill_number);
CREATE INDEX idx_waybill_date ON waybill(date);
CREATE INDEX idx_waybill_company ON waybill(company_id);
CREATE INDEX idx_waybill_driver ON waybill(driver_id);
CREATE INDEX idx_waybill_status ON waybill(status);
CREATE INDEX idx_waybill_created_at ON waybill(created_at);
CREATE INDEX idx_waybill_updated_at ON waybill(updated_at);

-- 複合索引：常用查詢組合
CREATE INDEX idx_waybill_company_date ON waybill(company_id, date);
CREATE INDEX idx_waybill_status_date ON waybill(status, date);
CREATE INDEX idx_waybill_company_status ON waybill(company_id, status);

-- 託運單額外費用索引
CREATE INDEX idx_waybill_extra_waybill ON waybill_extra_expense(waybill_id);

-- 發票索引
CREATE INDEX idx_invoice_number ON invoice(invoice_number);
CREATE INDEX idx_invoice_date ON invoice(date);
CREATE INDEX idx_invoice_company ON invoice(company_id);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_created_at ON invoice(created_at);

-- 複合索引：常用查詢組合
CREATE INDEX idx_invoice_company_date ON invoice(company_id, date);
CREATE INDEX idx_invoice_status_date ON invoice(status, date);
CREATE INDEX idx_invoice_company_status ON invoice(company_id, status);

-- 關聯表索引
CREATE INDEX idx_invoice_waybill_invoice ON invoice_waybill(invoice_id);
CREATE INDEX idx_invoice_waybill_waybill ON invoice_waybill(waybill_id);

CREATE INDEX idx_invoice_extra_invoice ON invoice_extra_expense(invoice_id);
CREATE INDEX idx_invoice_extra_waybill_extra ON invoice_extra_expense(waybill_extra_id);

-- =====================================
-- 5. 觸發器：自動更新 updated_at
-- =====================================

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 應用觸發器
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_updated_at BEFORE UPDATE ON driver
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waybill_updated_at BEFORE UPDATE ON waybill
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON invoice
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- 6. 視圖：常用查詢
-- =====================================

-- 託運單詳細視圖
CREATE VIEW v_waybill_detail AS
SELECT 
    w.*,
    c.name as company_name,
    c.tax_id as company_tax_id,
    d.name as driver_name,
    d.license_number as driver_license,
    COALESCE(extra.extra_total, 0) as extra_expenses_total
FROM waybill w
LEFT JOIN company c ON w.company_id = c.id
LEFT JOIN driver d ON w.driver_id = d.id
LEFT JOIN (
    SELECT waybill_id, SUM(amount) as extra_total
    FROM waybill_extra_expense
    GROUP BY waybill_id
) extra ON w.id = extra.waybill_id;

-- 發票詳細視圖
CREATE VIEW v_invoice_detail AS
SELECT 
    i.*,
    c.name as company_name,
    c.tax_id as company_tax_id,
    waybill_info.waybill_count,
    waybill_info.total_tonnage,
    waybill_info.waybill_numbers
FROM invoice i
LEFT JOIN company c ON i.company_id = c.id
LEFT JOIN (
    SELECT 
        iw.invoice_id,
        COUNT(*) as waybill_count,
        SUM(w.tonnage) as total_tonnage,
        STRING_AGG(w.waybill_number, ', ') as waybill_numbers
    FROM invoice_waybill iw
    JOIN waybill w ON iw.waybill_id = w.id
    GROUP BY iw.invoice_id
) waybill_info ON i.id = waybill_info.invoice_id;

-- =====================================
-- 7. 初始資料
-- =====================================

-- 插入一些測試資料
INSERT INTO company (name, tax_id, contact_person, phone, address) VALUES
('測試公司 A', '12345678', '張三', '02-12345678', '台北市中正區測試路1號'),
('測試公司 B', '87654321', '李四', '02-87654321', '新北市板橋區測試街2號');

INSERT INTO driver (name, license_number, phone, id_number) VALUES
('司機甲', 'A123456789', '0912345678', 'A123456789'),
('司機乙', 'B987654321', '0987654321', 'B987654321');

-- =====================================
-- 8. 註解說明
-- =====================================

COMMENT ON TABLE company IS '公司資料表';
COMMENT ON TABLE driver IS '司機資料表';
COMMENT ON TABLE waybill IS '託運單主表';
COMMENT ON TABLE waybill_extra_expense IS '託運單額外費用表';
COMMENT ON TABLE invoice IS '發票主表';
COMMENT ON TABLE invoice_waybill IS '發票與託運單關聯表';
COMMENT ON TABLE invoice_extra_expense IS '發票包含的額外費用';

COMMENT ON COLUMN waybill.version IS '樂觀鎖版本號，防止並發修改';
COMMENT ON COLUMN invoice.version IS '樂觀鎖版本號，防止並發修改';
COMMENT ON COLUMN invoice_extra_expense.amount IS '冗餘存儲金額，避免歷史資料問題';