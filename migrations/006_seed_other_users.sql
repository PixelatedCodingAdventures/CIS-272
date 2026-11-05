
INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    is_active
)
VALUES
(
    'Staff',
    'staff@example.com',
    '$2b$12$Hy0DnWDXdfuzX/6R6ne6zeHhAXpUUcfRKcTTFvUUjzGn09lKB7.CS',
    'lab_staff',
    TRUE
),
(
    'Borrower1',
    'borrower1@example.com',
    '$2b$12$Hy0DnWDXdfuzX/6R6ne6zeHhAXpUUcfRKcTTFvUUjzGn09lKB7.CS',
    'borrower',
    TRUE
),
(
    'Borrower2',
    'borrower2@example.com',
    '$2b$12$Hy0DnWDXdfuzX/6R6ne6zeHhAXpUUcfRKcTTFvUUjzGn09lKB7.CS',
    'borrower',
    TRUE
),
(
    'Borrower3',
    'borrower3@example.com',
    '$2b$12$Hy0DnWDXdfuzX/6R6ne6zeHhAXpUUcfRKcTTFvUUjzGn09lKB7.CS',
    'borrower',
    TRUE
)
ON DUPLICATE KEY UPDATE
    email = email;
