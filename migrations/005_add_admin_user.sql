INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    is_active
)
VALUES (
    'Admin',
    'admin@example.com',
    '$2b$12$Hy0DnWDXdfuzX/6R6ne6zeHhAXpUUcfRKcTTFvUUjzGn09lKB7.CS',
    'department_lead',
    TRUE
)
ON DUPLICATE KEY UPDATE
    email = email;