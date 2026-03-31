-- Patient Discharge/Archive Support
-- Adds a status column to track active vs discharged patients

-- Add status column (defaults to 'active' for existing patients)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add discharged timestamp
ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMPTZ;

-- Index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Backfill: ensure all existing patients are marked 'active'
UPDATE patients SET status = 'active' WHERE status IS NULL;
