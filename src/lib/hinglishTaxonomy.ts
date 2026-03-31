// =============================================
// Hinglish Taxonomy & Cultural Competence Engine
// Maps Indian idioms of distress to clinical signals
// Based on NIMHANS research + DSM-5 CCD framework
// =============================================

export interface IdiomOfDistress {
  id: string;
  hindiTerm: string;
  transliteration: string;
  englishTranslation: string;
  somaticPresentation: string;
  westernMapping: string;
  clinicalSignificance: string;
  region: string;
  detectionPatterns: string[]; // keywords/phrases to detect in transcripts
}

export interface DiasporaExplanatoryModel {
  id: string;
  expression: string;
  culturalContext: string;
  clinicalMapping: string;
  dsmCCD: string; // DSM-5 Cultural Concepts of Distress mapping
  detectionPatterns: string[];
}

// ── NIMHANS Idioms of Distress (India) ──

export const INDIAN_IDIOMS_OF_DISTRESS: IdiomOfDistress[] = [
  {
    id: 'ghabrahat',
    hindiTerm: 'घबराहट',
    transliteration: 'Ghabrahat',
    englishTranslation: 'Sudden unease / Panic',
    somaticPresentation: 'Rapid heartbeat, generalized body aches, breathlessness, sudden unease',
    westernMapping: 'Panic Attack / Generalized Anxiety Disorder (GAD)',
    clinicalSignificance: 'Somatic expression of acute anxiety; often the primary way patients describe panic episodes in Hindi-speaking populations',
    region: 'North India / Hindi Belt',
    detectionPatterns: [
      'ghabrahat', 'ghabra', 'घबराहट', 'heartbeat fast', 'dil tez',
      'saans nahi aa rahi', 'breathless', 'body aches', 'suddenly scared',
      'achanak dar', 'panic feel', 'heart racing'
    ],
  },
  {
    id: 'dil_baith_raha',
    hindiTerm: 'दिल बैठ रहा है',
    transliteration: 'Dil baith raha hai',
    englishTranslation: 'Heart is sinking',
    somaticPresentation: 'Sensation of the heart "sinking" or heaviness in the chest; often linked to social failure or loss',
    westernMapping: 'Major Depressive Episode / Severe Stress Response',
    clinicalSignificance: 'A culturally specific expression of despair/depression; heaviness in chest is a somatic proxy for profound sadness and hopelessness',
    region: 'North India / Hindi Belt',
    detectionPatterns: [
      'dil baith', 'dil doob', 'दिल बैठ', 'heart sinking', 'heart heavy',
      'chest heavy', 'seena bhari', 'dil toot', 'heartbreak feel',
      'dil pe bojh', 'weight on heart'
    ],
  },
  {
    id: 'jhum_jhum',
    hindiTerm: 'झुम-झुम',
    transliteration: 'Jhum-Jhum',
    englishTranslation: 'Tingling / Crawling sensation',
    somaticPresentation: 'Tingling, numbness, or "pins and needles" in the extremities',
    westernMapping: 'Somatic Symptom Disorder / Conversion Disorder',
    clinicalSignificance: 'Somatization of psychological distress through peripheral nervous system symptoms; common in patients who lack vocabulary for emotional states',
    region: 'North/Central India',
    detectionPatterns: [
      'jhum jhum', 'jhunjhuni', 'झुम-झुम', 'tingling', 'numbness',
      'pins and needles', 'haath pair sun', 'pair sun ho gaye',
      'sunn pad gaya', 'feeling numb in hands'
    ],
  },
  {
    id: 'dhat_syndrome',
    hindiTerm: 'धात रोग',
    transliteration: 'Dhat Syndrome',
    englishTranslation: 'Semen loss anxiety',
    somaticPresentation: 'Preoccupation with loss of "Dhat" (semen); weakness, fatigue, body aches, sexual dysfunction anxiety',
    westernMapping: 'Anxiety / Depression related to sexual health stigma (DSM-5 CCD)',
    clinicalSignificance: 'A culture-bound syndrome recognized by DSM-5 as a Cultural Concept of Distress; deeply tied to beliefs about vital body fluids and masculinity in South Asian cultures',
    region: 'South Asia (pan-Indian)',
    detectionPatterns: [
      'dhat', 'dhatu', 'धात', 'semen loss', 'weakness from',
      'mardangi', 'virya', 'kamzori', 'nightfall', 'wet dreams worry',
      'loss of vitality', 'energy drain'
    ],
  },
  {
    id: 'sinking_heart',
    hindiTerm: 'डूबता दिल',
    transliteration: 'Sinking Heart',
    englishTranslation: 'Sinking heart (Punjabi model)',
    somaticPresentation: 'Physical sensations in the heart caused by exhaustion or worry',
    westernMapping: 'Stress-induced somatic distress / Adjustment Disorder',
    clinicalSignificance: 'Punjabi cultural model where heart sensations represent accumulated worry and exhaustion; not cardiac but stress-related',
    region: 'Punjab / Punjabi diaspora',
    detectionPatterns: [
      'sinking heart', 'dil doobta', 'heart pain from worry',
      'dil ghab', 'thakan se dil', 'heart tired', 'exhaustion dil',
      'tension se dil', 'heart problem from stress'
    ],
  },
  {
    id: 'somatic_neurosis',
    hindiTerm: 'शारीरिक शिकायतें',
    transliteration: 'Somatic Neurosis',
    englishTranslation: 'Multiple vague body complaints',
    somaticPresentation: 'Multiple vague complaints of aches and pains; common in restrictive social environments',
    westernMapping: 'Somatized Depression / Somatic Symptom Disorder',
    clinicalSignificance: 'Depressive symptoms presenting in somatized form; especially common in women in restrictive environments who cannot express emotional distress directly',
    region: 'Pan-Indian',
    detectionPatterns: [
      'body pain everywhere', 'sab jagah dard', 'aches and pains',
      'weakness everywhere', 'kamzori', 'no energy body hurts',
      'sareer mein dard', 'pain all over', 'heavy body',
      'can\'t get up', 'uth nahi pati'
    ],
  },
];

// ── UK Diaspora Explanatory Models ──

export const DIASPORA_EXPLANATORY_MODELS: DiasporaExplanatoryModel[] = [
  {
    id: 'tension_model',
    expression: 'tension',
    culturalContext: 'South Asian diaspora in UK frequently use "tension" as a catch-all for depressive/anxious states rather than Western psychiatric terms',
    clinicalMapping: 'Major Depressive Disorder / Generalized Anxiety Disorder',
    dsmCCD: 'Cultural idiom replacing direct psychological expression due to stigma',
    detectionPatterns: ['tension ho raha', 'tension', 'bahut tension', 'too much tension', 'family tension'],
  },
  {
    id: 'overthinking_model',
    expression: 'constant overthinking',
    culturalContext: 'Describes ruminative thinking patterns; preferred over terms like "depression" or "obsessive thoughts"',
    clinicalMapping: 'Rumination / Depressive cognition / OCD spectrum',
    dsmCCD: 'Culturally specific expression of ruminative cognitive patterns',
    detectionPatterns: ['overthinking', 'zyada sochna', 'sochte rehna', 'mind won\'t stop', 'dimag nahi rukta'],
  },
  {
    id: 'evil_whispers',
    expression: 'evil whispers / waswasa',
    culturalContext: 'In some South Asian Muslim communities, intrusive thoughts may be attributed to "waswasa" (Satanic whispers) rather than psychiatric symptoms',
    clinicalMapping: 'Intrusive thoughts / OCD / Psychotic features (requires differential)',
    dsmCCD: 'Spiritual/religious explanatory model for intrusive thoughts; requires careful differentiation from psychotic symptoms',
    detectionPatterns: ['evil whispers', 'waswasa', 'shaitaan', 'voices telling', 'bad thoughts coming', 'nazar lag gayi'],
  },
  {
    id: 'family_conflict',
    expression: 'family conflict / izzat',
    culturalContext: 'Distress attributed to family honor (izzat), in-law relationships, or intergenerational conflict; particularly in South Asian women',
    clinicalMapping: 'Adjustment Disorder / Domestic stress / Possible intimate partner issues',
    dsmCCD: 'Psychosocial stressor with cultural significance — honor-based family systems',
    detectionPatterns: ['family problem', 'izzat', 'sasural', 'in-laws', 'gharwale', 'family honor', 'log kya kahenge'],
  },
  {
    id: 'nazar',
    expression: 'nazar / evil eye',
    culturalContext: 'Attribution of mental health symptoms to "nazar" (evil eye) — a belief that jealousy or malicious intent from others can cause illness',
    clinicalMapping: 'Paranoid ideation / Persecutory beliefs (cultural context required)',
    dsmCCD: 'Supernatural explanatory model; requires cultural competence to differentiate from clinical paranoia',
    detectionPatterns: ['nazar lag gayi', 'evil eye', 'someone did something', 'black magic', 'jadoo', 'kisi ne kuch kiya'],
  },
];

// ── Clinical Integration Functions ──

export interface CulturalMapping {
  idiomDetected: string;
  originalExpression: string;
  clinicalMapping: string;
  somaticPresentation?: string;
  culturalContext: string;
  dsmCCDNote: string;
  recommendation: string;
}

/**
 * Analyzes a transcript for Indian idioms of distress and diaspora explanatory models.
 * Returns culturally-informed clinical mappings.
 */
export function detectCulturalIdioms(transcript: string): CulturalMapping[] {
  const results: CulturalMapping[] = [];
  const lowerTranscript = transcript.toLowerCase();

  // Check Indian idioms
  for (const idiom of INDIAN_IDIOMS_OF_DISTRESS) {
    for (const pattern of idiom.detectionPatterns) {
      if (lowerTranscript.includes(pattern.toLowerCase())) {
        results.push({
          idiomDetected: idiom.transliteration,
          originalExpression: pattern,
          clinicalMapping: idiom.westernMapping,
          somaticPresentation: idiom.somaticPresentation,
          culturalContext: idiom.clinicalSignificance,
          dsmCCDNote: `DSM-5 Cultural Concepts of Distress: ${idiom.transliteration} — ${idiom.englishTranslation}`,
          recommendation: `Document under DSM-5 CCD framework. This is a culturally legitimate expression of distress, not a "vague" complaint. Map to: ${idiom.westernMapping}.`,
        });
        break; // One match per idiom is enough
      }
    }
  }

  // Check diaspora models
  for (const model of DIASPORA_EXPLANATORY_MODELS) {
    for (const pattern of model.detectionPatterns) {
      if (lowerTranscript.includes(pattern.toLowerCase())) {
        results.push({
          idiomDetected: model.expression,
          originalExpression: pattern,
          clinicalMapping: model.clinicalMapping,
          culturalContext: model.culturalContext,
          dsmCCDNote: model.dsmCCD,
          recommendation: `Acknowledge the client's cultural explanatory model. Align treatment plan with client's belief system per DSM-5 CCD framework. Clinical mapping: ${model.clinicalMapping}.`,
        });
        break;
      }
    }
  }

  return results;
}

/**
 * Returns prompt instructions for cultural competence injection into system prompts.
 */
export function getCulturalCompetencePromptOverlay(): string {
  return `
### CULTURAL COMPETENCE (India & UK Diaspora Context)

You MUST apply cultural competence when analyzing transcripts from Indian patients or South Asian diaspora clients:

**1. Recognize Idioms of Distress**
Indian patients often express psychological distress through somatic symptoms. Do NOT dismiss these as "vague" — they are culturally legitimate signals:
- "Ghabrahat" (sudden unease, rapid heartbeat) → Possible Panic Attack / GAD
- "Dil baith raha hai" (heart sinking) → Possible Major Depressive Episode
- "Jhum-Jhum" (tingling, numbness) → Possible Somatic Symptom Disorder
- "Dhat Syndrome" (semen loss anxiety) → DSM-5 recognized Cultural Concept of Distress
- "Sinking Heart" (heart pain from worry) → Stress-induced somatic distress
- Multiple vague body complaints → Consider somatized depression

**2. Diaspora Explanatory Models (UK Context)**
South Asian clients in the UK may use:
- "Tension" instead of "depression" or "anxiety"
- "Overthinking" for ruminative cognition
- "Waswasa" / "evil whispers" for intrusive thoughts (cultural vs. psychotic — differentiate carefully)
- "Nazar" / "evil eye" for persecutory beliefs (cultural vs. clinical paranoia)
- "Izzat" / family honor as the primary stressor

**3. Documentation Guidelines**
- Document cultural idioms under the DSM-5 "Cultural Concepts of Distress" (CCD) framework
- Preserve the client's own language alongside clinical translation
- Avoid the "category fallacy" — do not reduce rich local idioms solely to Western disorder categories
- Help the therapist align the treatment plan with the client's belief system

**4. Hinglish Processing**
When the transcript contains Hinglish (Hindi-English mix):
- Recognize Hindi somatic expressions as potential clinical signals
- Translate key terms for the clinical record while preserving the original
- Flag culturally specific expressions with their clinical mapping
`;
}
