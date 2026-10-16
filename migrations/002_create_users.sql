-- Create the users table for the Equipment Checkout application.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- User account information.
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- Supported user roles.
    role ENUM(
        'borrower',
        'lab_staff',
        'department_lead'
    ) NOT NULL DEFAULT 'borrower',

    -- Allows accounts to be deactivated without deleting records.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Track when accounts are created and updated.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
