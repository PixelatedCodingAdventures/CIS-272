-- Sprint 3 - Issue #58: Record Equipment Condition During Check-In.
-- Extend loan return records without changing existing equipment conditions.

-- Support the SOW's return condition classifications while preserving
-- the original values used by existing loans and seed data.
ALTER TABLE loans
    MODIFY COLUMN return_condition ENUM(
        'excellent',
        'good',
        'fair',
        'poor',
        'damaged',
        'working',
        'missing_parts'
    ) DEFAULT NULL;

-- Store optional staff notes about the condition of returned equipment.
-- These notes belong to the individual loan return record.
ALTER TABLE loans
    ADD COLUMN return_condition_notes TEXT DEFAULT NULL;