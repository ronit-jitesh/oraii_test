-- =============================================
-- Superbills Table Migration (Idempotent)
-- Revenue Engine: Session → Claim automation
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS
-- =============================================

-- Create superbills table
CREATE TABLE IF NOT EXISTS superbills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    user_id UUID DEFAULT auth.uid(),

    -- Billing codes
    cpt_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format: [{ "code": "90834", "description": "...", "fee": 150 }]
    
    icd_10_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format: [{ "code": "F41.1", "description": "Generalized anxiety disorder" }]

    -- Provider info
    provider_name TEXT,
    provider_npi TEXT,
    provider_tax_id TEXT,

    -- Session details
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_duration_minutes INTEGER,
    place_of_service TEXT DEFAULT '11',
    -- Place of Service: 11 = Office, 02 = Telehealth

    -- Financials
    total_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    adjustment DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_payer', 'Finalized', 'submitted', 'paid', 'denied', 'appealed')),

    -- Patient insurance
    insurance_name TEXT,
    insurance_id TEXT,
    insurance_group TEXT,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_superbills_patient ON superbills(patient_id);
CREATE INDEX IF NOT EXISTS idx_superbills_session ON superbills(session_id);
CREATE INDEX IF NOT EXISTS idx_superbills_user ON superbills(user_id);
CREATE INDEX IF NOT EXISTS idx_superbills_status ON superbills(status);
CREATE INDEX IF NOT EXISTS idx_superbills_date ON superbills(service_date);

-- RLS Policies (idempotent: drop then recreate)
ALTER TABLE superbills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own superbills" ON superbills;
CREATE POLICY "Users can view their own superbills"
    ON superbills FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own superbills" ON superbills;
CREATE POLICY "Users can insert their own superbills"
    ON superbills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own superbills" ON superbills;
CREATE POLICY "Users can update their own superbills"
    ON superbills FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anonymous read" ON superbills;
CREATE POLICY "Allow anonymous read"
    ON superbills FOR SELECT
    USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anonymous insert" ON superbills;
CREATE POLICY "Allow anonymous insert"
    ON superbills FOR INSERT
    WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anonymous update" ON superbills;
CREATE POLICY "Allow anonymous update"
    ON superbills FOR UPDATE
    USING (user_id IS NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_superbills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS superbills_updated_at ON superbills;
CREATE TRIGGER superbills_updated_at
    BEFORE UPDATE ON superbills
    FOR EACH ROW
    EXECUTE FUNCTION update_superbills_updated_at();
