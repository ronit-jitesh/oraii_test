-- =============================================
-- Extended Patient Intake (IPS fields)
-- Adds India-specific intake fields to patients table
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS informant_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS informant_relationship TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS family_type TEXT;  -- nuclear, joint, extended
ALTER TABLE patients ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS income_bracket TEXT;  -- below_1L, 1L_3L, 3L_5L, 5L_10L, above_10L
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS language_used TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS translator_involved BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consanguinity BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS verbatim_complaint TEXT;
