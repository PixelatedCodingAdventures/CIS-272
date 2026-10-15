-- Create the equipment inventory table for the Equipment Checkout application.
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Equipment identification and description.
    name VARCHAR(150) NOT NULL,
    asset_tag VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Current equipment availability.
    status ENUM(
        'available',
        'checked_out',
        'maintenance',
        'retired'
    ) NOT NULL DEFAULT 'available',

    -- Physical condition of the equipment.
    equipment_condition ENUM(
        'excellent',
        'good',
        'fair',
        'poor',
        'damaged'
    ) NOT NULL DEFAULT 'good',

    -- Track equipment creation and updates.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Index equipment status for inventory searches.
    INDEX idx_equipment_status (status)
);
