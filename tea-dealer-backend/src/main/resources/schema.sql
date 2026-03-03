-- Create collections table
-- Tea collection weights are always whole numbers (integers)
CREATE TABLE IF NOT EXISTS collections (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    book_number         VARCHAR(255)    NOT NULL,
    customer_id         BIGINT          NOT NULL,
    collection_date     DATE            NOT NULL,
    grade               VARCHAR(255)    NOT NULL,
    weight_kg           INT             NOT NULL,
    rate_per_kg         DECIMAL(10,2),
    total_amount        DECIMAL(10,2),
    notes               TEXT,
    created_at          DATETIME(6),
    updated_at          DATETIME(6),

    PRIMARY KEY (id),
    UNIQUE KEY UK_collection_book_date_grade (book_number, collection_date, grade)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id                          BIGINT          NOT NULL AUTO_INCREMENT,
    customer_id                 BIGINT          NOT NULL,
    book_number                 VARCHAR(255)    NOT NULL,
    customer_name               VARCHAR(255)    NOT NULL,
    customer_name_sinhala       VARCHAR(255),
    year                        INT             NOT NULL,
    month                       INT             NOT NULL,

    -- Tea collection kg totals — always integers
    grade1_kg                   INT,
    grade2_kg                   INT,
    total_kg                    INT,

    -- Supply deduction
    supply_deduction_percentage DECIMAL(5,2),

    -- Per-grade deduction kg: gradeKg × pct / 100, rounded per configured mode — integers
    grade1_deduction_kg         INT,
    grade2_deduction_kg         INT,

    -- Total supply deduction = grade1_deduction_kg + grade2_deduction_kg
    supply_deduction_kg         INT,
    payable_kg                  INT,

    -- Rates per kg
    grade1_rate                 DECIMAL(10,2),
    grade2_rate                 DECIMAL(10,2),

    -- Rs amounts (grade net kg × rate)
    grade1_amount               DECIMAL(10,2),
    grade2_amount               DECIMAL(10,2),
    total_amount                DECIMAL(10,2),

    -- Deductions
    last_month_arrears          DECIMAL(10,2),
    advance_amount              DECIMAL(10,2),
    loan_amount                 DECIMAL(10,2),
    fertilizer1_amount          DECIMAL(10,2),
    fertilizer2_amount          DECIMAL(10,2),
    tea_packets_count           INT,
    tea_packets_total           DECIMAL(10,2),
    agrochemicals_amount        DECIMAL(10,2),
    transport_rate_per_kg       DECIMAL(10,2),
    transport_deduction         DECIMAL(10,2),
    transport_exempt            BIT(1)          DEFAULT 0,
    stamp_fee                   DECIMAL(10,2),
    other_deductions            DECIMAL(10,2),
    other_deductions_note       VARCHAR(255),

    -- Calculated totals (set by @PrePersist)
    total_deductions            DECIMAL(10,2),
    net_amount                  DECIMAL(10,2),

    -- Metadata
    collection_details          TEXT,
    status                      VARCHAR(255)    NOT NULL DEFAULT 'GENERATED',
    generated_at                DATETIME(6)     NOT NULL,
    updated_at                  DATETIME(6),

    PRIMARY KEY (id),
    UNIQUE KEY UK_invoice_customer_period (customer_id, year, month)
);

-- Migrate existing columns to correct types
-- Safe no-ops if columns are already the right type; converts data on first run
ALTER TABLE collections MODIFY COLUMN weight_kg INT NOT NULL;

ALTER TABLE invoices MODIFY COLUMN grade1_kg INT;
ALTER TABLE invoices MODIFY COLUMN grade2_kg INT;
ALTER TABLE invoices MODIFY COLUMN total_kg INT;
ALTER TABLE invoices MODIFY COLUMN supply_deduction_kg INT;
ALTER TABLE invoices MODIFY COLUMN payable_kg INT;

-- Add per-grade deduction columns if not already present (Hibernate will add via ddl-auto if missing)
-- These are added by Hibernate ddl-auto=update when the Invoice entity is updated
