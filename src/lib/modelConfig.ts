// =============================================
// Intelligent Model Routing Configuration
// Strategic Analysis: Use GPT-4o Mini for notes (17× cheaper),
// reserve GPT-4o exclusively for safety-critical risk detection
// =============================================

export type ModelTask =
    | 'noteGeneration'
    | 'riskDetection'
    | 'icdCoding'
    | 'summarization'
    | 'phqScoring';

export interface ModelSpec {
    model: string;
    temperature: number;
    description: string;
}

// ── Model routing strategy per strategic analysis ──
export const MODEL_ROUTING: Record<ModelTask, ModelSpec> = {
    noteGeneration: {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        description: 'SOAP/DAP/GIRP note generation — structured output, low complexity',
    },
    riskDetection: {
        model: 'gpt-4o',
        temperature: 0.1,
        description: 'Safety-critical risk detection — always use best model',
    },
    icdCoding: {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        description: 'ICD-10/CPT coding — cascade to gpt-4o on low confidence',
    },
    summarization: {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        description: 'Session summarization — well within Mini capabilities',
    },
    phqScoring: {
        model: 'none',
        temperature: 0,
        description: 'PHQ-9/GAD-7/DASS-21 â€” rule-based, no LLM needed',
    },
};

// ── Pricing per 1M tokens (USD) ──
export const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

// â”€â”€ ASR Configuration â”€â”€
export const ASR_CONFIG = {
    english: {
        provider: 'deepgram',
        model: 'nova-2-medical', // Ready for nova-3-medical upgrade after testing
        language: 'en',
        pricingPerMinute: 0.0077, // Streaming rate
        batchPricingPerMinute: 0.0043,
    },
    // Google Chirp 2 for Indian languages (supports built-in speech translation to English)
    indian: {
        provider: 'google',
        model: 'chirp_2',
        languages: ['hi-IN', 'kn-IN', 'te-IN', 'ta-IN', 'ml-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'bn-IN'],
        pricingPerMinute: 0.016,
        supportsCodeSwitching: true,
        supportsStreaming: true,
        supportsTranslation: true, // Chirp 2 supports translation_config with target_language
        supportsDiarization: true, // Speaker diarization (min 1, max 3)
        supportsSpeechAdaptation: true, // Clinical PhraseSet boosting
        translationTargets: ['en'], // Currently supported translation output
        endpoint: 'speech.googleapis.com',
        dataResidency: 'india',
    },
    // Sarvam AI Saaras v3 for Indian languages
    sarvam: {
        provider: 'sarvam',
        model: 'saaras-v3',
        languages: ['hi', 'kn', 'te', 'ta', 'ml', 'mr', 'bn', 'gu', 'pa'],
        pricingPerMinute: 0.005,
        supportsCodeSwitching: true,
        supportsStreaming: true,
        endpoint: 'wss://api.sarvam.ai/speech-to-text-translate/ws',
        dataResidency: 'india',
    },
};

// ── Clinical Speech Adaptation Glossary ──
// Curated list of therapy/psychology terms for Google STT speech adaptation.
// These are used in the bridge's recognition config to boost accuracy.
export const CLINICAL_SPEECH_PHRASES = [
    // Therapy modalities
    'CBT', 'cognitive behavioral therapy', 'EMDR', 'DBT',
    'dialectical behavior therapy', 'psychodynamic', 'motivational interviewing',
    'exposure therapy', 'cognitive reframing', 'mindfulness based',
    'ACT', 'acceptance and commitment therapy',
    // Medications
    'SSRIs', 'SNRIs', 'benzodiazepines', 'sertraline', 'fluoxetine',
    'escitalopram', 'bupropion', 'venlafaxine', 'duloxetine',
    'alprazolam', 'clonazepam',
    // Diagnostic tools & standards
    'DSM-5', 'PHQ-9', 'GAD-7', 'DASS-21', 'ICD-10', 'CPT code', 'HIPAA',
    // Clinical conditions
    'anxiety', 'depressive', 'major depressive disorder',
    'generalized anxiety disorder', 'PTSD', 'post-traumatic stress disorder',
    'bipolar', 'OCD', 'obsessive compulsive disorder', 'ADHD',
    'panic disorder', 'agoraphobia', 'dissociative',
    'borderline personality disorder',
    // Risk & safety
    'suicidal ideation', 'self-harm', 'safety plan', 'risk assessment',
    'crisis intervention', 'homicidal ideation',
    // Session terminology
    'therapeutic alliance', 'treatment plan', 'psychoeducation',
    'SOAP note', 'DAP note', 'GIRP note', 'presenting problem',
    'affect', 'dysregulation', 'comorbidity',
] as const;

// ── Cost Calculation Utilities ──

export function estimateSessionCost(params: {
    durationMinutes: number;
    inputTokens: number;
    outputTokens: number;
    model: string;
    asrProvider?: 'deepgram' | 'sarvam';
}): {
    asrCost: number;
    llmCost: number;
    totalCost: number;
    breakdown: string;
} {
    const { durationMinutes, inputTokens, outputTokens, model, asrProvider = 'deepgram' } = params;

    // ASR cost
    const asrRate = asrProvider === 'deepgram'
        ? ASR_CONFIG.english.pricingPerMinute
        : ASR_CONFIG.indian.pricingPerMinute;
    const asrCost = durationMinutes * asrRate;

    // LLM cost
    const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4o-mini'];
    const llmCost = (inputTokens / 1_000_000) * pricing.input
        + (outputTokens / 1_000_000) * pricing.output;

    const totalCost = asrCost + llmCost;

    return {
        asrCost: Math.round(asrCost * 10000) / 10000,
        llmCost: Math.round(llmCost * 10000) / 10000,
        totalCost: Math.round(totalCost * 10000) / 10000,
        breakdown: `ASR: $${asrCost.toFixed(4)} (${durationMinutes}min × $${asrRate}/min) | LLM: $${llmCost.toFixed(4)} (${model})`,
    };
}

/**
 * Get the model config for a given task.
 * Provides a single entry point for all model routing decisions.
 */
export function getModelForTask(task: ModelTask): ModelSpec {
    return MODEL_ROUTING[task];
}
