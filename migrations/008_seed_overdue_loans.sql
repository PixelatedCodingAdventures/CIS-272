-- Create two overdue equipment loans.
-- Uses an existing borrower with the role 'borrower'.

START TRANSACTION;

-- Find an existing borrower.
SET @borrower_id = (
    SELECT id
    FROM users
    WHERE role = 'borrower'
    ORDER BY id
    LIMIT 1
);

-- Find the two equipment items.
SET @equipment1 = (
    SELECT id FROM equipment WHERE asset_tag = 'EQ-001'
);

SET @equipment2 = (
    SELECT id FROM equipment WHERE asset_tag = 'EQ-002'
);

-- Insert two overdue loans.
INSERT INTO loans (
    borrower_id,
    equipment_id,
    checkout_date,
    due_date,
    return_date
)
VALUES
(
    @borrower_id,
    @equipment1,
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    DATE_SUB(NOW(), INTERVAL 20 DAY),
    NULL
),
(
    @borrower_id,
    @equipment2,
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    NULL
);

-- Mark both equipment items as checked out.
UPDATE equipment
SET status = 'checked_out'
WHERE id IN (@equipment1, @equipment2);

COMMIT;