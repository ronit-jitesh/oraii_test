'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { composePrompt, NoteFormat } from '@/lib/prompts';
import type { TherapyModality } from '@/lib/modalityConfig';
import { detectCulturalIdioms } from '@/lib/hinglishTaxonomy';
import { checkMHCACompliance } from '@/lib/mhcaCompliance';
import { analyzeSessionMicroSkills } from '@/lib/microSkillsAnalyzer';
import { createClient } from '@/lib/supabase/server';
import { getModelForTask, estimateSessionCost } from '@/lib/modelConfig';
import { sanitizeForStorage, PrivacyTier } from '@/lib/ephemeralProcessor';
import type { InstrumentType } from '@/lib/assessmentInstruments';
import { runHFRiskValidation } from '@/lib/hfClassifiers';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Zod Schema for Structured Output (Strict JSON Mode)
const EntitySchema = z.object({
    category: z.enum(['SYMPTOM', 'MEDICATION', 'THEME', 'LIFE_EVENT', 'PERSON']),
    value: z.string(),
});

const SoapNoteSchema = z.object({
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
});

const ClinicalOutputSchema = z.object({
    soapNote: SoapNoteSchema,
    entities: z.array(EntitySchema),
});

const MOCK_DEMO_RESPONSE = {
    soapNote: {
        subjective: "Patient reports significant anxiety over the last two weeks, primarily triggered by a new job. Describes a 'constant weight on my chest' and frequent overthinking. Reports waking up at 3 AM with heart racing. Denies suicidal ideation but expresses feelings of hopelessness about future improvement.",
        objective: "Patient appeared anxious during session, speaking quickly. No signs of acute distress. Oriented x3. Affect is somewhat constricted but congruent with depressed/anxious mood.",
        assessment: "Adjustment disorder with anxious mood. Patient exhibits classic signs of Imposter Syndrome related to recent career transition. Hopelessness is a concern and warrants monitoring, though no active safety risk is present.",
        plan: "1. Cognitive reframing of career-related self-doubt. 2. Sleep hygiene education. 3. Follow-up session in 2 weeks to monitor mood stability and hopelessness."
    },
    roleAnalysis: {
        speaker0Role: "Doctor",
        speaker1Role: "Patient",
        reasoning: "Speaker 0 initiates the session and asks clinical questions about symptoms and safety. Speaker 1 provides subjective history and symptom reports.",
        confidenceScore: 0.98
    },
    entities: {
        symptoms: ["Anxiety", "Insomnia", "Overthinking", "Hopelessness", "Palpitations"],
        medications: [],
        diagnoses: ["Adjustment Disorder", "Imposter Syndrome"],
        testsOrdered: []
    },
    severity_score: 6,
    riskAssessment: {
        level: "moderate",
        factors: ["Situational stress (new job)", "Reported hopelessness", "Middle-of-night insomnia"],
        recommendations: ["Monitor hopelessness", "Safety plan discussed and not immediately required", "Follow-up in 14 days"],
        suicidalIdeation: false,
        selfHarm: false,
        substanceUse: false,
        domesticViolence: false,
        psychoticSymptoms: false
    },
    suggestedCPTCodes: [
        { code: "90834", description: "Individual psychotherapy, 45 minutes", rationale: "Standard individual therapy session addressing adjustment issues." }
    ]
};

const MOCK_HINGLISH_DEMO_RESPONSE = {
    soapNote: {
        subjective: "Patient Alex (male) reports increased tension and constant anxiety due to work-related stress ('work ka tension bahut zyada ho gaya hai'). Describes ongoing sleep difficulties and occasional feelings of hopelessness. Denies any self-harm or suicidal ideation ('aise thoughts nahi hain').",
        objective: "Patient presented for session in a state of moderate distress. Speech was a mix of Hindi and English (Hinglish). Oriented to person, place, and time. No acute physical symptoms noted during the encounter.",
        assessment: "Generalized anxiety symptoms exacerbated by occupational stress. Clinical hopelessness noted, though safety risk remains low-to-moderate with negative screening for self-harm.",
        plan: "1. Introduce CBT techniques for occupational stress management. 2. Monitor sleep patterns. 3. Follow-up session in 1 week to continue cognitive reframing."
    },
    roleAnalysis: {
        speaker0Role: "Doctor",
        speaker1Role: "Patient",
        reasoning: "Speaker 0 uses 'Namaste' and asks clinical screening questions about symptoms and safety. Speaker 1 responds with symptom history and personal distress.",
        confidenceScore: 0.99
    },
    entities: {
        symptoms: ["Work Tension", "Anxiety", "Insomnia (Neend nahi aati)", "Hopelessness"],
        medications: [],
        diagnoses: ["Occupational Stress", "Anxiety Disorder (Rule out)"],
        testsOrdered: []
    },
    severity_score: 5,
    riskAssessment: {
        level: "moderate",
        factors: ["Occupational burnout", "Reported hopelessness", "Sleep disturbance"],
        recommendations: ["Safety planning if hopelessness increases", "CBT interventions", "Weekly follow-up"],
        suicidalIdeation: false,
        selfHarm: false,
        substanceUse: false,
        domesticViolence: false,
        psychoticSymptoms: false
    },
    suggestedCPTCodes: [
        { code: "90832", description: "Psychotherapy, 30 minutes", rationale: "Focused session addressing acute occupational stress." }
    ]
};

export async function generateClinicalNote(transcript: string, format: NoteFormat = 'ips', modality: TherapyModality = 'none') {
    if (!transcript || transcript.length < 10) {
        return { error: 'Transcript is too short to generate a note.' };
    }

    // Demo / Simulation Mode Fallback
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        const isHinglish = /[\u0900-\u097F]/.test(transcript) || transcript.includes('Namaste');
        console.log(`[generateClinicalNote] Using Demo Fallback (Missing API Key, Hinglish: ${isHinglish})`);

        return {
            success: true,
            data: isHinglish ? MOCK_HINGLISH_DEMO_RESPONSE : MOCK_DEMO_RESPONSE,
            format: 'soap',
            model: 'gpt-4o-mini-demo',
            costEstimate: {
                asrCost: 0,
                llmCost: 0,
                totalCost: 0,
                breakdown: "DEMO MODE â€” No API charges incurred"
            }
        };
    }

    try {
        const systemPrompt = composePrompt(format, modality);
        // Strategic Analysis: Use GPT-4o Mini for note generation
        const modelSpec = getModelForTask('noteGeneration');

        const completion = await openai.chat.completions.create({
            model: modelSpec.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `TRANSCRIPT:\n\n${transcript}` },
            ],
            response_format: { type: 'json_object' },
            temperature: modelSpec.temperature,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const parsedData = JSON.parse(content);

        // Run HF Risk Validation if possible
        if (parsedData.riskAssessment || parsedData.risk_assessment) {
            const riskData = parsedData.riskAssessment || parsedData.risk_assessment;
            const hfValidation = await runHFRiskValidation(transcript, riskData.severity_score || riskData.level_score || 5);
            
            if (hfValidation.warningMessage || hfValidation.suicidalityFlag) {
                const targetKey = parsedData.riskAssessment ? 'riskAssessment' : 'risk_assessment';
                parsedData[targetKey] = {
                    ...parsedData[targetKey],
                    hfValidationWarning: hfValidation.warningMessage,
                    hfSuicidalityFlag: hfValidation.suicidalityFlag,
                    hfSeverity: hfValidation.hfSeverity
                };
            }
        }

        // Calculate session cost estimate
        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const costEstimate = estimateSessionCost({
            durationMinutes: 0, // ASR cost tracked separately
            inputTokens,
            outputTokens,
            model: modelSpec.model,
        });

        return { success: true, data: parsedData, format, model: modelSpec.model, costEstimate };

    } catch (error) {
        console.error('OpenAI Generation Error:', error);
        return { error: `Failed to generate note: ${(error instanceof Error ? error.message : String(error)) || error}. Ensure your OPENAI_API_KEY is valid.` };
    }
}

// â”€â”€ GPT-4o Risk Assessment (Safety-Critical) â”€â”€
// Strategic Analysis: Always use best model for risk detection

export async function generateRiskAssessment(transcript: string) {
    if (!transcript || transcript.length < 10) {
        return { error: 'Transcript is too short for risk assessment.' };
    }

    // Demo / Simulation Mode Fallback
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        const isHinglish = /[\u0900-\u097F]/.test(transcript) || transcript.includes('Namaste');
        console.log(`[generateRiskAssessment] Using Demo Fallback (Missing API Key, Hinglish: ${isHinglish})`);

        if (isHinglish) {
            return {
                success: true,
                data: {
                    ...MOCK_HINGLISH_DEMO_RESPONSE.riskAssessment,
                    cssrsLevel: 1,
                    cssrsLabel: "Wish to be dead",
                    overallRiskLevel: "moderate",
                    crisisResources: [
                        { name: 'Vandrevala Foundation', contact: '1860-2662-345', region: 'India' },
                        { name: 'iCall (TISS)', contact: '9152987821', region: 'India' }
                    ]
                },
                model: 'gpt-4o-demo'
            };
        }

        return {
            success: true,
            data: {
                cssrsLevel: 1,
                cssrsLabel: "Wish to be dead",
                overallRiskLevel: "moderate",
                factors: ["Expressed hopelessness", "Career-related situational stress", "Insomnia"],
                recommendations: ["Monitor hopelessness closely", "Encourage mindfulness", "Follow-up in 2 weeks"],
                domains: {
                    suicidalIdeation: false,
                    selfHarm: false,
                    substanceUse: false,
                    domesticViolence: false,
                    psychoticSymptoms: false,
                    disorderedEating: false,
                    hopelessness: true
                },
                crisisResources: [
                    { name: 'Vandrevala Foundation', contact: '1860-2662-345', region: 'India' },
                    { name: 'iCall (TISS)', contact: '9152987821', region: 'India' }
                ]
            },
            model: 'gpt-4o-demo'
        };
    }

    try {
        const modelSpec = getModelForTask('riskDetection');

        const completion = await openai.chat.completions.create({
            model: modelSpec.model,
            messages: [
                {
                    role: 'system',
                    content: `You are a clinical risk detection system. Analyze the therapy session transcript for safety concerns.

Map your assessment to the Columbia Suicide Severity Rating Scale (C-SSRS):
- Level 0: No risk identified
- Level 1: Wish to be dead ("I wish I wasn't here")
- Level 2: Non-specific active suicidal thoughts ("I want to kill myself" without plan)
- Level 3: Active suicidal ideation with method but no intent
- Level 4: Active suicidal ideation with some intent, no specific plan
- Level 5: Active suicidal ideation with specific plan and intent
- Level 6: Actual attempt or preparatory behavior

Also assess for: self-harm, domestic violence/abuse, substance crisis, psychotic symptoms, disordered eating, and hopelessness.

Return JSON:
{
  "cssrsLevel": <0-6>,
  "cssrsLabel": "<label for the level>",
  "overallRiskLevel": "none" | "low" | "moderate" | "high" | "critical",
  "factors": ["<specific risk factors observed>"],
  "recommendations": ["<clinical recommendations>"],
  "domains": {
    "suicidalIdeation": false,
    "selfHarm": false,
    "substanceUse": false,
    "domesticViolence": false,
    "psychoticSymptoms": false,
    "disorderedEating": false,
    "hopelessness": false
  },
  "crisisResources": [
    { "name": "<resource name>", "contact": "<phone/url>", "region": "India" | "US" | "UK" }
  ]
}`,
                },
                { role: 'user', content: `TRANSCRIPT:\n\n${transcript}` },
            ],
            response_format: { type: 'json_object' },
            temperature: modelSpec.temperature,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content received from OpenAI');

        const riskData = JSON.parse(content);

        // Ensure crisis resources always include India helplines
        const indiaResources = [
            { name: 'Vandrevala Foundation', contact: '1860-2662-345', region: 'India' },
            { name: 'iCall (TISS)', contact: '9152987821', region: 'India' },
            { name: 'NIMHANS Helpline', contact: '080-46110007', region: 'India' },
        ];
        riskData.crisisResources = [
            ...indiaResources,
            ...(riskData.crisisResources || []).filter((r: any) => r.region !== 'India'),
        ];

        return { success: true, data: riskData, model: modelSpec.model };

    } catch (error) {
        console.error('Risk Assessment Error:', error);
        return { error: `Failed to generate risk assessment: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// Save session to Supabase
// Strategic Analysis: Supports ephemeral mode â€” save note but null out transcript
export async function saveSession(data: {
    transcript: string;
    soapNote: any;
    entities: any;
    roleAnalysis: any;
    riskAssessment?: any;
    noteFormat?: string;
    patientId?: string;
    privacyTier?: PrivacyTier;
    sessionFeeInr?: number;
    paymentMode?: string;
}) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Apply privacy tier sanitization
        const tier = data.privacyTier || 'ephemeral';

        // Core session data â€” only fields guaranteed to exist in sessions table
        const sessionData: Record<string, unknown> = {
            transcript: data.transcript,
            soap_note: data.soapNote,
            entities: data.entities,
            role_analysis: data.roleAnalysis,
            risk_assessment: data.riskAssessment || null,
            note_format: data.noteFormat || 'soap',
            user_id: user?.id || null,
            patient_id: data.patientId || null,
        };

        // Sanitize based on privacy tier (e.g., null transcript in ephemeral mode)
        const sanitizedData = sanitizeForStorage(sessionData, tier);

        const { data: session, error } = await supabase
            .from('sessions')
            .insert(sanitizedData)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return { error: `Failed to save session: ${(error instanceof Error ? error.message : String(error))}` };
        }

        // Revalidate the dashboard to show updated patient activity
        revalidatePath('/');

        return { success: true, sessionId: session.id };

    } catch (error) {
        console.error('Save Session Error:', error);
        return { error: `Failed to save session: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Patient Management Actions
// =============================================

export async function getPatients(includeDischarged: boolean = false) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch patients for current user, optionally filtering by status
        let query = supabase
            .from('patients')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!includeDischarged) {
            query = query.or('status.eq.active,status.is.null');
        }

        const { data: patients, error } = await query;

        if (error) {
            return { error: `Failed to fetch patients: ${(error instanceof Error ? error.message : String(error))}` };
        }

        // For each patient, get their latest session info
        const patientsWithSessions = await Promise.all(
            (patients || []).map(async (patient) => {
                const { data: latestSession } = await supabase
                    .from('sessions')
                    .select('created_at, soap_note')
                    .eq('patient_id', patient.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...patient,
                    lastSessionDate: latestSession?.created_at || null,
                    lastAssessment: latestSession?.soap_note?.assessment?.slice(0, 100) || null,
                    lastSubjective: latestSession?.soap_note?.subjective?.slice(0, 100) || null,
                };
            })
        );

        // Sort patients by last session date (most recent first)
        const sortedPatients = patientsWithSessions.sort((a, b) => {
            const dateA = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
            const dateB = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
            return dateB - dateA;
        });

        return { success: true, patients: sortedPatients };

    } catch (error) {
        return { error: `Failed to fetch patients: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function createPatient(data: {
    name: string;
    age?: number;
    primaryComplaint?: string;
    // IPS extended intake fields
    gender?: string;
    informantName?: string;
    informantRelationship?: string;
    familyType?: string;
    religion?: string;
    educationLevel?: string;
    occupation?: string;
    incomeBracket?: string;
    referralSource?: string;
    languageUsed?: string;
    translatorInvolved?: boolean;
    consanguinity?: boolean;
    verbatimComplaint?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        console.log('[createPatient] user_id:', user?.id, 'name:', data.name);

        const { data: patient, error } = await supabase
            .from('patients')
            .insert({
                name: data.name,
                age: data.age || null,
                primary_complaint: data.primaryComplaint || null,
                user_id: user?.id || null,
                // IPS extended fields
                gender: data.gender || null,
                informant_name: data.informantName || null,
                informant_relationship: data.informantRelationship || null,
                family_type: data.familyType || null,
                religion: data.religion || null,
                education_level: data.educationLevel || null,
                occupation: data.occupation || null,
                income_bracket: data.incomeBracket || null,
                referral_source: data.referralSource || null,
                language_used: data.languageUsed || null,
                translator_involved: data.translatorInvolved || false,
                consanguinity: data.consanguinity || false,
                verbatim_complaint: data.verbatimComplaint || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[createPatient] Supabase error:', error);
            return { error: `Failed to create patient: ${(error instanceof Error ? error.message : String(error))}` };
        }

        console.log('[createPatient] Success, patient:', patient?.id);

        // Refresh the dashboard roster immediately
        revalidatePath('/');

        return { success: true, patient };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to create patient: ${message}` };
    }
}

// â”€â”€ Patient Discharge / Reactivate â”€â”€

export async function dischargePatient(patientId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('patients')
            .update({ status: 'discharged', discharged_at: new Date().toISOString() })
            .eq('id', patientId)
            .eq('user_id', user?.id);

        if (error) {
            return { error: `Failed to discharge patient: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/');
        revalidatePath('/patients');
        return { success: true, message: 'Patient discharged successfully. Records preserved.' };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to discharge patient: ${message}` };
    }
}

export async function reactivatePatient(patientId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('patients')
            .update({ status: 'active', discharged_at: null })
            .eq('id', patientId)
            .eq('user_id', user?.id);

        if (error) {
            return { error: `Failed to reactivate patient: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/');
        revalidatePath('/patients');
        return { success: true, message: 'Patient reactivated and returned to active roster.' };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to reactivate patient: ${message}` };
    }
}

export async function getPatientById(patientId: string) {
    try {
        const supabase = await createClient();

        const { data: patient, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();

        if (error || !patient) {
            return { error: 'Patient not found' };
        }

        return { success: true, patient };

    } catch (error) {
        return { error: `Failed to fetch patient: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPatientStats(patientId: string) {
    try {
        const supabase = await createClient();

        // Get patient info
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();

        if (patientError || !patient) {
            return { error: 'Patient not found' };
        }

        // Count total sessions
        const { count, error: countError } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId);

        if (countError) {
            return { error: `Failed to get session count: ${countError.message}` };
        }

        // Get latest session for diagnosis info
        const { data: latestSession } = await supabase
            .from('sessions')
            .select('soap_note, created_at')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            success: true,
            patient,
            sessionCount: count || 0,
            latestDiagnosis: latestSession?.soap_note?.assessment || null,
            lastSessionDate: latestSession?.created_at || null,
        };

    } catch (error) {
        return { error: `Failed to get patient stats: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getDashboardStats() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Total patients
        const { count: totalPatients } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);

        // Sessions today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: sessionsToday } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .gte('created_at', today.toISOString());

        // Pending Superbills
        const { count: pendingSuperbills } = await supabase
            .from('superbills')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .eq('status', 'draft');

        // Upcoming Appointments (today onwards)
        const { data: upcomingAppointments } = await supabase
            .from('appointments')
            .select('*, patients(name)')
            .eq('user_id', user?.id)
            .gte('requested_time', today.toISOString())
            .order('requested_time', { ascending: true })
            .limit(3);

        // Recent High Risk Alerts (last 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { count: recentRiskAlerts } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .gte('created_at', lastWeek.toISOString())
            .or('risk_assessment->>level.eq.high,risk_assessment->>level.eq.critical');

        return {
            success: true,
            totalPatients: totalPatients || 0,
            sessionsToday: sessionsToday || 0,
            pendingSuperbills: pendingSuperbills || 0,
            upcomingAppointments: (upcomingAppointments || []) as any[],
            recentRiskAlerts: recentRiskAlerts || 0,
        };

    } catch (error) {
        return { error: `Failed to get dashboard stats: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPatientSessions(patientId: string) {
    try {
        const supabase = await createClient();

        // Fetch sessions and join with superbills to get billing status/fee
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                id, 
                created_at, 
                soap_note, 
                entities, 
                role_analysis,
                risk_assessment,
                note_format,
                superbills (
                    status,
                    total_fee
                )
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            return { error: `Failed to fetch sessions: ${(error instanceof Error ? error.message : String(error))}` };
        }

        // Map superbills to single objects (since it's a 1:1 or 1:0 relationship typically)
        const sessionsWithBilling = (sessions || []).map(session => ({
            ...session,
            billing: session.superbills && session.superbills.length > 0 ? session.superbills[0] : null
        }));

        return { success: true, sessions: sessionsWithBilling };

    } catch (error) {
        return { error: `Failed to fetch sessions: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Appointment Management Actions
// =============================================

export async function getAppointments() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', user?.id)
            .order('requested_time', { ascending: true });

        if (error) {
            return { error: `Failed to fetch appointments: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, appointments: appointments || [] };

    } catch (error) {
        return { error: `Failed to fetch appointments: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function updateAppointmentStatus(id: string, status: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);

        if (error) {
            return { error: `Failed to update appointment: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/appointments');
        revalidatePath('/');

        return { success: true };

    } catch (error) {
        return { error: `Failed to update appointment: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPendingCount() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', user?.id)
            .eq('status', 'pending');

        if (error) {
            return { error: `Failed to get pending count: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, count: count || 0 };

    } catch (error) {
        return { error: `Failed to get pending count: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function createAppointment(data: {
    patientName: string;
    patientId?: string;
    requestedTime: string;
    reason?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        console.log('[createAppointment] user_id:', user?.id, 'name:', data.patientName, 'time:', data.requestedTime);

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                doctor_id: user?.id || null,
                patient_id: data.patientId || null,
                patient_name: data.patientName,
                requested_time: data.requestedTime,
                reason: data.reason || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('[createAppointment] Supabase error:', error);
            return { error: `Failed to create appointment: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/appointments');
        return { success: true, appointment };

    } catch (error) {
        return { error: `Failed to create appointment: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Outcome Intelligence Actions (PHQ-9 / GAD-7)
// =============================================

export async function saveAssessment(data: {
    patientId: string;
    instrument: InstrumentType;
    itemScores: number[];
    totalScore: number;
    severityLabel: string;
    sessionId?: string;
    subscaleScores?: { name: string; rawScore: number; doubled: number; severity: string }[];
}) {
    try {
        // Validate instrument-specific item count
        const ITEM_COUNTS: Record<InstrumentType, number> = {
            'PHQ-9': 9, 'GAD-7': 7, 'DASS-21': 21, 'CORE-10': 10, 'ORS': 4, 'SRS': 4,
        };
        const expectedItems = ITEM_COUNTS[data.instrument] || 0;
        if (data.itemScores.length !== expectedItems) {
            return { error: `${data.instrument} requires exactly ${expectedItems} item scores.` };
        }

        // Validate max item scores per instrument
        const MAX_ITEM: Record<InstrumentType, number> = {
            'PHQ-9': 3, 'GAD-7': 3, 'DASS-21': 3, 'CORE-10': 4, 'ORS': 10, 'SRS': 10,
        };
        const maxItem = MAX_ITEM[data.instrument] || 3;
        if (data.itemScores.some(s => s < 0 || s > maxItem)) {
            return { error: `Each item score must be between 0 and ${maxItem}.` };
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { data: assessment, error } = await supabase
            .from('outcome_assessments')
            .insert({
                patient_id: data.patientId,
                user_id: user?.id || null,
                instrument: data.instrument,
                item_scores: data.itemScores,
                total_score: data.totalScore,
                severity_label: data.severityLabel,
                session_id: data.sessionId || null,
                subscale_scores: data.subscaleScores || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[saveAssessment] Supabase error:', error);
            return { error: `Failed to save assessment: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath(`/patients/${data.patientId}`);
        return { success: true, assessment };

    } catch (error) {
        return { error: `Failed to save assessment: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPatientAssessments(patientId: string) {
    try {
        const supabase = await createClient();

        const { data: assessments, error } = await supabase
            .from('outcome_assessments')
            .select('id, instrument, item_scores, total_score, severity_label, administered_at')
            .eq('patient_id', patientId)
            .order('administered_at', { ascending: false });

        if (error) {
            return { error: `Failed to fetch assessments: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, assessments: assessments || [] };

    } catch (error) {
        return { error: `Failed to fetch assessments: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// â”€â”€ Superbill Actions â”€â”€

export async function saveSuperbill(data: {
    patientId?: string;
    sessionId?: string;
    cptCodes: { code: string; description: string; fee: number }[];
    icd10Codes: { code: string; description: string }[];
    providerName?: string;
    providerNpi?: string;
    sessionDurationMinutes?: number;
    totalFee: number;
    status?: string;
    serviceDate?: string;
    insuranceName?: string;
    insuranceId?: string;
    notes?: string;
}) {
    try {
        const supabase = await createClient();

        const { error } = await supabase.from('superbills').insert({
            patient_id: data.patientId || null,
            session_id: data.sessionId || null,
            cpt_codes: data.cptCodes,
            icd_10_codes: data.icd10Codes,
            provider_name: data.providerName || null,
            provider_npi: data.providerNpi || null,
            session_duration_minutes: data.sessionDurationMinutes || null,
            total_fee: data.totalFee,
            status: data.status || 'draft',
            service_date: data.serviceDate || new Date().toISOString().split('T')[0],
            insurance_name: data.insuranceName || null,
            insurance_id: data.insuranceId || null,
            notes: data.notes || null,
        });

        if (error) {
            return { error: `Failed to save superbill: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/patients');
        return { success: true };

    } catch (error) {
        return { error: `Failed to save superbill: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPatientSuperbills(patientId: string) {
    try {
        const supabase = await createClient();

        const { data: superbills, error } = await supabase
            .from('superbills')
            .select('*')
            .eq('patient_id', patientId)
            .order('service_date', { ascending: false });

        if (error) {
            return { error: `Failed to fetch superbills: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, superbills: superbills || [] };

    } catch (error) {
        return { error: `Failed to fetch superbills: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// Get all superbills for billing dashboard
export async function getAllSuperbills() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { data: superbills, error } = await supabase
            .from('superbills')
            .select(`
                *,
                patients:patient_id (name)
            `)
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { error: `Failed to fetch superbills: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, superbills: superbills || [] };

    } catch (error) {
        return { error: `Failed to fetch superbills: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// Finalize a superbill (lock for audit)
export async function finalizeSuperbill(superbillId: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('superbills')
            .update({
                status: 'Finalized',
                updated_at: new Date().toISOString(),
            })
            .eq('id', superbillId);

        if (error) {
            return { error: `Failed to finalize superbill: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/dashboard/billing');
        return { success: true };

    } catch (error) {
        return { error: `Failed to finalize: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// Update superbill status
export async function updateSuperbillStatus(superbillId: string, status: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('superbills')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', superbillId);

        if (error) {
            return { error: `Failed to update status: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/dashboard/billing');
        return { success: true };

    } catch (error) {
        return { error: `Failed to update status: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// Batch update superbill statuses
export async function batchUpdateSuperbillStatus(ids: string[], status: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('superbills')
            .update({ status, updated_at: new Date().toISOString() })
            .in('id', ids);

        if (error) {
            return { error: `Batch update failed: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/dashboard/billing');
        return { success: true, count: ids.length };

    } catch (error) {
        return { error: `Batch update failed: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// DPDP Act Compliance â€” Data Deletion Actions
// Strategic Analysis Dimension 8: "Delete My Data"
// =============================================

/**
 * Delete the raw transcript from a session (post-hoc ephemeral processing).
 * Keeps the clinical note, risk assessment, and entities intact.
 */
export async function deleteSessionTranscript(sessionId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('sessions')
            .update({ transcript: null })
            .eq('id', sessionId)
            .eq('user_id', user?.id);

        if (error) {
            return { error: `Failed to delete transcript: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, message: 'Transcript permanently deleted. Clinical note retained.' };

    } catch (error) {
        return { error: `Failed to delete transcript: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

/**
 * Delete ALL data for a patient â€” DPDP Act "Delete My Data" compliance.
 * Removes: sessions, assessments, superbills, appointments, consents, and patient record.
 */
export async function deleteAllPatientData(patientId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Delete in dependency order (children first)
        // 1. Delete superbills for patient's sessions
        await supabase
            .from('superbills')
            .delete()
            .eq('patient_id', patientId);

        // 2. Delete outcome assessments
        await supabase
            .from('outcome_assessments')
            .delete()
            .eq('patient_id', patientId);

        // 3. Delete appointments
        await supabase
            .from('appointments')
            .delete()
            .eq('patient_id', patientId);

        // 4. Delete sessions
        await supabase
            .from('sessions')
            .delete()
            .eq('patient_id', patientId);

        // 5. Delete patient consents (if table exists)
        await supabase
            .from('patient_consents')
            .delete()
            .eq('patient_id', patientId)
            .then(() => { }, () => { }); // Graceful if table doesn't exist yet

        // 6. Finally delete the patient record itself
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', patientId)
            .eq('user_id', user?.id);

        if (error) {
            return { error: `Failed to delete patient data: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath('/');
        revalidatePath('/patients');
        return { success: true, message: 'All patient data permanently deleted per DPDP Act compliance.' };

    } catch (error) {
        return { error: `Failed to delete patient data: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Session Receipt Actions (â‚¹ Indian Billing)
// =============================================

export async function saveSessionReceipt(data: {
    patientId: string;
    sessionId?: string;
    sessionDate: string;
    durationMinutes: number;
    feeAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    receiptNumber: string;
    therapistName?: string;
    notes?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { data: receipt, error } = await supabase
            .from('session_receipts')
            .insert({
                user_id: user?.id || null,
                patient_id: data.patientId,
                session_id: data.sessionId || null,
                session_date: data.sessionDate,
                duration_minutes: data.durationMinutes,
                fee_amount: data.feeAmount,
                currency: 'INR',
                payment_method: data.paymentMethod,
                payment_status: data.paymentStatus,
                receipt_number: data.receiptNumber,
                therapist_name: data.therapistName || null,
                notes: data.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[saveSessionReceipt] Supabase error:', error);
            return { error: `Failed to save receipt: ${(error instanceof Error ? error.message : String(error))}` };
        }

        revalidatePath(`/patients/${data.patientId}`);
        return { success: true, receipt };

    } catch (error) {
        return { error: `Failed to save receipt: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

export async function getPatientReceipts(patientId: string) {
    try {
        const supabase = await createClient();

        const { data: receipts, error } = await supabase
            .from('session_receipts')
            .select('*')
            .eq('patient_id', patientId)
            .order('session_date', { ascending: false });

        if (error) {
            return { error: `Failed to fetch receipts: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true, receipts: receipts || [] };

    } catch (error) {
        return { error: `Failed to fetch receipts: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Consent Persistence (DPDP Act)
// =============================================

export async function savePatientConsent(data: {
    patientId: string;
    treatment: boolean;
    dataProcessing: boolean;
    recording: boolean;
    aiProcessing: boolean;
    dataSharing: boolean;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('patient_consents')
            .upsert({
                patient_id: data.patientId,
                user_id: user?.id || null,
                treatment: data.treatment,
                data_processing: data.dataProcessing,
                recording: data.recording,
                ai_processing: data.aiProcessing,
                data_sharing: data.dataSharing,
                consent_timestamp: new Date().toISOString(),
                data_retention_years: 7,
            }, {
                onConflict: 'patient_id',
            });

        if (error) {
            console.error('[savePatientConsent] Supabase error:', error);
            // Gracefully handle if table doesn't exist yet
            return { error: `Failed to save consent: ${(error instanceof Error ? error.message : String(error))}` };
        }

        return { success: true };

    } catch (error) {
        return { error: `Failed to save consent: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Shareable Patient Summary
// =============================================

export async function generateShareableSummary(clinicalNote: string, patientName: string) {
    try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a clinical documentation assistant for an Indian therapist.

Generate a SHAREABLE PATIENT SUMMARY from the clinical note below. This summary will be given to the patient or shared with a referring physician.

RULES:
1. Use clear, non-stigmatizing language appropriate for the patient to read
2. REMOVE all private therapeutic process observations, countertransference notes, and risk scoring details
3. KEEP: diagnosis (ICD-10), key findings, treatment plan, medication changes, next appointment info
4. Write in professional but empathetic language
5. Include a brief "What we discussed" section and "Plan going forward" section
6. Keep it concise â€” no more than 300 words
7. Format with clear headings

Output the summary in plain text with section headings.`
                },
                {
                    role: 'user',
                    content: `Patient: ${patientName}\n\nClinical Note:\n${clinicalNote}`
                }
            ],
            max_tokens: 800,
            temperature: 0.3,
        });

        const summary = response.choices[0]?.message?.content || '';

        return { success: true, summary };

    } catch (error) {
        return { error: `Failed to generate summary: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// Supervision & Micro-Skills Analysis
// =============================================

export async function generateSupervisionAnalysis(
    transcript: string,
    roleAnalysis?: { speaker0Role: string; speaker1Role: string }
) {
    if (!transcript || transcript.length < 50) {
        return { error: 'Transcript is too short for supervision analysis.' };
    }

    try {
        const analysis = analyzeSessionMicroSkills(transcript, roleAnalysis);
        return { success: true, data: analysis };
    } catch (error) {
        return { error: `Failed to generate supervision analysis: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}

// =============================================
// MHCA 2017 Compliance Check
// =============================================

export async function runComplianceCheck(
    transcript: string,
    riskData?: any,
    patientAge?: number
) {
    if (!transcript || transcript.length < 10) {
        return { error: 'Transcript is too short for compliance check.' };
    }

    try {
        const complianceResult = checkMHCACompliance(transcript, riskData, patientAge);
        const culturalIdioms = detectCulturalIdioms(transcript);

        return {
            success: true,
            compliance: complianceResult,
            culturalIdioms,
        };
    } catch (error) {
        return { error: `Failed to run compliance check: ${(error instanceof Error ? error.message : String(error)) || error}` };
    }
}
