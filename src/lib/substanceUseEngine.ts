// =============================================
// Substance Use Engine — NIMHANS Tobacco Cessation Protocols
// Source: NIMHANS TCC Manual 2009 + WHO FCTC Guidelines
// Covers: Tobacco (smoke/smokeless), Alcohol, Comorbidity
// =============================================

export interface TobaccoAssessment {
    type: 'cigarette' | 'beedi' | 'gutka' | 'khaini' | 'snuff' | 'alcohol' | 'other';
    unitsPerDay: number;
    yearsOfUse: number;
    fagerströmScore?: number; // Nicotine dependence severity
    readinessToQuit: 'not ready' | 'thinking about it' | 'ready to quit';
    previousAttempts: number;
    longestQuitDuration?: string;
    triggers: string[]; // tea, stress, after meals, social situations
    withdrawalSymptoms: string[];
}

// ── NIMHANS 5A's Framework ──
// Source: US PHS Guidelines adapted for India

export const FIVE_AS_FRAMEWORK = {
    ask: {
        title: 'Ask',
        action: 'Screen every patient for tobacco and substance use',
        questions: [
            'Do you use any form of tobacco?',
            'How much do you smoke/use per day?',
            'Do you drink alcohol? How often and how much?',
            'Do you use any other substances?',
        ],
        nimhansNote: 'Ask at every clinical contact. Integrate into IPS history-taking.',
    },
    advise: {
        title: 'Advise',
        action: 'Give clear, strong, personalized advice to quit',
        examples: [
            'Your anxiety will improve significantly within 2-4 weeks of quitting',
            'Tobacco is worsening your sleep and increasing your depression risk',
            'Nicotine withdrawal mimics anxiety — quitting can reduce what we\'re treating',
        ],
        nimhansNote: 'Link tobacco use to presenting complaints. Make it personally relevant.',
    },
    assess: {
        title: 'Assess',
        action: 'Assess willingness and readiness to quit',
        questions: [
            'Would you like to quit smoking/chewing in the next 30 days?',
            'Have you tried to quit before? What happened?',
            'What is the main thing stopping you from quitting?',
        ],
        stages: ['Pre-contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'],
    },
    assist: {
        title: 'Assist',
        action: 'Provide treatment — behavioral + pharmacological',
        behavioral: [
            'Habit diary — record time, place, mood, activity with each use',
            '4 D\'s: Delay, Distract, Deep breathe, Drink water',
            'Trigger identification and avoidance planning',
            'Set a quit date within the next 2 weeks',
        ],
        pharmacological: 'See NRT/pharmacotherapy section below',
    },
    arrange: {
        title: 'Arrange',
        action: 'Schedule follow-up to prevent relapse',
        timeline: '1 week → 2 weeks → 1 month → 3 months → 6 months → 1 year',
        options: [
            'In-person follow-up (preferred)',
            'Telephonic check-in',
            'India Tobacco Quitline: 1800-112-356 (toll-free)',
        ],
    },
};

// ── Nicotine Withdrawal Checklist ──
// Source: NIMHANS Manual Chapter 1 + DSM-5

export const NICOTINE_WITHDRAWAL_SYMPTOMS = [
    { symptom: 'Dysphoric or depressed mood', mapsToDSM: 'F17.203', severity: 'high' },
    { symptom: 'Insomnia', mapsToDSM: 'F17.203', severity: 'moderate' },
    { symptom: 'Irritability, frustration, or anger', mapsToDSM: 'F17.203', severity: 'high' },
    { symptom: 'Anxiety', mapsToDSM: 'F17.203', severity: 'high' },
    { symptom: 'Difficulty concentrating', mapsToDSM: 'F17.203', severity: 'moderate' },
    { symptom: 'Restlessness', mapsToDSM: 'F17.203', severity: 'moderate' },
    { symptom: 'Decreased heart rate', mapsToDSM: 'F17.203', severity: 'low' },
    { symptom: 'Increased appetite or weight gain', mapsToDSM: 'F17.203', severity: 'moderate' },
];

// ── CLINICAL SIGNIFICANCE FOR PSYCHIATRY ──
// Why tobacco matters in mental health treatment

export const TOBACCO_MENTAL_HEALTH_INTERACTIONS = {
    depression: {
        link: 'Nicotine withdrawal mimics depression. Quitting tobacco can improve antidepressant efficacy.',
        clinicalNote: 'Do not attribute low mood entirely to MDD without ruling out nicotine withdrawal effects.',
        action: 'Assess tobacco use before adjusting antidepressant dose.',
    },
    anxiety: {
        link: 'Nicotine stimulates CNS → increases baseline arousal → worsens anxiety disorders.',
        clinicalNote: 'Anxiolytic response to SSRIs may be blunted in active smokers.',
        action: 'Include cessation in anxiety treatment plan. Short-term worsening on quitting is temporary.',
    },
    sleep: {
        link: 'Nicotine disrupts sleep architecture. Withdrawal also causes insomnia acutely.',
        clinicalNote: 'Do not immediately prescribe sleep medication for insomnia — assess tobacco use first.',
        action: 'Address tobacco before prescribing sedatives.',
    },
    psychosis: {
        link: 'Smoking is 3x more prevalent in schizophrenia. Nicotine self-medication theory.',
        clinicalNote: 'Cessation can alter clozapine/olanzapine levels — monitor closely.',
        action: 'Consult psychiatrist before initiating cessation in patients on antipsychotics.',
    },
};

// ── Indian Pharmacotherapy Protocols ──
// Source: NIMHANS Clinical Practice Guidelines + WHO mhGAP

export const TOBACCO_PHARMACOTHERAPY = {
    nrt: {
        name: 'Nicotine Replacement Therapy (NRT)',
        availability: 'Only nicotine gums available in India (2mg, 4mg)',
        brands: ['Nicotex (2mg/4mg)', 'Nicogum', 'Nicorette'],
        dosing: {
            light: '2mg gum — 1 piece when craving (max 15/day)',
            heavy: '4mg gum — 1 piece when craving (max 15/day)',
            technique: 'Chew slowly until taste changes, then park between cheek and gum. Repeat after 5 min. Use for 30-45 min per piece.',
        },
        duration: '12 weeks minimum',
        costINR: '₹4–6 per gum | ₹120–180 per month',
        sideEffects: ['Nausea', 'Jaw soreness', 'Hiccups', 'Burning in stomach'],
        startDate: 'Day of quit date',
    },
    bupropion: {
        name: 'Bupropion Hydrochloride',
        brands: ['Bupron SR', 'Wellbutrin SR', 'Zyban'],
        startTiming: '1-2 weeks BEFORE quit date',
        dosing: 'Day 1-3: 150mg OD → Day 4 onwards: 150mg BD (max 300mg/day)',
        duration: '12 weeks',
        costINR: '₹1,234 for full course',
        contraindications: ['Seizure disorder', 'Eating disorders', 'MAO inhibitor use in past 14 days', 'Bipolar disorder (relative)'],
        sideEffects: ['Insomnia (35-40%)', 'Dry mouth (10%)', 'Agitation', 'Headache'],
        monitoring: 'Monitor for mood changes, suicidal ideation at each visit',
    },
    varenicline: {
        name: 'Varenicline Tartrate (Champix/Chantix)',
        brands: ['Champix'],
        startTiming: '1 week before quit date OR after quitting',
        dosing: 'Day 1-3: 0.5mg OD → Day 4-7: 0.5mg BD → Day 8+: 1mg BD',
        duration: '12 weeks (can extend 12 more weeks if successful)',
        costINR: '₹11,206 for full course (often not covered by insurance)',
        contraindications: ['Pregnancy', 'Severe renal impairment (dose adjustment needed)'],
        sideEffects: ['Nausea (most common)', 'Abnormal dreams', 'Insomnia', 'Headache'],
        monitoring: 'MANDATORY: Monitor for neuropsychiatric symptoms — depression, agitation, behavioral changes, suicidal ideation. Inform patient to stop and contact doctor if these occur.',
        blackBoxWarning: 'FDA/CDSCO black box: neuropsychiatric events. Caution in patients with psychiatric history.',
    },
    nortriptyline: {
        name: 'Nortriptyline (second-line)',
        note: 'Off-label use; less expensive option when bupropion/varenicline not accessible',
        dose: '25-75mg/day',
        availability: 'Widely available in India at low cost',
    },
};

// ── Biological/Habitual/Emotional Addiction Triangle ──
// Source: NIMHANS Manual — the 3 elements of tobacco addiction

export const ADDICTION_TRIANGLE = {
    biological: {
        description: 'Physical nicotine dependence — craving, withdrawal, tolerance',
        intervention: 'NRT or pharmacotherapy to manage withdrawal symptoms',
        clinicalNote: 'Withdrawal begins within hours. Peak at 24-72h. Mostly resolves in 2-4 weeks.',
    },
    habitual: {
        description: 'Conditioned behavioral patterns — smoking with tea, after meals, during stress',
        intervention: 'Habit diary + trigger identification + substitution behaviors (4D\'s)',
        clinicalNote: 'The hardest to break. Requires behavioral intervention even after physical withdrawal resolves.',
    },
    emotional: {
        description: 'Emotion regulation through substance use — stress relief, pleasure, social bonding',
        intervention: 'CBT cognitive reframing + alternative emotion regulation skills + social support',
        clinicalNote: 'Address underlying anxiety/depression. Tobacco is often self-medication.',
    },
};

// ── System Prompt Overlay for Clinical Analysis ──
// Injected when substance use is detected in session

export const TOBACCO_CLINICAL_ANALYSIS_OVERLAY = `
### COMORBID SUBSTANCE USE: TOBACCO/NICOTINE (NIMHANS Protocol)

Tobacco use has been identified in this patient's presentation. Apply the following clinical framework:

**DIFFERENTIAL DIAGNOSIS ADDITIONS — Always consider:**
- F17.2xx Nicotine Dependence (specify: cigarettes/beedi/smokeless tobacco)
- F17.203 Nicotine Withdrawal (if recently quit or reducing)
- Nicotine withdrawal masquerading as new-onset anxiety/depression

**KEY CLINICAL DISTINCTION:**
Nicotine withdrawal symptoms (anxiety, depression, irritability, insomnia, restlessness) are identical to primary psychiatric conditions. Rule out withdrawal BEFORE attributing symptoms to a new psychiatric diagnosis.

**NIMHANS 5A's in Management Plan:**
1. ASK: Document type, quantity, duration of tobacco use in HOPI
2. ADVISE: Link cessation directly to presenting mental health complaint
3. ASSESS: Stage of change (Pre-contemplation/Contemplation/Preparation/Action)
4. ASSIST: Recommend NRT (nicotine gum 2mg/4mg — ₹4-6/gum) OR Bupropion (₹1,234/course) OR Varenicline (₹11,206/course)
5. ARRANGE: Follow-up at 1 week, 2 weeks, 1 month, 3 months

**PHARMACOTHERAPY INTERACTION WARNINGS:**
- Smoking status affects: Clozapine, Olanzapine, Haloperidol, Fluvoxamine, Theophylline levels
- Notify treating psychiatrist before initiating cessation in patients on antipsychotics

**INDIA RESOURCES:**
- National Tobacco Quitline: 1800-112-356 (toll-free, available in Hindi/English)
- NIMHANS Tobacco Cessation Centre: 080-26995274
- Jan Aushadhi NRT: Available at all Pradhan Mantri Bhartiya Jan Aushadhi Kendras
`;

// ── Detection Patterns for Transcript Scanning ──

export const TOBACCO_DETECTION_PATTERNS = [
    /\b(smok(e|ing|ed)|cigarette|beedi|bidi|gutka|khaini|paan masala|snuff|hookah|vape|nicotine)\b/i,
    /\b(tobacco|tambaku|supari|chewing)\b/i,
    /\b(pack a day|packs per day|cigarettes per day|beedis per day)\b/i,
    /\b(trying to quit|want to quit|stopped smoking|quit smoking|gave up smoking)\b/i,
    /\b(after quitting|since I stopped|withdrawal|craving)\b.{0,20}\b(cigarette|smoking|tobacco)\b/i,
];

export function detectTobaccoUse(transcript: string): boolean {
    return TOBACCO_DETECTION_PATTERNS.some(p => p.test(transcript));
}

export function getTobaccoOverlayForAnalysis(): string {
    return TOBACCO_CLINICAL_ANALYSIS_OVERLAY;
}
