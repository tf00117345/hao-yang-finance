-- 皓揚財務追蹤系統 - 最終版資料庫 Schema
-- 配合現有 TypeScript 程式碼結構

-- =====================================
-- 1. 基礎資料表
-- =====================================

-- 公司資料表 (對應 companyId)
CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(8), -- 台灣統一編號
    contact_person VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 約束
    CONSTRAINT company_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT company_tax_id_format CHECK (tax_id IS NULL OR (LENGTH(tax_id) = 8 AND tax_id ~ '^[0-9]{8}$')),
    CONSTRAINT company_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 司機資料表 (簡化版，移除不必要欄位)
CREATE TABLE driver (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 約束
    CONSTRAINT driver_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- =====================================
-- 2. 託運單相關表格
-- =====================================

-- 託運單主表 (配合 TypeScript interface)
CREATE TABLE waybill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    item VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL, -- 對應 companyId
    working_time_start TIME NOT NULL, -- 對應 workingTime.start
    working_time_end TIME NOT NULL,   -- 對應 workingTime.end
    fee NUMERIC(12,2) NOT NULL,
    driver_id UUID NOT NULL, -- 對應 driverId
    plate_number VARCHAR(10) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 替代 isInvoiceIssued
    invoice_id UUID, -- 對應 invoiceId
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_waybill_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_waybill_driver FOREIGN KEY (driver_id) REFERENCES driver(id),
    
    -- 業務約束
    CONSTRAINT waybill_number_not_empty CHECK (LENGTH(TRIM(waybill_number)) > 0),
    CONSTRAINT waybill_item_not_empty CHECK (LENGTH(TRIM(item)) > 0),
    CONSTRAINT waybill_fee_non_negative CHECK (fee >= 0),
    CONSTRAINT waybill_working_time_valid CHECK (working_time_end > working_time_start),
    CONSTRAINT waybill_date_reasonable CHECK (date >= '2020-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year'),
    CONSTRAINT waybill_plate_number_not_empty CHECK (LENGTH(TRIM(plate_number)) > 0),
    CONSTRAINT waybill_status_valid CHECK (status IN ('PENDING', 'INVOICED', 'NO_INVOICE_NEEDED')),
    -- 狀態邏輯約束
    CONSTRAINT waybill_invoice_logic CHECK (
        (status = 'INVOICED' AND invoice_id IS NOT NULL) OR
        (status != 'INVOICED' AND invoice_id IS NULL)
    )
);

-- 載貨地點表 (對應 LoadingLocation[])
CREATE TABLE loading_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL,
    from_location VARCHAR(100) NOT NULL, -- 對應 from
    to_location VARCHAR(100) NOT NULL,   -- 對應 to
    sequence_order INTEGER NOT NULL DEFAULT 1, -- 載貨順序
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_loading_location_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 業務約束
    CONSTRAINT loading_from_not_empty CHECK (LENGTH(TRIM(from_location)) > 0),
    CONSTRAINT loading_to_not_empty CHECK (LENGTH(TRIM(to_location)) > 0),
    CONSTRAINT loading_sequence_positive CHECK (sequence_order > 0)
);

-- 額外費用表 (對應 ExtraExpense[])
CREATE TABLE extra_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL,
    item VARCHAR(100) NOT NULL,    -- 對應 item
    fee NUMERIC(12,2) NOT NULL,    -- 對應 fee
    notes TEXT,                    -- 對應 notes
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_extra_expense_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 業務約束
    CONSTRAINT extra_expense_item_not_empty CHECK (LENGTH(TRIM(item)) > 0),
    CONSTRAINT extra_expense_fee_positive CHECK (fee > 0)
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
    CONSTRAINT invoice_date_reasonable CHECK (date >= '2020-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year'),
    CONSTRAINT invoice_amount_calculation CHECK (ABS(total - (subtotal + tax)) < 0.01)
);

-- 發票包含的額外費用 (哪些額外費用被包含在發票中)
CREATE TABLE invoice_extra_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    extra_expense_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL, -- 冗餘存儲，保存歷史金額
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_invoice_extra_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_extra_expense FOREIGN KEY (extra_expense_id) REFERENCES extra_expense(id) ON DELETE CASCADE,
    
    -- 業務約束
    CONSTRAINT invoice_extra_amount_positive CHECK (amount > 0),
    
    -- 唯一約束：同一個額外費用不能被多個發票包含
    CONSTRAINT uk_invoice_extra_expense UNIQUE (extra_expense_id)
);

-- =====================================
-- 4. 索引設計
-- =====================================

-- 公司索引
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_active ON company(is_active);

-- 司機索引
CREATE INDEX idx_driver_name ON driver(name);
CREATE INDEX idx_driver_active ON driver(is_active);

-- 託運單索引
CREATE INDEX idx_waybill_number ON waybill(waybill_number);
CREATE INDEX idx_waybill_date ON waybill(date);
CREATE INDEX idx_waybill_company ON waybill(company_id);
CREATE INDEX idx_waybill_driver ON waybill(driver_id);
CREATE INDEX idx_waybill_status ON waybill(status);
CREATE INDEX idx_waybill_invoice_id ON waybill(invoice_id) WHERE invoice_id IS NOT NULL;

-- 複合索引
CREATE INDEX idx_waybill_company_date ON waybill(company_id, date);
CREATE INDEX idx_waybill_status_date ON waybill(status, date);

-- 載貨地點索引
CREATE INDEX idx_loading_location_waybill ON loading_location(waybill_id);
CREATE INDEX idx_loading_location_sequence ON loading_location(waybill_id, sequence_order);

-- 額外費用索引
CREATE INDEX idx_extra_expense_waybill ON extra_expense(waybill_id);

-- 發票索引
CREATE INDEX idx_invoice_number ON invoice(invoice_number);
CREATE INDEX idx_invoice_company ON invoice(company_id);
CREATE INDEX idx_invoice_date ON invoice(date);
CREATE INDEX idx_invoice_status ON invoice(status);

-- =====================================
-- 5. 觸發器：自動更新 updated_at
-- =====================================

-- 觸發器函數
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
-- 6. 同步觸發器：保持 is_invoice_issued 與 invoice_id 一致
-- =====================================

-- 當發票被刪除時，自動更新託運單狀態
CREATE OR REPLACE FUNCTION sync_waybill_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 發票被刪除或作廢時，將相關託運單狀態重置為 PENDING
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'void') THEN
        UPDATE waybill 
        SET status = 'PENDING', invoice_id = NULL
        WHERE invoice_id = COALESCE(OLD.id, NEW.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_waybill_on_invoice_change 
    AFTER UPDATE OR DELETE ON invoice
    FOR EACH ROW EXECUTE FUNCTION sync_waybill_invoice_status();

-- =====================================
-- 7. 實用視圖
-- =====================================

-- 託運單完整資訊視圖
CREATE VIEW v_waybill_complete AS
SELECT 
    w.*,
    c.name as company_name,
    d.name as driver_name,
    -- 載貨地點 JSON 聚合
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'from', from_location,
                'to', to_location
            ) ORDER BY sequence_order
        ) FROM loading_location WHERE waybill_id = w.id),
        '[]'::json
    ) as loading_locations,
    -- 額外費用 JSON 聚合
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'item', item,
                'fee', fee,
                'notes', notes
            )
        ) FROM extra_expense WHERE waybill_id = w.id),
        '[]'::json
    ) as extra_expenses,
    -- 額外費用總計
    COALESCE((SELECT SUM(fee) FROM extra_expense WHERE waybill_id = w.id), 0) as total_extra_expenses
FROM waybill w
LEFT JOIN company c ON w.company_id = c.id
LEFT JOIN driver d ON w.driver_id = d.id;

-- 發票完整資訊視圖
CREATE VIEW v_invoice_complete AS
SELECT 
    i.*,
    c.name as company_name,
    -- 關聯的託運單數量
    (SELECT COUNT(*) FROM waybill WHERE invoice_id = i.id) as waybill_count,
    -- 關聯的託運單號碼
    (SELECT STRING_AGG(waybill_number, ', ') FROM waybill WHERE invoice_id = i.id) as waybill_numbers
FROM invoice i
LEFT JOIN company c ON i.company_id = c.id;

-- =====================================
-- 8. 初始測試資料
-- =====================================

-- 公司測試資料
INSERT INTO company (name, tax_id, contact_person, phone, address) VALUES
('測試公司 A', '12345678', '張三', '02-12345678', '台北市中正區測試路1號'),
('測試公司 B', '87654321', '李四', '02-87654321', '新北市板橋區測試街2號');

-- 司機測試資料
INSERT INTO driver (name, phone) VALUES
('司機甲', '0912345678'),
('司機乙', '0987654321');

-- =====================================
-- 9. 註解說明
-- =====================================

COMMENT ON TABLE company IS '公司資料表，對應 TypeScript 的 companyId';
COMMENT ON TABLE driver IS '司機資料表，簡化版本';
COMMENT ON TABLE waybill IS '託運單主表，配合 TypeScript Waybill interface';
COMMENT ON TABLE loading_location IS '載貨地點表，對應 LoadingLocation[]';
COMMENT ON TABLE extra_expense IS '額外費用表，對應 ExtraExpense[]';
COMMENT ON TABLE invoice IS '發票主表';
COMMENT ON TABLE invoice_extra_expense IS '發票包含的額外費用關聯表';

COMMENT ON COLUMN waybill.status IS '託運單狀態：PENDING(待開發票)、INVOICED(已開發票)、NO_INVOICE_NEEDED(不需開發票)';
COMMENT ON COLUMN waybill.invoice_id IS '對應 TypeScript 的 invoiceId';
COMMENT ON COLUMN loading_location.sequence_order IS '載貨順序，支援多個載貨地點';
COMMENT ON VIEW v_waybill_complete IS '託運單完整資訊視圖，包含 JSON 格式的載貨地點和額外費用';