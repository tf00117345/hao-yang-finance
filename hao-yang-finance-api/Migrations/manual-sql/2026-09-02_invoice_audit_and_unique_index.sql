-- =============================================================================
-- 線上 DB 更新：發票異動稽核 + invoice_number 唯一索引
--
-- 純 DDL，不依賴 EF 的 __EFMigrationsHistory。
-- 全部使用 IF NOT EXISTS，可重複執行（idempotent）。
--
-- ⚠ 執行前務必先做「步驟 0」的重複號碼檢查。
--   若步驟 0 有回傳列，代表已有重複發票號碼，
--   步驟 2 建立 UNIQUE INDEX 會失敗並整段 rollback。
--   請先處理掉重複號碼，再重新執行本檔。
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 步驟 0：先檢查是否有重複發票號碼（純查詢，安全）
--   有回傳列 → 先處理重複，否則步驟 2 的唯一索引會失敗。
--   沒有回傳列（0 rows）→ 可安全往下執行主體交易。
-- -----------------------------------------------------------------------------
SELECT invoice_number, COUNT(*) AS cnt
FROM invoice
GROUP BY invoice_number
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- 主體交易（步驟 1 + 步驟 2），全有或全無
-- -----------------------------------------------------------------------------
BEGIN;

-- 步驟 1：建立 invoice_audit_log 稽核表 + 索引
CREATE TABLE IF NOT EXISTS invoice_audit_log (
    id text NOT NULL,
    action character varying(20) NOT NULL,
    invoice_id text NOT NULL,
    invoice_number character varying(50) NOT NULL,
    suggested_invoice_number character varying(50),
    user_id character varying(50),
    username character varying(100),
    timestamp timestamp with time zone NOT NULL,
    details jsonb,
    CONSTRAINT "PK_invoice_audit_log" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IX_invoice_audit_log_invoice_id" ON invoice_audit_log (invoice_id);
CREATE INDEX IF NOT EXISTS "IX_invoice_audit_log_timestamp"  ON invoice_audit_log (timestamp);

-- 步驟 2：invoice_number 唯一索引（若有重複會在此失敗 → 整段 rollback）
CREATE UNIQUE INDEX IF NOT EXISTS "IX_invoice_invoice_number" ON invoice (invoice_number);

COMMIT;


-- -----------------------------------------------------------------------------
-- 步驟 3（可選）：執行後驗證
-- -----------------------------------------------------------------------------
-- SELECT to_regclass('public.invoice_audit_log');   -- 應回傳 invoice_audit_log
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('invoice','invoice_audit_log')
--   AND indexname IN ('IX_invoice_invoice_number','IX_invoice_audit_log_invoice_id','IX_invoice_audit_log_timestamp');
