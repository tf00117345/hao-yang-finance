-- 皓揚財務追蹤系統 - 資料庫設計修正
-- 修正 schema-final.sql 中發現的問題

-- =====================================
-- 修正 1: 加入遺漏的發票託運單關聯表
-- =====================================

-- 發票與託運單關聯表 (這個表格在原 schema 中遺漏了！)
CREATE TABLE invoice_waybill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    waybill_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- 外鍵約束
    CONSTRAINT fk_invoice_waybill_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_waybill_waybill FOREIGN KEY (waybill_id) REFERENCES waybill(id) ON DELETE CASCADE,
    
    -- 唯一約束：同一個託運單不能關聯到多個發票
    CONSTRAINT uk_invoice_waybill_waybill UNIQUE (waybill_id),
    
    -- 唯一約束：同一發票不能重複關聯同一託運單
    CONSTRAINT uk_invoice_waybill_pair UNIQUE (invoice_id, waybill_id)
);

-- 為關聯表建立索引
CREATE INDEX idx_invoice_waybill_invoice ON invoice_waybill(invoice_id);
CREATE INDEX idx_invoice_waybill_waybill ON invoice_waybill(waybill_id);

-- =====================================
-- 修正 2: 完善觸發器 - 自動同步託運單狀態
-- =====================================

-- 當發票被建立時，自動更新託運單狀態為 INVOICED
CREATE OR REPLACE FUNCTION sync_waybill_status_on_invoice_create()
RETURNS TRIGGER AS $$
BEGIN
    -- 當新增 invoice_waybill 關聯時，將託運單狀態設為 INVOICED
    IF TG_OP = 'INSERT' THEN
        UPDATE waybill 
        SET status = 'INVOICED', invoice_id = NEW.invoice_id
        WHERE id = NEW.waybill_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_waybill_status_on_invoice_create_trigger
    AFTER INSERT ON invoice_waybill
    FOR EACH ROW EXECUTE FUNCTION sync_waybill_status_on_invoice_create();

-- 當發票關聯被刪除時，自動恢復託運單狀態為 PENDING
CREATE OR REPLACE FUNCTION sync_waybill_status_on_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 當刪除 invoice_waybill 關聯時，將託運單狀態恢復為 PENDING
    IF TG_OP = 'DELETE' THEN
        UPDATE waybill 
        SET status = 'PENDING', invoice_id = NULL
        WHERE id = OLD.waybill_id;
    END IF;
    
    RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_waybill_status_on_invoice_delete_trigger
    AFTER DELETE ON invoice_waybill
    FOR EACH ROW EXECUTE FUNCTION sync_waybill_status_on_invoice_delete();

-- =====================================
-- 修正 3: 改善原有的發票刪除觸發器
-- =====================================

-- 修正原有觸發器，使用關聯表來處理
CREATE OR REPLACE FUNCTION sync_waybill_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 發票被刪除或作廢時，刪除所有關聯（觸發器會自動恢復託運單狀態）
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'void') THEN
        DELETE FROM invoice_waybill 
        WHERE invoice_id = COALESCE(OLD.id, NEW.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 重新建立觸發器
DROP TRIGGER IF EXISTS sync_waybill_on_invoice_change ON invoice;
CREATE TRIGGER sync_waybill_on_invoice_change 
    AFTER UPDATE OR DELETE ON invoice
    FOR EACH ROW EXECUTE FUNCTION sync_waybill_invoice_status();

-- =====================================
-- 修正 4: 加入發票金額驗證函數
-- =====================================

-- 驗證發票金額是否正確的函數
CREATE OR REPLACE FUNCTION validate_invoice_amount(
    p_invoice_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_waybill_total NUMERIC(12,2);
    v_extra_expense_total NUMERIC(12,2);
    v_calculated_subtotal NUMERIC(12,2);
    v_calculated_tax NUMERIC(12,2);
    v_calculated_total NUMERIC(12,2);
    v_invoice_record RECORD;
BEGIN
    -- 取得發票資料
    SELECT * INTO v_invoice_record 
    FROM invoice 
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 計算託運單總金額
    SELECT COALESCE(SUM(w.fee), 0) INTO v_waybill_total
    FROM waybill w
    JOIN invoice_waybill iw ON w.id = iw.waybill_id
    WHERE iw.invoice_id = p_invoice_id;
    
    -- 計算額外費用總金額
    SELECT COALESCE(SUM(iee.amount), 0) INTO v_extra_expense_total
    FROM invoice_extra_expense iee
    WHERE iee.invoice_id = p_invoice_id;
    
    -- 計算應有的金額
    v_calculated_subtotal := v_waybill_total + v_extra_expense_total;
    
    -- 計算稅額
    IF v_invoice_record.extra_expenses_include_tax THEN
        v_calculated_tax := v_calculated_subtotal * v_invoice_record.tax_rate;
    ELSE
        v_calculated_tax := v_waybill_total * v_invoice_record.tax_rate;
    END IF;
    
    v_calculated_total := v_calculated_subtotal + v_calculated_tax;
    
    -- 驗證金額是否正確（允許 0.01 的誤差）
    RETURN (
        ABS(v_invoice_record.subtotal - v_calculated_subtotal) < 0.01 AND
        ABS(v_invoice_record.tax - v_calculated_tax) < 0.01 AND
        ABS(v_invoice_record.total - v_calculated_total) < 0.01
    );
END;
$$ language 'plpgsql';

-- =====================================
-- 修正 5: 加入級聯刪除策略
-- =====================================

-- 修正外鍵約束的級聯策略
ALTER TABLE waybill 
    DROP CONSTRAINT IF EXISTS fk_waybill_company,
    ADD CONSTRAINT fk_waybill_company 
        FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT;

ALTER TABLE waybill 
    DROP CONSTRAINT IF EXISTS fk_waybill_driver,
    ADD CONSTRAINT fk_waybill_driver 
        FOREIGN KEY (driver_id) REFERENCES driver(id) ON DELETE RESTRICT;

ALTER TABLE invoice 
    DROP CONSTRAINT IF EXISTS fk_invoice_company,
    ADD CONSTRAINT fk_invoice_company 
        FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT;

-- =====================================
-- 修正 6: 加入資料完整性檢查
-- =====================================

-- 檢查發票狀態與託運單狀態一致性的函數
CREATE OR REPLACE FUNCTION check_invoice_waybill_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- 檢查發票狀態為 issued 或 paid 時，所有關聯託運單必須為 INVOICED
    IF NEW.status IN ('issued', 'paid') THEN
        IF EXISTS (
            SELECT 1 
            FROM invoice_waybill iw
            JOIN waybill w ON iw.waybill_id = w.id
            WHERE iw.invoice_id = NEW.id AND w.status != 'INVOICED'
        ) THEN
            RAISE EXCEPTION '發票狀態為 % 時，所有關聯託運單必須為 INVOICED 狀態', NEW.status;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_invoice_waybill_consistency_trigger
    BEFORE UPDATE ON invoice
    FOR EACH ROW EXECUTE FUNCTION check_invoice_waybill_consistency();

-- =====================================
-- 修正 7: 加入審計日誌表格
-- =====================================

-- 狀態變更日誌表
CREATE TABLE status_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100), -- 未來可存放使用者ID
    changed_at TIMESTAMP NOT NULL DEFAULT now(),
    reason TEXT,
    
    -- 約束
    CONSTRAINT status_log_table_valid CHECK (table_name IN ('waybill', 'invoice')),
    CONSTRAINT status_log_statuses_different CHECK (old_status != new_status OR old_status IS NULL)
);

-- 索引
CREATE INDEX idx_status_log_table_record ON status_change_log(table_name, record_id);
CREATE INDEX idx_status_log_changed_at ON status_change_log(changed_at);

-- 託運單狀態變更日誌觸發器
CREATE OR REPLACE FUNCTION log_waybill_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO status_change_log (table_name, record_id, old_status, new_status, reason)
        VALUES ('waybill', NEW.id, OLD.status, NEW.status, 
                CASE 
                    WHEN NEW.status = 'INVOICED' THEN '開立發票'
                    WHEN NEW.status = 'PENDING' THEN '發票刪除或作廢'
                    WHEN NEW.status = 'NO_INVOICE_NEEDED' THEN '標記為不需開發票'
                    ELSE '狀態變更'
                END);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_waybill_status_change_trigger
    AFTER UPDATE ON waybill
    FOR EACH ROW EXECUTE FUNCTION log_waybill_status_change();

-- 發票狀態變更日誌觸發器
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO status_change_log (table_name, record_id, old_status, new_status, reason)
        VALUES ('invoice', NEW.id, OLD.status, NEW.status,
                CASE 
                    WHEN NEW.status = 'paid' THEN '標記為已收款'
                    WHEN NEW.status = 'void' THEN '發票作廢'
                    ELSE '狀態變更'
                END);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_invoice_status_change_trigger
    AFTER UPDATE ON invoice
    FOR EACH ROW EXECUTE FUNCTION log_invoice_status_change();

-- =====================================
-- 修正 8: 加入效能優化的部分索引
-- =====================================

-- 只對活躍狀態的記錄建立索引
CREATE INDEX idx_waybill_pending_date ON waybill(date) WHERE status = 'PENDING';
CREATE INDEX idx_invoice_active_date ON invoice(date) WHERE status IN ('issued', 'paid');

-- 複合索引優化
CREATE INDEX idx_waybill_company_status_date ON waybill(company_id, status, date);
CREATE INDEX idx_invoice_company_status_date ON invoice(company_id, status, date);

-- =====================================
-- 修正 9: 加入資料清理功能
-- =====================================

-- 清理孤立記錄的函數
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT := '';
    v_count INTEGER;
BEGIN
    -- 清理沒有關聯託運單的額外費用
    DELETE FROM extra_expense e
    WHERE NOT EXISTS (
        SELECT 1 FROM waybill w WHERE w.id = e.waybill_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || format('清理孤立額外費用: %s 筆\n', v_count);
    
    -- 清理沒有關聯託運單的載貨地點
    DELETE FROM loading_location l
    WHERE NOT EXISTS (
        SELECT 1 FROM waybill w WHERE w.id = l.waybill_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || format('清理孤立載貨地點: %s 筆\n', v_count);
    
    -- 清理沒有關聯發票的發票額外費用
    DELETE FROM invoice_extra_expense iee
    WHERE NOT EXISTS (
        SELECT 1 FROM invoice i WHERE i.id = iee.invoice_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || format('清理孤立發票額外費用: %s 筆\n', v_count);
    
    RETURN v_result;
END;
$$ language 'plpgsql';

-- =====================================
-- 修正 10: 加入註解說明
-- =====================================

COMMENT ON TABLE invoice_waybill IS '發票與託運單關聯表，記錄哪些託運單被包含在發票中';
COMMENT ON TABLE status_change_log IS '狀態變更日誌表，記錄所有狀態變更歷史';
COMMENT ON FUNCTION validate_invoice_amount(UUID) IS '驗證發票金額計算是否正確';
COMMENT ON FUNCTION cleanup_orphaned_records() IS '清理孤立記錄的維護函數';

COMMENT ON COLUMN invoice_waybill.waybill_id IS '關聯的託運單ID，具有唯一約束防止重複開發票';
COMMENT ON COLUMN status_change_log.reason IS '狀態變更原因，由觸發器自動填入';
COMMENT ON COLUMN status_change_log.changed_by IS '變更人員，未來可擴展為使用者管理';