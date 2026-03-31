// =============================================
// Therapy Modality Configuration
// Supports CBT, Psychodynamic, Humanistic, and Integrative
// Each modality dynamically adjusts LLM prompt instructions
// =============================================

export type TherapyModality = 'cbt' | 'psychodynamic' | 'humanistic' | 'integrative' | 'none';

export interface ModalityConfig {
  id: TherapyModality;
  name: string;
  shortName: string;
  description: string;
  color: string;
  icon: string; // emoji
  keyMarkers: string[];
  promptOverlay: string;
}

// ── CBT: ABC Model + Cognitive Distortions ──

const CBT_OVERLAY = `
### THERAPY MODALITY: Cognitive Behavioral Therapy (CBT)

The therapist is using a CBT framework. In addition to the standard note, you MUST analyze the session for the following CBT-specific elements:

**1. ABC Model Mapping**
Map the session content to the ABC Model:
- **A (Activating Events)**: Identify specific situations, events, or triggers the client described.
- **B (Beliefs)**: Identify the client's interpretations, automatic thoughts, and core beliefs about those events.
- **C (Consequences)**: Identify the emotional, behavioral, and physiological consequences resulting from those beliefs.

**2. Cognitive Distortion Detection**
Scan the client's language for evidence of cognitive distortions. Flag any of the following with specific quotes:
- All-or-nothing thinking (absolute terms like "always", "never", "completely")
- Catastrophizing ("What if everything falls apart?")
- Overgeneralization ("This always happens to me")
- Mind reading ("They must think I'm stupid")
- Fortune telling ("I know it won't work out")
- Emotional reasoning ("I feel it, so it must be true")
- Should statements ("I should be able to handle this")
- Labeling ("I'm a failure")
- Personalization ("It's all my fault")
- Discounting positives ("That doesn't count")

**3. Downward Arrow Technique**
If the therapist used progressive questioning to uncover deeper beliefs (e.g., "And what would that mean?" → "And if that were true?"), document the chain from surface-level automatic thoughts to deep-seated maladaptive beliefs/core schemas.

**4. Behavioral Experiments & Homework**
Listen for any agreed-upon inter-session tasks, behavioral experiments, thought records, or homework assignments. Auto-populate these in the Plan section.

**5. Golden Thread**
Link today's interventions directly to overarching treatment goals to maintain the "Golden Thread" of treatment continuity.

Return an additional JSON field:
"modalityAnalysis": {
  "framework": "CBT",
  "abcModel": {
    "activatingEvents": ["..."],
    "beliefs": ["..."],
    "consequences": ["..."]
  },
  "cognitiveDistortions": [
    { "type": "...", "evidence": "client quote", "clinicalNote": "..." }
  ],
  "downwardArrow": { "surfaceThought": "...", "coreSchema": "...", "chain": ["..."] },
  "homeworkAssigned": ["..."],
  "treatmentGoalLinks": ["..."]
}`;

// ── Psychodynamic: Defense Mechanisms + DMRS ──

const PSYCHODYNAMIC_OVERLAY = `
### THERAPY MODALITY: Psychodynamic / Psychoanalytic Therapy

The therapist is using a Psychodynamic framework. In addition to the standard note, you MUST analyze the session for the following psychodynamic-specific elements:

**1. Defense Mechanism Rating Scale (DMRS) Analysis**
Identify defense mechanisms the client is deploying and classify them according to the DMRS hierarchy:
- **Level 7 (High-Adaptive/Mature)**: Altruism, Humor, Sublimation, Suppression — indicates resilience
- **Level 6 (Obsessional)**: Isolation of Affect, Intellectualization, Undoing — logic separating feelings from threats
- **Level 5 (Neurotic)**: Repression, Dissociation, Reaction Formation — blocking emotional conflict from awareness
- **Level 4 (Minor Image-Distorting)**: Devaluation, Idealization, Omnipotence — protecting self-esteem
- **Level 3 (Disavowal)**: Denial, Rationalization, Projection — refusing to acknowledge reality
- **Level 2 (Major Image-Distorting)**: Splitting (Self/Other), Projective Identification — distorting reality into polar opposites
- **Level 1 (Action)**: Passive Aggression, Acting Out, Help-Rejecting Complaining — impulsive behavior as tension release

**2. Transference & Countertransference Patterns**
Note any evidence of:
- Client projecting feelings from past relationships onto the therapist
- Patterns in how the client relates to the therapist that mirror other relationships
- Therapeutic implications of these patterns

**3. Unconscious Processes**
Identify moments where the client may be revealing unconscious material through:
- Slips of speech (parapraxes)
- Symbolic language or metaphors
- Resistance patterns (changing subject, arriving late, etc.)
- Dream content if discussed

**4. Supervisory Insight Notes**
Generate private notes for the therapist suggesting areas to explore, e.g.:
"Client is exhibiting Level 6 defense (Intellectualization) when discussing childhood trauma; consider exploring the underlying affect in future sessions."

Return an additional JSON field:
"modalityAnalysis": {
  "framework": "Psychodynamic",
  "defenseMechanisms": [
    { "mechanism": "...", "dmrsLevel": 1-7, "category": "...", "evidence": "client quote", "clinicalNote": "..." }
  ],
  "transferencePatterns": ["..."],
  "unconsciousProcesses": ["..."],
  "supervisoryNotes": ["..."]
}`;

// ── Humanistic: Self-Actualization + Congruence ──

const HUMANISTIC_OVERLAY = `
### THERAPY MODALITY: Humanistic / Person-Centered Therapy

The therapist is using a Humanistic (Person-Centered) framework, pioneered by Carl Rogers. In addition to the standard note, you MUST analyze the session for the following humanistic-specific elements:

**1. Congruence / Incongruence Tracking**
Detect "Incongruence" — the discrepancy between the client's authentic self and their self-concept. Look for:
- Statements where the client's expressed feelings contradict their actions
- External "conditions of worth" driving behavior (e.g., "I should be..." based on others' expectations)
- Movement toward "Congruence" — where the client begins trusting their own feelings and intuitions

**2. Self-Actualization Markers**
Track language markers indicating progress toward self-actualization:
- Shift from externalized conditions of worth to "organismic experiencing" (trusting own intuitions/feelings)
- Increased self-acceptance statements
- Brighter affect compared to previous sessions
- Greater autonomy in decision-making

**3. Core Conditions Assessment**
Evaluate the therapist's use of Rogers' core conditions:
- **Unconditional Positive Regard**: Was the therapist non-judgmental and accepting?
- **Empathic Understanding**: Did the therapist accurately reflect the client's internal frame of reference?
- **Congruence/Genuineness**: Was the therapist authentic in the relationship?

**4. Significant Client Quotes**
Highlight verbatim quotes from the client that demonstrate:
- Increased self-acceptance
- Emotional breakthroughs
- Moments of genuine self-expression
- Shifts in self-concept

**5. Humanistic Documentation Tone**
Ensure notes humanize the client's narrative rather than pathologizing it. Use language that respects the client's autonomy and supports their innate drive toward growth.

Return an additional JSON field:
"modalityAnalysis": {
  "framework": "Humanistic",
  "congruenceTracking": {
    "incongruenceObserved": ["..."],
    "movementTowardCongruence": ["..."],
    "conditionsOfWorth": ["..."]
  },
  "selfActualizationMarkers": ["..."],
  "coreConditionsAssessment": {
    "unconditionalPositiveRegard": "...",
    "empatheticUnderstanding": "...",
    "genuineness": "..."
  },
  "significantQuotes": [
    { "quote": "...", "significance": "..." }
  ]
}`;

// ── Integrative overlay (combines key elements) ──

const INTEGRATIVE_OVERLAY = `
### THERAPY MODALITY: Integrative / Eclectic Approach

The therapist uses an integrative approach, drawing from multiple therapeutic frameworks. Analyze the session for:

1. **Therapeutic Techniques Used**: Identify which modalities the therapist drew from (CBT, psychodynamic, humanistic, DBT, ACT, etc.)
2. **Cognitive Patterns**: Any cognitive distortions or automatic thoughts identified
3. **Relational Dynamics**: Transference, alliance quality, and therapeutic relationship
4. **Growth Indicators**: Self-acceptance, insight, behavioral change
5. **Key Interventions**: Document specific techniques and their theoretical basis

Return an additional JSON field:
"modalityAnalysis": {
  "framework": "Integrative",
  "techniquesUsed": [{ "technique": "...", "modality": "...", "description": "..." }],
  "cognitivePatterns": ["..."],
  "relationalDynamics": ["..."],
  "growthIndicators": ["..."]
}`;

// ── Config Map ──

export const MODALITY_CONFIGS: Record<TherapyModality, ModalityConfig> = {
  cbt: {
    id: 'cbt',
    name: 'Cognitive Behavioral Therapy',
    shortName: 'CBT',
    description: 'ABC Model, cognitive distortions, behavioral experiments',
    color: '#2563EB',
    icon: '🧠',
    keyMarkers: ['Cognitive Distortions', 'ABC Model', 'Homework', 'Thought Records'],
    promptOverlay: CBT_OVERLAY,
  },
  psychodynamic: {
    id: 'psychodynamic',
    name: 'Psychodynamic Therapy',
    shortName: 'Psychodynamic',
    description: 'Defense mechanisms, transference, unconscious processes',
    color: '#7C3AED',
    icon: '🪞',
    keyMarkers: ['Defense Mechanisms', 'Transference', 'DMRS Levels', 'Unconscious'],
    promptOverlay: PSYCHODYNAMIC_OVERLAY,
  },
  humanistic: {
    id: 'humanistic',
    name: 'Humanistic / Person-Centered',
    shortName: 'Humanistic',
    description: 'Self-actualization, congruence, unconditional positive regard',
    color: '#059669',
    icon: '🌱',
    keyMarkers: ['Congruence', 'Self-Actualization', 'Core Conditions', 'Growth'],
    promptOverlay: HUMANISTIC_OVERLAY,
  },
  integrative: {
    id: 'integrative',
    name: 'Integrative / Eclectic',
    shortName: 'Integrative',
    description: 'Drawing from multiple therapeutic frameworks',
    color: '#D97706',
    icon: '🔀',
    keyMarkers: ['Multi-Modal', 'Eclectic', 'Flexible Framework'],
    promptOverlay: INTEGRATIVE_OVERLAY,
  },
  none: {
    id: 'none',
    name: 'Standard (No Modality)',
    shortName: 'Standard',
    description: 'Default clinical documentation without modality-specific analysis',
    color: '#6B7280',
    icon: '📋',
    keyMarkers: [],
    promptOverlay: '',
  },
};

export function getModalityOverlay(modality: TherapyModality): string {
  return MODALITY_CONFIGS[modality]?.promptOverlay || '';
}

export function getModalityConfig(modality: TherapyModality): ModalityConfig {
  return MODALITY_CONFIGS[modality] || MODALITY_CONFIGS.none;
}
