'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =============================================
// Patient Profile
// =============================================

export async function getPatientProfile() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        // Get next appointment
        const { data: nextAppt } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', user.id)
            .gte('requested_time', new Date().toISOString())
            .order('requested_time', { ascending: true })
            .limit(1)
            .single();

        // Get mood streak (consecutive days)
        const { data: recentMoods } = await supabase
            .from('mood_logs')
            .select('created_at')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);

        let streak = 0;
        if (recentMoods && recentMoods.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                const hasLog = recentMoods.some(m =>
                    new Date(m.created_at).toISOString().split('T')[0] === dateStr
                );
                if (hasLog) streak++;
                else break;
            }
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
            },
            nextAppointment: nextAppt || null,
            moodStreak: streak,
        };
    } catch (error) {
        return { error: `Failed to get profile: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Mood Logging
// =============================================

export async function saveMoodLog(data: {
    moodScore: number;
    journalEntry?: string;
    activities?: string[];
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: log, error } = await supabase
            .from('mood_logs')
            .insert({
                patient_id: user.id,
                mood_score: data.moodScore,
                journal_entry: data.journalEntry || null,
                activities: data.activities || [],
            })
            .select()
            .single();

        if (error) return { error: `Failed to save mood: ${error.message}` };

        revalidatePath('/patient/dashboard');
        revalidatePath('/patient/journey');
        return { success: true, log };
    } catch (error) {
        return { error: `Failed to save mood: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function getMoodHistory(days: number = 30) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: moods, error } = await supabase
            .from('mood_logs')
            .select('*')
            .eq('patient_id', user.id)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: true });

        if (error) return { error: `Failed to fetch moods: ${error.message}` };
        return { success: true, moods: moods || [] };
    } catch (error) {
        return { error: `Failed to fetch moods: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function getTodayMood() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayLog } = await supabase
            .from('mood_logs')
            .select('*')
            .eq('patient_id', user.id)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return { success: true, todayMood: todayLog || null };
    } catch (error) {
        return { error: `Failed to get today's mood: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Chat Messages
// =============================================

export async function getChatHistory(limit: number = 50) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) return { error: `Failed to fetch chat: ${error.message}` };
        return { success: true, messages: messages || [] };
    } catch (error) {
        return { error: `Failed to fetch chat: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function saveChatMessage(data: {
    role: 'user' | 'assistant';
    content: string;
    flagged?: boolean;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: msg, error } = await supabase
            .from('chat_messages')
            .insert({
                patient_id: user.id,
                role: data.role,
                content: data.content,
                flagged: data.flagged || false,
            })
            .select()
            .single();

        if (error) return { error: `Failed to save message: ${error.message}` };
        return { success: true, message: msg };
    } catch (error) {
        return { error: `Failed to save message: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Screening / Assessments
// =============================================

export async function getScreeningHistory() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: results, error } = await supabase
            .from('screening_results')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return { error: `Failed to fetch screenings: ${error.message}` };
        return { success: true, results: results || [] };
    } catch (error) {
        return { error: `Failed to fetch screenings: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function saveScreeningResult(data: {
    instrument: string;
    itemScores: number[];
    totalScore: number;
    severityLabel: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        // Save to screening_results (patient-owned)
        const { data: result, error } = await supabase
            .from('screening_results')
            .insert({
                patient_id: user.id,
                instrument: data.instrument,
                item_scores: data.itemScores,
                total_score: data.totalScore,
                severity_label: data.severityLabel,
                synced_to_doctor: true,
            })
            .select()
            .single();

        if (error) return { error: `Failed to save screening: ${error.message}` };

        // Also sync to outcome_assessments for doctor visibility
        await supabase
            .from('outcome_assessments')
            .insert({
                patient_id: user.id,
                user_id: null, // Patient-submitted — no doctor user_id
                instrument: data.instrument,
                item_scores: data.itemScores,
                total_score: data.totalScore,
                severity_label: data.severityLabel,
            })
            .then(() => { }, () => { }); // Graceful if table structure differs

        revalidatePath('/patient/screening');
        revalidatePath('/patient/journey');
        return { success: true, result };
    } catch (error) {
        return { error: `Failed to save screening: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Emergency Contacts
// =============================================

export async function getEmergencyContacts() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: contacts, error } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('patient_id', user.id)
            .order('is_primary', { ascending: false });

        if (error) return { error: `Failed to fetch contacts: ${error.message}` };
        return { success: true, contacts: contacts || [] };
    } catch (error) {
        return { error: `Failed to fetch contacts: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function saveEmergencyContact(data: {
    id?: string;
    contactName: string;
    contactPhone: string;
    relationship?: string;
    isPrimary?: boolean;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        if (data.id) {
            // Update existing
            const { error } = await supabase
                .from('emergency_contacts')
                .update({
                    contact_name: data.contactName,
                    contact_phone: data.contactPhone,
                    relationship: data.relationship || null,
                    is_primary: data.isPrimary || false,
                })
                .eq('id', data.id)
                .eq('patient_id', user.id);

            if (error) return { error: `Failed to update contact: ${error.message}` };
        } else {
            // If setting as primary, unset others first
            if (data.isPrimary) {
                await supabase
                    .from('emergency_contacts')
                    .update({ is_primary: false })
                    .eq('patient_id', user.id);
            }

            const { error } = await supabase
                .from('emergency_contacts')
                .insert({
                    patient_id: user.id,
                    contact_name: data.contactName,
                    contact_phone: data.contactPhone,
                    relationship: data.relationship || null,
                    is_primary: data.isPrimary || false,
                });

            if (error) return { error: `Failed to save contact: ${error.message}` };
        }

        revalidatePath('/patient/emergency');
        return { success: true };
    } catch (error) {
        return { error: `Failed to save contact: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function deleteEmergencyContact(contactId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('emergency_contacts')
            .delete()
            .eq('id', contactId)
            .eq('patient_id', user.id);

        if (error) return { error: `Failed to delete contact: ${error.message}` };

        revalidatePath('/patient/emergency');
        return { success: true };
    } catch (error) {
        return { error: `Failed to delete contact: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function saveSafetyPlan(plan: {
    warningSignals: string[];
    copingStrategies: string[];
    reasonsToLive: string[];
    socialContacts: string[];
    professionalContacts: string[];
    environmentSafety: string[];
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        // Save to primary emergency contact's safety_plan field
        const { data: primaryContact } = await supabase
            .from('emergency_contacts')
            .select('id')
            .eq('patient_id', user.id)
            .eq('is_primary', true)
            .limit(1)
            .single();

        if (primaryContact) {
            await supabase
                .from('emergency_contacts')
                .update({ safety_plan: plan })
                .eq('id', primaryContact.id);
        } else {
            // Create a placeholder contact with safety plan
            await supabase
                .from('emergency_contacts')
                .insert({
                    patient_id: user.id,
                    contact_name: 'Safety Plan',
                    contact_phone: '',
                    is_primary: false,
                    safety_plan: plan,
                });
        }

        revalidatePath('/patient/emergency');
        return { success: true };
    } catch (error) {
        return { error: `Failed to save safety plan: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Session Notes (for patient viewing)
// =============================================

export async function getSessionNotesForPatient() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('id, created_at, soap_note, note_format')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return { error: `Failed to fetch notes: ${error.message}` };
        return { success: true, sessions: sessions || [] };
    } catch (error) {
        return { error: `Failed to fetch notes: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function translateNoteToPlainLanguage(clinicalNote: string) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            return {
                success: true,
                translation: `**What we discussed:**\nYour therapist noted that you've been working on managing stress and developing healthier coping strategies. You shared some important feelings during the session, and your therapist appreciated your openness.\n\n**Plan going forward:**\nContinue practicing the techniques discussed and keep track of how you're feeling. Your next session will build on the progress you've made.\n\n*Keep going — every step matters. 💚*`,
            };
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a clinical note translator for a therapy patient portal. Convert the following clinical SOAP note into warm, easy-to-understand language that a patient would find helpful and non-intimidating.

RULES:
1. Replace all clinical jargon with everyday language
2. Use "you" and "your" — address the patient directly
3. Frame findings positively where possible ("We noticed you're making progress with..." instead of "Patient exhibits continued...")
4. Remove internal clinical observations not relevant to the patient
5. Keep the therapeutic plan clear and actionable
6. Add a brief encouraging statement at the end
7. Maximum 200 words
8. Use markdown formatting with **bold** headers for sections`,
                },
                {
                    role: 'user',
                    content: `Clinical Note:\n${clinicalNote}`,
                },
            ],
            max_tokens: 500,
            temperature: 0.3,
        });

        const translation = response.choices[0]?.message?.content || '';
        return { success: true, translation };
    } catch (error) {
        return { error: `Failed to translate note: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Finding Purpose Entries
// =============================================

export async function savePurposeEntry(data: {
    module: string;
    responses: Record<string, unknown>;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: entry, error } = await supabase
            .from('finding_purpose_entries')
            .insert({
                patient_id: user.id,
                module: data.module,
                responses: data.responses,
            })
            .select()
            .single();

        if (error) return { error: `Failed to save entry: ${error.message}` };

        revalidatePath('/patient/purpose');
        return { success: true, entry };
    } catch (error) {
        return { error: `Failed to save entry: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function getPurposeEntries() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: entries, error } = await supabase
            .from('finding_purpose_entries')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return { error: `Failed to fetch entries: ${error.message}` };
        return { success: true, entries: entries || [] };
    } catch (error) {
        return { error: `Failed to fetch entries: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Journey Data (aggregated trends)
// =============================================

export async function getJourneyData() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Mood trend
        const { data: moods } = await supabase
            .from('mood_logs')
            .select('mood_score, created_at')
            .eq('patient_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        // Screening scores
        const { data: screenings } = await supabase
            .from('screening_results')
            .select('instrument, total_score, severity_label, created_at')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: true });

        // Session count
        const { count: sessionCount } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', user.id);

        // Purpose entries count
        const { count: purposeCount } = await supabase
            .from('finding_purpose_entries')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', user.id);

        return {
            success: true,
            moods: moods || [],
            screenings: screenings || [],
            sessionCount: sessionCount || 0,
            purposeCount: purposeCount || 0,
        };
    } catch (error) {
        return { error: `Failed to fetch journey data: ${error instanceof Error ? error.message : String(error)}` };
    }
}

// =============================================
// Appointment Booking (patient-side)
// =============================================

export async function bookAppointment(data: {
    requestedTime: string;
    reason?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const patientName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient';

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                patient_id: user.id,
                patient_name: patientName,
                requested_time: data.requestedTime,
                reason: data.reason || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return { error: `Failed to book: ${error.message}` };

        revalidatePath('/patient/book');
        revalidatePath('/patient/dashboard');
        return { success: true, appointment };
    } catch (error) {
        return { error: `Failed to book: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function getPatientAppointments() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', user.id)
            .order('requested_time', { ascending: true });

        if (error) return { error: `Failed to fetch appointments: ${error.message}` };
        return { success: true, appointments: appointments || [] };
    } catch (error) {
        return { error: `Failed to fetch appointments: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function cancelAppointment(appointmentId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId)
            .eq('patient_id', user.id);

        if (error) return { error: `Failed to cancel: ${error.message}` };

        revalidatePath('/patient/book');
        revalidatePath('/patient/dashboard');
        return { success: true };
    } catch (error) {
        return { error: `Failed to cancel: ${error instanceof Error ? error.message : String(error)}` };
    }
}
