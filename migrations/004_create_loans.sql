-- Create the loans table for equipment checkout records.
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Connect each loan to a borrower and equipment item.
    borrower_id INT NOT NULL,
    equipment_id INT NOT NULL,

    -- Track checkout, due, and return dates.
    checkout_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME DEFAULT NULL,

    -- Record equipment condition when returned.
    return_condition ENUM(
        'excellent',
        'good',
        'fair',
        'poor',
        'damaged'
    ) DEFAULT NULL,

    -- Prevent multiple active loans for the same equipment.
    -- MySQL permits multiple NULL values in a UNIQUE index.
    active_equipment_id INT GENERATED ALWAYS AS (
        CASE
            WHEN return_date IS NULL THEN equipment_id
            ELSE NULL
        END
    ) STORED,

    -- Track record creation and updates.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Establish foreign key relationships.
    CONSTRAINT fk_loans_borrower
        FOREIGN KEY (borrower_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_loans_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(id)
        ON DELETE RESTRICT,

    -- Prevent invalid loan dates.
    CONSTRAINT chk_loans_due_date
        CHECK (due_date >= checkout_date),

    CONSTRAINT chk_loans_return_date
        CHECK (return_date IS NULL OR return_date >= checkout_date),

    -- Indexes for loan lookups and active checkout enforcement.
    INDEX idx_loans_borrower (borrower_id),
    INDEX idx_loans_equipment (equipment_id),
    INDEX idx_loans_due_date (due_date),
    UNIQUE KEY uq_loans_active_equipment (active_equipment_id)
);
