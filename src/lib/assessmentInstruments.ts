// =============================================
// Assessment Instruments Library
// PHQ-9, GAD-7, DASS-21, CORE-10, ORS, SRS, PSS-10, UCLA-3
// Strategic Analysis Dimension 1: Expanded instruments
// =============================================

export type InstrumentType = 'PHQ-9' | 'GAD-7' | 'DASS-21' | 'CORE-10' | 'ORS' | 'SRS' | 'PSS-10' | 'UCLA-3';

export interface ResponseOption {
    value: number;
    label: string;
}

export interface SeverityBand {
    min: number;
    max: number;
    label: string;
    color: string;
    action: string;
}

export interface Subscale {
    name: string;
    itemIndices: number[];
    severityBands: SeverityBand[];
}

export interface InstrumentDefinition {
    type: InstrumentType;
    fullName: string;
    description: string;
    items: string[];
    responseOptions: ResponseOption[];
    maxItemScore: number;
    maxTotalScore: number;
    severityBands: SeverityBand[];
    subscales?: Subscale[];
    inputType: 'likert' | 'visual-analog';
    citation: string;
    // Items that need reverse scoring (index-based)
    reverseScoreItems?: number[];
    scoringNote?: string;
}

// ── PHQ-9 ──

export const PHQ9: InstrumentDefinition = {
    type: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    description: 'Standardized measure of depression severity over the past 2 weeks.',
    items: [
        'Little interest or pleasure in doing things',
        'Feeling down, depressed, or hopeless',
        'Trouble falling or staying asleep, or sleeping too much',
        'Feeling tired or having little energy',
        'Poor appetite or overeating',
        'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
        'Trouble concentrating on things, such as reading the newspaper or watching television',
        'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
        'Thoughts that you would be better off dead, or of hurting yourself in some way',
    ],
    responseOptions: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' },
    ],
    maxItemScore: 3,
    maxTotalScore: 27,
    severityBands: [
        { min: 0, max: 4, label: 'Minimal', color: 'emerald', action: 'No treatment needed, continue monitoring' },
        { min: 5, max: 9, label: 'Mild', color: 'yellow', action: 'Watchful waiting; repeat at follow-up' },
        { min: 10, max: 14, label: 'Moderate', color: 'orange', action: 'Treatment plan recommended' },
        { min: 15, max: 19, label: 'Moderately Severe', color: 'red', action: 'Active treatment with therapy and/or medication' },
        { min: 20, max: 27, label: 'Severe', color: 'red', action: 'Immediate treatment; consider specialist referral' },
    ],
    inputType: 'likert',
    citation: 'Kroenke, Spitzer & Williams (2001). J Gen Intern Med.',
};

// ── GAD-7 ──

export const GAD7: InstrumentDefinition = {
    type: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    description: 'Standardized measure of anxiety severity over the past 2 weeks.',
    items: [
        'Feeling nervous, anxious, or on edge',
        'Not being able to stop or control worrying',
        'Worrying too much about different things',
        'Trouble relaxing',
        'Being so restless that it is hard to sit still',
        'Becoming easily annoyed or irritable',
        'Feeling afraid, as if something awful might happen',
    ],
    responseOptions: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' },
    ],
    maxItemScore: 3,
    maxTotalScore: 21,
    severityBands: [
        { min: 0, max: 4, label: 'Minimal', color: 'emerald', action: 'No treatment needed' },
        { min: 5, max: 9, label: 'Mild', color: 'yellow', action: 'Monitor; consider treatment if persistent' },
        { min: 10, max: 14, label: 'Moderate', color: 'orange', action: 'Treatment plan recommended' },
        { min: 15, max: 21, label: 'Severe', color: 'red', action: 'Active treatment; consider specialist referral' },
    ],
    inputType: 'likert',
    citation: 'Spitzer, Kroenke, Williams & Lowe (2006). Arch Intern Med.',
};

// ── DASS-21 ──

export const DASS21: InstrumentDefinition = {
    type: 'DASS-21',
    fullName: 'Depression Anxiety Stress Scale-21',
    description: 'Measures three negative emotional states: depression, anxiety, and stress. Scores are doubled to match the DASS-42 normative data.',
    items: [
        'I found it hard to wind down',
        'I was aware of dryness of my mouth',
        "I couldn't seem to experience any positive feeling at all",
        'I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in absence of physical exertion)',
        'I found it difficult to work up the initiative to do things',
        'I tended to over-react to situations',
        'I experienced trembling (e.g., in the hands)',
        'I felt that I was using a lot of nervous energy',
        'I was worried about situations in which I might panic and make a fool of myself',
        'I felt that I had nothing to look forward to',
        'I found myself getting agitated',
        'I found it difficult to relax',
        'I felt down-hearted and blue',
        'I was intolerant of anything that kept me from getting on with what I was doing',
        'I felt I was close to panic',
        'I was unable to become enthusiastic about anything',
        "I felt I wasn't worth much as a person",
        'I felt that I was rather touchy',
        'I was aware of the action of my heart in the absence of physical exertion',
        'I felt scared without any good reason',
        'I felt that life was meaningless',
    ],
    responseOptions: [
        { value: 0, label: 'Did not apply to me at all' },
        { value: 1, label: 'Applied to me to some degree, or some of the time' },
        { value: 2, label: 'Applied to me to a considerable degree, or a good part of time' },
        { value: 3, label: 'Applied to me very much, or most of the time' },
    ],
    maxItemScore: 3,
    maxTotalScore: 63,
    severityBands: [
        { min: 0, max: 9, label: 'Normal', color: 'emerald', action: 'No clinical concern' },
        { min: 10, max: 13, label: 'Mild', color: 'yellow', action: 'Monitor' },
        { min: 14, max: 20, label: 'Moderate', color: 'orange', action: 'Consider intervention' },
        { min: 21, max: 27, label: 'Severe', color: 'red', action: 'Active intervention recommended' },
        { min: 28, max: 63, label: 'Extremely Severe', color: 'red', action: 'Immediate clinical attention' },
    ],
    subscales: [
        {
            name: 'Depression',
            itemIndices: [2, 4, 9, 12, 15, 16, 20],
            severityBands: [
                { min: 0, max: 9, label: 'Normal', color: 'emerald', action: 'No concern' },
                { min: 10, max: 13, label: 'Mild', color: 'yellow', action: 'Monitor' },
                { min: 14, max: 20, label: 'Moderate', color: 'orange', action: 'Consider treatment' },
                { min: 21, max: 27, label: 'Severe', color: 'red', action: 'Active treatment' },
                { min: 28, max: 42, label: 'Extremely Severe', color: 'red', action: 'Immediate clinical attention' },
            ],
        },
        {
            name: 'Anxiety',
            itemIndices: [1, 3, 6, 8, 14, 18, 19],
            severityBands: [
                { min: 0, max: 7, label: 'Normal', color: 'emerald', action: 'No concern' },
                { min: 8, max: 9, label: 'Mild', color: 'yellow', action: 'Monitor' },
                { min: 10, max: 14, label: 'Moderate', color: 'orange', action: 'Consider treatment' },
                { min: 15, max: 19, label: 'Severe', color: 'red', action: 'Active treatment' },
                { min: 20, max: 42, label: 'Extremely Severe', color: 'red', action: 'Immediate clinical attention' },
            ],
        },
        {
            name: 'Stress',
            itemIndices: [0, 5, 7, 10, 11, 13, 17],
            severityBands: [
                { min: 0, max: 14, label: 'Normal', color: 'emerald', action: 'No concern' },
                { min: 15, max: 18, label: 'Mild', color: 'yellow', action: 'Monitor' },
                { min: 19, max: 25, label: 'Moderate', color: 'orange', action: 'Consider intervention' },
                { min: 26, max: 33, label: 'Severe', color: 'red', action: 'Active intervention' },
                { min: 34, max: 42, label: 'Extremely Severe', color: 'red', action: 'Immediate clinical attention' },
            ],
        },
    ],
    scoringNote: 'Multiply each subscale raw score by 2 to get final score for interpretation',
    inputType: 'likert',
    citation: 'Lovibond & Lovibond (1995). Manual for the DASS.',
};

// ── CORE-10 ──

export const CORE10: InstrumentDefinition = {
    type: 'CORE-10',
    fullName: 'Clinical Outcomes in Routine Evaluation-10',
    description: 'Brief global measure of psychological distress for tracking session-to-session change.',
    items: [
        'I have felt tense, anxious, or nervous',
        'I have felt I have someone to turn to for support when needed',
        'I have felt able to cope when things go wrong',
        'Talking to people has felt too much for me',
        'I have felt panic or terror',
        'I made plans to end my life',
        'I have had difficulty getting to sleep or staying asleep',
        'I have felt despairing or hopeless',
        'I have felt unhappy',
        'Unwanted images or memories have been distressing me',
    ],
    responseOptions: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Only occasionally' },
        { value: 2, label: 'Sometimes' },
        { value: 3, label: 'Often' },
        { value: 4, label: 'Most or all of the time' },
    ],
    maxItemScore: 4,
    maxTotalScore: 40,
    severityBands: [
        { min: 0, max: 5, label: 'Healthy', color: 'emerald', action: 'Non-clinical range' },
        { min: 6, max: 10, label: 'Low', color: 'yellow', action: 'Sub-clinical; monitor' },
        { min: 11, max: 15, label: 'Mild', color: 'yellow', action: 'Mild distress; consider support' },
        { min: 16, max: 20, label: 'Moderate', color: 'orange', action: 'Clinical range; therapy recommended' },
        { min: 21, max: 25, label: 'Moderate-to-Severe', color: 'red', action: 'Active treatment indicated' },
        { min: 26, max: 40, label: 'Severe', color: 'red', action: 'Severe distress; intensive support' },
    ],
    inputType: 'likert',
    citation: 'Connell & Barkham (2007). Eur J Psychother Counselling.',
};

// ── ORS ──

export const ORS: InstrumentDefinition = {
    type: 'ORS',
    fullName: 'Outcome Rating Scale',
    description: 'Ultra-brief 4-item measure of client functioning at session start. Uses visual analog scales (0–10).',
    items: [
        'Individually (Personal well-being)',
        'Interpersonally (Family, close relationships)',
        'Socially (Work, school, friendships)',
        'Overall (General sense of well-being)',
    ],
    responseOptions: [],
    maxItemScore: 10,
    maxTotalScore: 40,
    severityBands: [
        { min: 0, max: 24, label: 'Below Clinical Cutoff', color: 'red', action: 'Client in clinical distress range; treatment warranted' },
        { min: 25, max: 40, label: 'Above Clinical Cutoff', color: 'emerald', action: 'Client functioning in non-clinical range' },
    ],
    inputType: 'visual-analog',
    citation: 'Miller, Duncan, Brown, Sparks & Claud (2003). J Brief Therapy.',
};

// ── SRS ──

export const SRS: InstrumentDefinition = {
    type: 'SRS',
    fullName: 'Session Rating Scale',
    description: 'Ultra-brief 4-item measure of therapeutic alliance at session end. Uses visual analog scales (0–10).',
    items: [
        'Relationship: I felt heard, understood, and respected',
        'Goals and Topics: We worked on and talked about what I wanted to work on and talk about',
        "Approach or Method: The therapist's approach is a good fit for me",
        "Overall: Overall, today's session was right for me",
    ],
    responseOptions: [],
    maxItemScore: 10,
    maxTotalScore: 40,
    severityBands: [
        { min: 0, max: 35, label: 'Alliance Concern', color: 'orange', action: 'Discuss alliance rupture; explore client concerns' },
        { min: 36, max: 40, label: 'Strong Alliance', color: 'emerald', action: 'Therapeutic alliance is strong' },
    ],
    inputType: 'visual-analog',
    citation: 'Duncan, Miller, Sparks, Claud, Reynolds, Brown & Johnson (2003).',
};

// ── PSS-10: Perceived Stress Scale ──

export const PSS10: InstrumentDefinition = {
    type: 'PSS-10',
    fullName: 'Perceived Stress Scale (10-item)',
    description: 'Measures perceived stress over the past month. Assesses feelings of uncontrollability and unpredictability. Items 4, 5, 7, 8 are reverse-scored.',
    items: [
        'In the last month, how often have you been upset because of something that happened unexpectedly?',
        'In the last month, how often have you felt that you were unable to control the important things in your life?',
        'In the last month, how often have you felt nervous and stressed?',
        'In the last month, how often have you felt confident about your ability to handle your personal problems?',
        'In the last month, how often have you felt that things were going your way?',
        'In the last month, how often have you found that you could not cope with all the things that you had to do?',
        'In the last month, how often have you been able to control irritations in your life?',
        'In the last month, how often have you felt that you were on top of things?',
        'In the last month, how often have you been angered because of things that happened that were outside of your control?',
        'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
    ],
    responseOptions: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Almost never' },
        { value: 2, label: 'Sometimes' },
        { value: 3, label: 'Fairly often' },
        { value: 4, label: 'Very often' },
    ],
    // Items at index 3, 4, 6, 7 (0-based) are reverse scored (questions 4,5,7,8)
    reverseScoreItems: [3, 4, 6, 7],
    maxItemScore: 4,
    maxTotalScore: 40,
    severityBands: [
        { min: 0, max: 13, label: 'Low Stress', color: 'emerald', action: 'No clinical concern; maintain healthy coping' },
        { min: 14, max: 26, label: 'Moderate Stress', color: 'orange', action: 'Stress management intervention recommended' },
        { min: 27, max: 40, label: 'High Perceived Stress', color: 'red', action: 'Clinical intervention indicated; assess for burnout/anxiety/depression' },
    ],
    scoringNote: 'Reverse score items 4, 5, 7, 8 (0-based indices 3, 4, 6, 7): 0=4, 1=3, 2=2, 3=1, 4=0',
    inputType: 'likert',
    citation: 'Cohen, Kamarck & Mermelstein (1983). J Health Social Behav.',
};

// ── UCLA Loneliness Scale Version 3 ──

export const UCLA3: InstrumentDefinition = {
    type: 'UCLA-3',
    fullName: 'UCLA Loneliness Scale (Version 3)',
    description: 'Measures subjective feelings of loneliness and social isolation. Items marked with * are reverse scored. Higher scores = greater loneliness.',
    items: [
        'How often do you feel that you are "in tune" with the people around you?',       // *reverse
        'How often do you feel that you lack companionship?',
        'How often do you feel that there is no one you can turn to?',
        'How often do you feel alone?',
        'How often do you feel part of a group of friends?',                              // *reverse
        'How often do you feel that you have a lot in common with the people around you?',// *reverse
        'How often do you feel that you are no longer close to anyone?',
        'How often do you feel that your interests and ideas are not shared by those around you?',
        'How often do you feel outgoing and friendly?',                                   // *reverse
        'How often do you feel close to people?',                                         // *reverse
        'How often do you feel left out?',
        'How often do you feel that your relationships with others are not meaningful?',
        'How often do you feel that no one really knows you well?',
        'How often do you feel isolated from others?',
        'How often do you feel you can find companionship when you want it?',              // *reverse
        'How often do you feel that there are people who really understand you?',         // *reverse
        'How often do you feel shy?',
        'How often do you feel that people are around you but not with you?',
        'How often do you feel that there are people you can talk to?',                   // *reverse
        'How often do you feel that there are people you can turn to?',                   // *reverse
    ],
    reverseScoreItems: [0, 4, 5, 8, 9, 14, 15, 18, 19],
    responseOptions: [
        { value: 1, label: 'Never' },
        { value: 2, label: 'Rarely' },
        { value: 3, label: 'Sometimes' },
        { value: 4, label: 'Often' },
    ],
    maxItemScore: 4,
    maxTotalScore: 80,
    severityBands: [
        { min: 20, max: 34, label: 'Low Loneliness', color: 'emerald', action: 'Adequate social connectedness' },
        { min: 35, max: 49, label: 'Moderate Loneliness', color: 'yellow', action: 'Monitor; social engagement interventions may help' },
        { min: 50, max: 64, label: 'High Loneliness', color: 'orange', action: 'Social skills training and community integration recommended' },
        { min: 65, max: 80, label: 'Severe Loneliness', color: 'red', action: 'Clinical intervention indicated; assess for depression comorbidity' },
    ],
    scoringNote: 'Reverse score items marked with * (indices 0,4,5,8,9,14,15,18,19): 1=4, 2=3, 3=2, 4=1. Score range: 20–80.',
    inputType: 'likert',
    citation: 'Russell, D. (1996). UCLA Loneliness Scale (Version 3). J Personality Assessment.',
};

// ── Registry ──

export const INSTRUMENTS: Record<InstrumentType, InstrumentDefinition> = {
    'PHQ-9': PHQ9,
    'GAD-7': GAD7,
    'DASS-21': DASS21,
    'CORE-10': CORE10,
    'ORS': ORS,
    'SRS': SRS,
    'PSS-10': PSS10,
    'UCLA-3': UCLA3,
};

export const ALL_INSTRUMENT_TYPES: InstrumentType[] = ['PHQ-9', 'GAD-7', 'DASS-21', 'CORE-10', 'ORS', 'SRS', 'PSS-10', 'UCLA-3'];

// ── Scoring Utilities ──

export function computeReverseScore(instrument: InstrumentType, itemIndex: number, rawValue: number): number {
    const def = INSTRUMENTS[instrument];
    if (!def.reverseScoreItems?.includes(itemIndex)) return rawValue;
    const maxVal = def.maxItemScore;
    const minVal = def.responseOptions[0]?.value ?? 0;
    return maxVal + minVal - rawValue;
}

export function computeTotalScore(instrument: InstrumentType, itemScores: number[]): number {
    const def = INSTRUMENTS[instrument];
    return itemScores.reduce((sum, score, idx) => {
        const adjusted = computeReverseScore(instrument, idx, score);
        return sum + (adjusted >= 0 ? adjusted : 0);
    }, 0);
}

export function getSeverityLabel(instrument: InstrumentType, totalScore: number): string {
    const def = INSTRUMENTS[instrument];
    const band = def.severityBands.find(b => totalScore >= b.min && totalScore <= b.max);
    return band?.label || 'Unknown';
}

export function getSeverityColor(instrument: InstrumentType, totalScore: number): string {
    const def = INSTRUMENTS[instrument];
    const band = def.severityBands.find(b => totalScore >= b.min && totalScore <= b.max);
    return band?.color || 'gray';
}

export function getSubscaleScores(
    instrument: InstrumentType,
    itemScores: number[]
): { name: string; rawScore: number; doubled: number; severity: string }[] | null {
    const def = INSTRUMENTS[instrument];
    if (!def.subscales) return null;

    return def.subscales.map(sub => {
        const rawScore = sub.itemIndices.reduce((sum, idx) => sum + (itemScores[idx] || 0), 0);
        const doubled = rawScore * 2; // DASS-21 convention
        const band = sub.severityBands.find(b => doubled >= b.min && doubled <= b.max);
        return {
            name: sub.name,
            rawScore,
            doubled,
            severity: band?.label || 'Unknown',
        };
    });
}
