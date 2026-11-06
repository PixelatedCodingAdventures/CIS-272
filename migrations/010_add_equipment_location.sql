-- Issue #53: Add an optional location for equipment.
-- Existing equipment records retain a NULL location.

ALTER TABLE equipment
    ADD COLUMN location VARCHAR(150) NULL AFTER description;
