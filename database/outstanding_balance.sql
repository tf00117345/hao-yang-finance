-- 欠款追蹤表 (Outstanding Balance Tracking)
-- 用於記錄收款時客戶未付清的差額

CREATE TABLE IF NOT EXISTS outstanding_balance (
    id VARCHAR(255) PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'outstanding',
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outstanding_balance_company ON outstanding_balance(company_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_balance_status ON outstanding_balance(status);
CREATE INDEX IF NOT EXISTS idx_outstanding_balance_invoice ON outstanding_balance(invoice_id);

-- If you already ran the old script, fix columns:
ALTER TABLE outstanding_balance ALTER COLUMN resolved_at TYPE TEXT;
ALTER TABLE outstanding_balance ALTER COLUMN created_at TYPE TEXT;
ALTER TABLE outstanding_balance ALTER COLUMN updated_at TYPE TEXT;