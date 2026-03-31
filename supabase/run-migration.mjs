// Quick migration script - run with: node supabase/run-migration.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gmnmqptynslciarsdrqf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtbm1xcHR5bnNsY2lhcnNkcnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTc3NzIsImV4cCI6MjA4NTg5Mzc3Mn0.WWt_TClCMjpLnnBqQqhm5bxNMUy9nUeHbHrWXpzXm-8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking if patients table exists...');
    const { data, error } = await supabase.from('patients').select('id').limit(1);
    if (error) {
        console.log('❌ patients table does NOT exist:', error.message);
        console.log('\n⚠️  You need to create it manually in the Supabase Dashboard SQL Editor.');
        console.log('Go to: https://supabase.com/dashboard/project/gmnmqptynslciarsdrqf/sql');
        console.log('\nPaste this SQL and click RUN:\n');
        console.log(`
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    age INTEGER,
    primary_complaint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
`);
    } else {
        console.log('✅ patients table exists! Data:', data);
    }

    // Also check sessions table
    const { data: sessions, error: sessErr } = await supabase.from('sessions').select('id').limit(1);
    if (sessErr) {
        console.log('❌ sessions table error:', sessErr.message);
    } else {
        console.log('✅ sessions table exists. Count:', sessions?.length);
    }
}

checkTable();
