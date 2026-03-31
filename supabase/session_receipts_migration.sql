-- =============================================
-- Session Receipts (India billing)
-- Replaces US CPT/Superbill for Indian market
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS session_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT,
    fee_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT,  -- cash, UPI, card, bank_transfer, online
    payment_status TEXT DEFAULT 'pending',  -- pending, paid, waived
    receipt_number TEXT,
    therapist_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE session_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own receipts"
    ON session_receipts FOR ALL
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_receipts_patient ON session_receipts(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_receipts_user ON session_receipts(user_id);
