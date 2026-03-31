-- =============================================
-- Patient Consent Migration
-- DPDP Act 2023 Compliant Consent Tracking
-- =============================================

-- Create patient_consents table
CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Consent types (aligned with DPDP Act)
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'treatment',       -- Consent to receive treatment
        'data_processing', -- DPDP Section 6: Personal Data Processing
        'recording',       -- Session audio recording
        'ai_processing',   -- AI/ML processing of data
        'data_sharing'     -- Third party data sharing
    )),
    
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Versioning for audit trail
    consent_version INTEGER NOT NULL DEFAULT 1,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- DPDP Act metadata
    purpose TEXT,        -- Purpose of data processing
    data_fiduciary TEXT, -- Organization name (Data Fiduciary under DPDP Act)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick consent lookups
CREATE INDEX IF NOT EXISTS idx_consents_patient
ON patient_consents(patient_id, consent_type);

-- Row Level Security so each clinician sees only their patients' consents
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own patients' consents"
ON patient_consents
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
