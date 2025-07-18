-- 皓揚財務追蹤系統 - SQLite Schema (簡化版)
-- 移除複雜的 constraint，在程式內統一管理驗證邏輯

-- =====================================
-- 1. 公司資料表
-- =====================================
CREATE TABLE company (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tax_id TEXT,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    email TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 2. 司機資料表
-- =====================================
CREATE TABLE driver (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 3. 託運單資料表 (為未來準備)
-- =====================================
CREATE TABLE waybill (
    id TEXT PRIMARY KEY,
    waybill_number TEXT NOT NULL,
    date TEXT NOT NULL,
    item TEXT NOT NULL,
    company_id TEXT NOT NULL,
    working_time_start TEXT NOT NULL,
    working_time_end TEXT NOT NULL,
    fee REAL NOT NULL,
    driver_id TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    invoice_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 4. 載貨地點資料表
-- =====================================
CREATE TABLE loading_location (
    id TEXT PRIMARY KEY,
    waybill_id TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 5. 額外費用資料表
-- =====================================
CREATE TABLE extra_expense (
    id TEXT PRIMARY KEY,
    waybill_id TEXT NOT NULL,
    item TEXT NOT NULL,
    fee REAL NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 6. 發票資料表
-- =====================================
CREATE TABLE invoice (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    date TEXT NOT NULL,
    company_id TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_rate REAL NOT NULL DEFAULT 0.05,
    extra_expenses_include_tax INTEGER NOT NULL DEFAULT 0,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued',
    payment_method TEXT,
    payment_note TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
);

-- =====================================
-- 7. 發票託運單關聯表
-- =====================================
CREATE TABLE invoice_waybill (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    waybill_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 8. 發票額外費用關聯表
-- =====================================
CREATE TABLE invoice_extra_expense (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    extra_expense_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================
-- 9. 基本索引 (效能優化)
-- =====================================

-- 公司索引
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_is_active ON company(is_active);

-- 司機索引
CREATE INDEX idx_driver_name ON driver(name);
CREATE INDEX idx_driver_is_active ON driver(is_active);

-- 託運單索引
CREATE INDEX idx_waybill_company_id ON waybill(company_id);
CREATE INDEX idx_waybill_driver_id ON waybill(driver_id);
CREATE INDEX idx_waybill_status ON waybill(status);
CREATE INDEX idx_waybill_date ON waybill(date);

-- 發票索引
CREATE INDEX idx_invoice_company_id ON invoice(company_id);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_date ON invoice(date);

-- 關聯表索引
CREATE INDEX idx_invoice_waybill_invoice_id ON invoice_waybill(invoice_id);
CREATE INDEX idx_invoice_waybill_waybill_id ON invoice_waybill(waybill_id);

-- =====================================
-- 10. 初始測試資料
-- =====================================

-- 公司測試資料
INSERT INTO company (id, name, tax_id, contact_person, phone, address, email) VALUES
('company-001', '測試公司 A', '12345678', '張三', '02-12345678', '台北市中正區測試路1號', 'companyA@test.com'),
('company-002', '測試公司 B', '87654321', '李四', '02-87654321', '新北市板橋區測試街2號', 'companyB@test.com'),
('company-003', '測試公司 C', '11223344', '王五', '02-11223344', '桃園市中壢區測試大道3號', 'companyC@test.com');

-- 司機測試資料
INSERT INTO driver (id, name, phone) VALUES
('driver-001', '司機甲', '0912345678'),
('driver-002', '司機乙', '0987654321'),
('driver-003', '司機丙', '0933112233');

-- =====================================
-- 11. 觸發器 (自動更新 updated_at)
-- =====================================

-- 公司資料更新觸發器
CREATE TRIGGER update_company_updated_at 
AFTER UPDATE ON company
BEGIN
    UPDATE company SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 司機資料更新觸發器
CREATE TRIGGER update_driver_updated_at 
AFTER UPDATE ON driver
BEGIN
    UPDATE driver SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 託運單資料更新觸發器
CREATE TRIGGER update_waybill_updated_at 
AFTER UPDATE ON waybill
BEGIN
    UPDATE waybill SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 發票資料更新觸發器
CREATE TRIGGER update_invoice_updated_at 
AFTER UPDATE ON invoice
BEGIN
    UPDATE invoice SET updated_at = datetime('now') WHERE id = NEW.id;
END;