// =============================================
// CPT Code Database & Auto-Suggestion Engine
// Maps session duration + content â†’ billing codes
// =============================================

export interface CPTCode {
    code: string;
    description: string;
    category: 'evaluation' | 'individual' | 'family' | 'group' | 'crisis' | 'addon';
    durationMinutes?: string;
    typicalFee: number;
}

// â”€â”€ Mental Health CPT Code Database â”€â”€

export const CPT_DATABASE: CPTCode[] = [
    // Evaluation
    { code: '90791', description: 'Psychiatric Diagnostic Evaluation', category: 'evaluation', durationMinutes: '45-60', typicalFee: 250 },
    { code: '90792', description: 'Psychiatric Diagnostic Evaluation with Medical Services', category: 'evaluation', durationMinutes: '45-60', typicalFee: 300 },

    // Individual Therapy
    { code: '90832', description: 'Individual Psychotherapy, 30 minutes', category: 'individual', durationMinutes: '16-37', typicalFee: 100 },
    { code: '90834', description: 'Individual Psychotherapy, 45 minutes', category: 'individual', durationMinutes: '38-52', typicalFee: 150 },
    { code: '90837', description: 'Individual Psychotherapy, 60 minutes', category: 'individual', durationMinutes: '53+', typicalFee: 200 },

    // Family Therapy
    { code: '90847', description: 'Family Psychotherapy, with patient present', category: 'family', durationMinutes: '50', typicalFee: 175 },
    { code: '90846', description: 'Family Psychotherapy, without patient present', category: 'family', durationMinutes: '50', typicalFee: 175 },

    // Group Therapy
    { code: '90853', description: 'Group Psychotherapy', category: 'group', durationMinutes: '45-90', typicalFee: 60 },

    // Crisis
    { code: '90839', description: 'Psychotherapy for Crisis, first 60 minutes', category: 'crisis', durationMinutes: '30-74', typicalFee: 275 },
    { code: '90840', description: 'Psychotherapy for Crisis, each additional 30 minutes', category: 'addon', durationMinutes: '30', typicalFee: 140 },

    // Add-on Codes
    { code: '90785', description: 'Interactive Complexity (add-on)', category: 'addon', typicalFee: 30 },
    { code: '90863', description: 'Pharmacologic Management (add-on)', category: 'addon', typicalFee: 50 },
];

// â”€â”€ Common ICD-10 Codes for Mental Health â”€â”€

export interface ICD10Code {
    code: string;
    description: string;
    category: string;
}

export const ICD10_DATABASE: ICD10Code[] = [
    // Depressive Disorders
    { code: 'F32.0', description: 'Major depressive disorder, single episode, mild', category: 'Depression' },
    { code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', category: 'Depression' },
    { code: 'F32.2', description: 'Major depressive disorder, single episode, severe without psychotic features', category: 'Depression' },
    { code: 'F33.0', description: 'Major depressive disorder, recurrent, mild', category: 'Depression' },
    { code: 'F33.1', description: 'Major depressive disorder, recurrent, moderate', category: 'Depression' },
    { code: 'F34.1', description: 'Dysthymic disorder (Persistent depressive disorder)', category: 'Depression' },

    // Anxiety Disorders
    { code: 'F41.0', description: 'Panic disorder', category: 'Anxiety' },
    { code: 'F41.1', description: 'Generalized anxiety disorder', category: 'Anxiety' },
    { code: 'F40.10', description: 'Social anxiety disorder', category: 'Anxiety' },
    { code: 'F40.00', description: 'Agoraphobia, unspecified', category: 'Anxiety' },

    // Trauma & Stressor-Related
    { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', category: 'Trauma' },
    { code: 'F43.11', description: 'Post-traumatic stress disorder, acute', category: 'Trauma' },
    { code: 'F43.12', description: 'Post-traumatic stress disorder, chronic', category: 'Trauma' },
    { code: 'F43.21', description: 'Adjustment disorder with depressed mood', category: 'Trauma' },
    { code: 'F43.22', description: 'Adjustment disorder with anxiety', category: 'Trauma' },
    { code: 'F43.23', description: 'Adjustment disorder with mixed anxiety and depressed mood', category: 'Trauma' },

    // Bipolar
    { code: 'F31.31', description: 'Bipolar disorder, current episode depressed, mild', category: 'Bipolar' },
    { code: 'F31.81', description: 'Bipolar II disorder', category: 'Bipolar' },

    // OCD
    { code: 'F42.2', description: 'Mixed obsessional thoughts and acts', category: 'OCD' },

    // Substance Use
    { code: 'F10.20', description: 'Alcohol use disorder, moderate', category: 'Substance Use' },
    { code: 'F12.20', description: 'Cannabis use disorder, moderate', category: 'Substance Use' },
    { code: 'F11.20', description: 'Opioid use disorder, moderate', category: 'Substance Use' },

    // Other
    { code: 'F60.3', description: 'Borderline personality disorder', category: 'Personality' },
    { code: 'F50.00', description: 'Anorexia nervosa, unspecified', category: 'Eating Disorders' },
    { code: 'F50.2', description: 'Bulimia nervosa', category: 'Eating Disorders' },
    { code: 'F90.0', description: 'Attention-deficit hyperactivity disorder, predominantly inattentive type', category: 'ADHD' },
    { code: 'F90.1', description: 'Attention-deficit hyperactivity disorder, predominantly hyperactive type', category: 'ADHD' },
    { code: 'Z63.0', description: 'Problems in relationship with spouse or partner', category: 'Relational' },
    { code: 'Z65.9', description: 'Problem related to unspecified psychosocial circumstances', category: 'Other' },
];

// â”€â”€ Auto-Suggestion Engine â”€â”€

export interface CPTSuggestion {
    code: string;
    description: string;
    rationale: string;
    fee: number;
}

/**
 * Suggest CPT codes based on session duration (minutes) and transcript keywords.
 */
export function suggestCPTCodes(durationMinutes: number, transcript: string): CPTSuggestion[] {
    const suggestions: CPTSuggestion[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Crisis detection
    const crisisKeywords = ['suicidal', 'suicide', 'kill myself', 'end my life', 'crisis', 'emergency', 'danger to self', 'danger to others', 'hospitalization'];
    const hasCrisis = crisisKeywords.some((kw) => lowerTranscript.includes(kw));

    if (hasCrisis) {
        suggestions.push({
            code: '90839',
            description: 'Psychotherapy for Crisis, first 60 minutes',
            rationale: 'Crisis content detected in session transcript',
            fee: 275,
        });
        if (durationMinutes > 74) {
            suggestions.push({
                code: '90840',
                description: 'Psychotherapy for Crisis, each additional 30 minutes',
                rationale: 'Session exceeded 74 minutes with crisis content',
                fee: 140,
            });
        }
        return suggestions;
    }

    // Family therapy detection
    const familyKeywords = ['family session', 'family therapy', 'couples therapy', 'couple session', 'partner present', 'spouse', 'family meeting'];
    const isFamily = familyKeywords.some((kw) => lowerTranscript.includes(kw));

    if (isFamily) {
        suggestions.push({
            code: '90847',
            description: 'Family Psychotherapy, with patient present',
            rationale: 'Family/couples content detected in session',
            fee: 175,
        });
        return suggestions;
    }

    // Group detection
    const groupKeywords = ['group session', 'group therapy', 'group members', 'the group'];
    const isGroup = groupKeywords.some((kw) => lowerTranscript.includes(kw));

    if (isGroup) {
        suggestions.push({
            code: '90853',
            description: 'Group Psychotherapy',
            rationale: 'Group therapy content detected',
            fee: 60,
        });
        return suggestions;
    }

    // Initial evaluation detection
    const evalKeywords = ['intake', 'initial evaluation', 'first session', 'diagnostic evaluation', 'initial assessment', 'new patient'];
    const isEval = evalKeywords.some((kw) => lowerTranscript.includes(kw));

    if (isEval) {
        suggestions.push({
            code: '90791',
            description: 'Psychiatric Diagnostic Evaluation',
            rationale: 'Initial evaluation/intake session detected',
            fee: 250,
        });
        return suggestions;
    }

    // Duration-based individual therapy
    if (durationMinutes < 38) {
        suggestions.push({
            code: '90832',
            description: 'Individual Psychotherapy, 30 minutes',
            rationale: `Session duration: ${durationMinutes} minutes (16-37 min range)`,
            fee: 100,
        });
    } else if (durationMinutes < 53) {
        suggestions.push({
            code: '90834',
            description: 'Individual Psychotherapy, 45 minutes',
            rationale: `Session duration: ${durationMinutes} minutes (38-52 min range)`,
            fee: 150,
        });
    } else {
        suggestions.push({
            code: '90837',
            description: 'Individual Psychotherapy, 60 minutes',
            rationale: `Session duration: ${durationMinutes} minutes (53+ min range)`,
            fee: 200,
        });
    }

    // Interactive complexity add-on detection
    const complexityKeywords = ['interpreter', 'language barrier', 'third party', 'mandated reporting', 'custody', 'child protective', 'court ordered'];
    const hasComplexity = complexityKeywords.some((kw) => lowerTranscript.includes(kw));

    if (hasComplexity) {
        suggestions.push({
            code: '90785',
            description: 'Interactive Complexity (add-on)',
            rationale: 'Interactive complexity factors detected (third party, legal, interpreter)',
            fee: 30,
        });
    }

    return suggestions;
}

/**
 * Look up a CPT code from the database.
 */
export function getCPTByCode(code: string): CPTCode | undefined {
    return CPT_DATABASE.find((c) => c.code === code);
}

/**
 * Search ICD-10 codes by keyword.
 */
export function searchICD10(query: string): ICD10Code[] {
    const lower = query.toLowerCase();
    return ICD10_DATABASE.filter(
        (c) => c.code.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower) || c.category.toLowerCase().includes(lower)
    );
}

// â”€â”€ Symptom â†’ ICD-10 Auto-Mapping â”€â”€

const SYMPTOM_ICD10_MAP: Record<string, string[]> = {
    // Depression keywords
    'depression': ['F32.1', 'F33.1'],
    'depressed': ['F32.1', 'F33.1'],
    'hopelessness': ['F32.2', 'F33.1'],
    'low mood': ['F32.0', 'F34.1'],
    'sadness': ['F32.0'],
    'anhedonia': ['F32.1'],
    'fatigue': ['F32.1'],
    'insomnia': ['F32.1'],
    'worthlessness': ['F32.2'],

    // Anxiety keywords
    'anxiety': ['F41.1'],
    'anxious': ['F41.1'],
    'panic': ['F41.0'],
    'panic attack': ['F41.0'],
    'worry': ['F41.1'],
    'social anxiety': ['F40.10'],
    'agoraphobia': ['F40.00'],
    'nervous': ['F41.1'],
    'racing thoughts': ['F41.1'],

    // Trauma keywords
    'ptsd': ['F43.10'],
    'trauma': ['F43.10'],
    'flashback': ['F43.12'],
    'nightmares': ['F43.10'],
    'hypervigilance': ['F43.12'],
    'abuse': ['F43.10'],
    'adjustment': ['F43.23'],

    // Substance Use
    'alcohol': ['F10.20'],
    'drinking': ['F10.20'],
    'substance use': ['F10.20'],
    'cannabis': ['F12.20'],
    'marijuana': ['F12.20'],
    'opioid': ['F11.20'],

    // Other
    'eating disorder': ['F50.00'],
    'binge eating': ['F50.2'],
    'weight loss': ['F50.00'],
    'adhd': ['F90.0'],
    'attention': ['F90.0'],
    'concentration': ['F90.0'],
    'relationship': ['Z63.0'],
    'marriage': ['Z63.0'],
    'obsessive': ['F42.2'],
    'compulsive': ['F42.2'],
    'ocd': ['F42.2'],
    'bipolar': ['F31.81'],
    'mania': ['F31.31'],
    'mood swings': ['F31.81'],
    'borderline': ['F60.3'],
    'self-harm': ['F32.2'],
    'suicidal': ['F32.2'],
};

/**
 * Auto-map extracted symptoms/diagnoses to ICD-10 codes.
 * Accepts the symptoms and diagnoses arrays from AI-extracted entities.
 */
export function mapSymptomsToICD10(symptoms: string[], diagnoses: string[] = []): ICD10Code[] {
    const matched = new Set<string>();
    const allTerms = [...symptoms, ...diagnoses];

    for (const term of allTerms) {
        const lower = term.toLowerCase();
        // Check exact matches first
        for (const [keyword, codes] of Object.entries(SYMPTOM_ICD10_MAP)) {
            if (lower.includes(keyword)) {
                codes.forEach((c) => matched.add(c));
            }
        }
    }

    return ICD10_DATABASE.filter((icd) => matched.has(icd.code));
}

// =============================================
// ICD-10 / CPT Code Validation Engine
// Strategic Analysis: Rule-based validation layer
// to catch LLM-hallucinated or invalid codes
// =============================================

export interface CodeValidationResult {
    code: string;
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low' | 'invalid';
    matchedEntry?: ICD10Code | CPTCode;
    suggestion?: string;
}

/**
 * Validate an ICD-10 code suggested by the LLM against the known mental health registry.
 * - Exact match â†’ high confidence
 * - Valid F-code format but not in registry â†’ low confidence with suggestion
 * - Non-F/Z code â†’ invalid for mental health context
 */
export function validateICD10Code(code: string): CodeValidationResult {
    // Exact match in our database
    const exactMatch = ICD10_DATABASE.find(c => c.code === code);
    if (exactMatch) {
        return { code, isValid: true, confidence: 'high', matchedEntry: exactMatch };
    }

    // Check if it's a valid F-code format (mental health) but not in our specific registry
    const fCodePattern = /^F\d{2}(\.\d{1,2})?$/;
    const zCodePattern = /^Z\d{2}(\.\d{1,2})?$/;

    if (fCodePattern.test(code)) {
        // Valid format but not in our curated list
        const category = code.substring(0, 3);
        const similar = ICD10_DATABASE.filter(c => c.code.startsWith(category));
        const suggestion = similar.length > 0
            ? `Code format valid but not in curated registry. Similar codes: ${similar.map(c => c.code).join(', ')}`
            : `Code format valid (F-code) but not in mental health registry. Verify manually.`;
        return { code, isValid: true, confidence: 'medium', suggestion };
    }

    if (zCodePattern.test(code)) {
        // Z-codes are valid for relational/psychosocial issues
        return { code, isValid: true, confidence: 'medium', suggestion: 'Z-code: psychosocial/relational context. Verify appropriateness.' };
    }

    // Not a mental health code
    return {
        code,
        isValid: false,
        confidence: 'invalid',
        suggestion: 'Code is not a recognized mental health ICD-10 code (F00â€“F99 or Z codes). LLM may have hallucinated this code.',
    };
}

/**
 * Validate a CPT code against the known mental health billing codes.
 */
export function validateCPTCode(code: string): CodeValidationResult {
    const exactMatch = CPT_DATABASE.find(c => c.code === code);
    if (exactMatch) {
        return { code, isValid: true, confidence: 'high', matchedEntry: exactMatch };
    }

    // Check if it's in the psychotherapy range (908xx)
    if (/^908\d{2}$/.test(code)) {
        return {
            code,
            isValid: false,
            confidence: 'low',
            suggestion: `CPT code ${code} is in the psychotherapy range but not in our database. Verify with payer.`,
        };
    }

    return {
        code,
        isValid: false,
        confidence: 'invalid',
        suggestion: `CPT code ${code} not recognized as mental health billing code.`,
    };
}

/**
 * Batch validate all codes from an LLM response.
 * Returns validated codes with confidence scores and flags any issues.
 */
export function validateAllCodes(
    icd10Codes: string[],
    cptCodes: string[]
): {
    icd10Results: CodeValidationResult[];
    cptResults: CodeValidationResult[];
    hasInvalidCodes: boolean;
    summary: string;
} {
    const icd10Results = icd10Codes.map(validateICD10Code);
    const cptResults = cptCodes.map(validateCPTCode);

    const allResults = [...icd10Results, ...cptResults];
    const invalidCount = allResults.filter(r => !r.isValid).length;
    const lowConfCount = allResults.filter(r => r.confidence === 'low' || r.confidence === 'medium').length;

    let summary = `Validated ${allResults.length} codes: `;
    if (invalidCount === 0 && lowConfCount === 0) {
        summary += 'All codes verified âœ“';
    } else {
        const parts: string[] = [];
        if (invalidCount > 0) parts.push(`${invalidCount} invalid`);
        if (lowConfCount > 0) parts.push(`${lowConfCount} need review`);
        summary += parts.join(', ');
    }

    return {
        icd10Results,
        cptResults,
        hasInvalidCodes: invalidCount > 0,
        summary,
    };
}

