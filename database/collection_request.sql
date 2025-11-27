-- Migration: Add CollectionRequest table and update Waybill table
-- Created: 2025-01-17
-- Updated: 2025-01-21
-- Description: Adds support for batch collection requests
-- Note: company_id represents the collection request target company,
--       not a restriction on waybills (waybills can belong to different companies)

-- 1. Create collection_request table
CREATE TABLE IF NOT EXISTS collection_request (
    id VARCHAR(255) PRIMARY KEY,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    request_date VARCHAR(10) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    status VARCHAR(20) NOT NULL DEFAULT 'requested',
    notes TEXT,
    payment_received_at VARCHAR(30),
    payment_method VARCHAR(20),
    payment_notes TEXT,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT
);

-- 2. Create indexes for collection_request
CREATE INDEX idx_collection_request_company_id ON collection_request(company_id);
CREATE INDEX idx_collection_request_status ON collection_request(status);
CREATE INDEX idx_collection_request_date ON collection_request(request_date);
CREATE INDEX idx_collection_request_number ON collection_request(request_number);

-- 3. Add collection_request_id column to waybill table
ALTER TABLE waybill
ADD COLUMN collection_request_id VARCHAR(255),
ADD FOREIGN KEY (collection_request_id) REFERENCES collection_request(id) ON DELETE SET NULL;

-- 4. Create index for waybill.collection_request_id
CREATE INDEX idx_waybill_collection_request_id ON waybill(collection_request_id);

-- Migration complete