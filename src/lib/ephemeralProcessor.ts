// =============================================
// Ephemeral Processing Architecture
// Strategic Analysis Dimension 7: Privacy-first
// Process audio â†’ generate note â†’ delete transcript
// Aligns with DPDP Act data minimization principles
// =============================================

/**
 * Privacy processing tiers.
 *
 * Tier 1 â€” Ephemeral Full-Session:
 *   Audio â†’ transcribe â†’ generate note â†’ delete audio + transcript
 *   Highest accuracy, recommended default for DPDP compliance
 *
 * Tier 2 â€” Post-Session Voice Memo:
 *   Therapist records recap after session ends â€” no patient audio
 *   Highest privacy, relies on therapist recall
 *
 * Tier 3 â€” Real-Time Risk Only:
 *   Live keyword/sentiment monitoring, store only risk flags
 *   Minimum viable documentation
 */
export type PrivacyTier = 'ephemeral' | 'voice-memo' | 'risk-only';

export interface PrivacyTierConfig {
    tier: PrivacyTier;
    label: string;
    description: string;
    capturesPatientAudio: boolean;
    storesTranscript: boolean;
    storesAudio: boolean;
    generatesFullNote: boolean;
    storesRiskFlags: boolean;
    icon: string; // Lucide icon name
    shortDescription: string;
}

export const PRIVACY_TIERS: Record<PrivacyTier, PrivacyTierConfig> = {
    ephemeral: {
        tier: 'ephemeral',
        label: 'Ephemeral Full-Session',
        description: 'Audio is transcribed in real-time, clinical note is generated, then both audio and transcript are immediately deleted. Highest accuracy.',
        capturesPatientAudio: true,
        storesTranscript: false,
        storesAudio: false,
        generatesFullNote: true,
        storesRiskFlags: true,
        icon: 'ShieldCheck',
        shortDescription: 'Full audio processed live. Nothing stored after session ends.',
    },
    'voice-memo': {
        tier: 'voice-memo',
        label: 'Post-Session Voice Memo',
        description: 'No patient audio is ever captured. After the session, you record a verbal recap that is transcribed and processed. Highest privacy.',
        capturesPatientAudio: false,
        storesTranscript: false,
        storesAudio: false,
        generatesFullNote: true,
        storesRiskFlags: true,
        icon: 'Mic',
        shortDescription: 'Audio uploaded after session. No live processing.',
    },
    'risk-only': {
        tier: 'risk-only',
        label: 'Real-Time Risk Detection Only',
        description: 'Live keyword and sentiment monitoring during the session. Only risk flags are stored â€” no transcript or full notes. Minimum documentation.',
        capturesPatientAudio: true,
        storesTranscript: false,
        storesAudio: false,
        generatesFullNote: false,
        storesRiskFlags: true,
        icon: 'AlertTriangle',
        shortDescription: 'Only risk signals detected. No transcript stored.',
    },
};

/**
 * Determines what data should be persisted based on the selected privacy tier.
 */
export function getStoragePolicy(tier: PrivacyTier) {
    const config = PRIVACY_TIERS[tier];
    return {
        shouldSaveTranscript: config.storesTranscript,
        shouldSaveAudio: config.storesAudio,
        shouldGenerateNote: config.generatesFullNote,
        shouldSaveRiskFlags: config.storesRiskFlags,
    };
}

/**
 * Sanitize session data according to the privacy tier before saving.
 * Returns a copy of the data with restricted fields nulled out.
 * Only nulls fields that already exist in the data â€” never injects new keys.
 */
export function sanitizeForStorage<T extends Record<string, unknown>>(
    data: T,
    tier: PrivacyTier
): T {
    const policy = getStoragePolicy(tier);
    const sanitized = { ...data };

    if (!policy.shouldSaveTranscript) {
        if ('transcript' in sanitized) {
            (sanitized as Record<string, unknown>).transcript = null;
        }
    }

    if (!policy.shouldSaveAudio) {
        if ('audio_url' in sanitized) {
            (sanitized as Record<string, unknown>).audio_url = null;
        }
        if ('audio_blob' in sanitized) {
            (sanitized as Record<string, unknown>).audio_blob = null;
        }
    }

    return sanitized;
}
