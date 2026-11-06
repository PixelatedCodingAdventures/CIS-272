-- Add an optional location for equipment.
ALTER TABLE equipment
ADD COLUMN location VARCHAR(255) NULL AFTER description;
