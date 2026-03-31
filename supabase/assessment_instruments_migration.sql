-- =============================================
-- Assessment Instruments Migration
-- Add support for DASS-21, CORE-10, ORS, SRS
-- alongside existing PHQ-9 and GAD-7
-- =============================================

-- Add subscale_scores column for instruments like DASS-21
-- that have Depression, Anxiety, Stress subscales
ALTER TABLE outcome_assessments
ADD COLUMN IF NOT EXISTS subscale_scores JSONB DEFAULT NULL;

-- Update instrument check constraint to allow all 6 instruments
-- First drop if exists, then recreate
DO $$
BEGIN
    ALTER TABLE outcome_assessments
        DROP CONSTRAINT IF EXISTS outcome_assessments_instrument_check;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE outcome_assessments
ADD CONSTRAINT outcome_assessments_instrument_check
CHECK (instrument IN ('PHQ-9', 'GAD-7', 'DASS-21', 'CORE-10', 'ORS', 'SRS'));

-- Add privacy_tier column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS privacy_tier TEXT DEFAULT 'ephemeral';

-- Create index for faster filtering by instrument type
CREATE INDEX IF NOT EXISTS idx_assessments_instrument
ON outcome_assessments(instrument);

-- Create index for filtering by patient + instrument for trend charts
CREATE INDEX IF NOT EXISTS idx_assessments_patient_instrument
ON outcome_assessments(patient_id, instrument, created_at DESC);
