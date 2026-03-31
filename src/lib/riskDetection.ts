// =============================================
// Clinical Risk Detection Engine
// Real-time transcript scanning for safety concerns
// Strategic Analysis: C-SSRS mapping for standardized risk levels
// =============================================

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE';

export interface RiskAlert {
    id: string;
    level: RiskLevel;
    category: string;
    matchedPhrase: string;
    originalText: string;
    timestamp: number;
    protocol: SafetyProtocol;
    dismissed: boolean;
    cssrsLevel: number;   // C-SSRS 0–6 mapping
    cssrsLabel: string;   // Human-readable C-SSRS label
}

export interface SafetyProtocol {
    name: string;
    steps: string[];
}

export interface RiskPattern {
    level: RiskLevel;
    category: string;
    patterns: RegExp[];
    protocol: SafetyProtocol;
    cssrsLevel: number;  // C-SSRS level this pattern maps to
}

// ── C-SSRS (Columbia Suicide Severity Rating Scale) ──
// Standardized 7-point scale (0–6) that therapists already understand

export const CSSRS_SCALE: { level: number; label: string; description: string; color: string }[] = [
    { level: 0, label: 'No Risk Identified', description: 'No suicidal ideation or behavior', color: '#10B981' },
    { level: 1, label: 'Wish to Be Dead', description: 'General thoughts of wanting to be dead or not alive, no active plan', color: '#F59E0B' },
    { level: 2, label: 'Non-Specific Active Suicidal Thoughts', description: 'General thoughts of wanting to end life without specific plan/method', color: '#F97316' },
    { level: 3, label: 'Active Ideation with Method (No Intent)', description: 'Thoughts of suicide with consideration of method but no intent to act', color: '#EF4444' },
    { level: 4, label: 'Active Ideation with Some Intent', description: 'Active suicidal ideation with some intent to act, without specific plan', color: '#DC2626' },
    { level: 5, label: 'Active Ideation with Specific Plan', description: 'Thoughts of suicide with specific plan and intent to carry it out', color: '#B91C1C' },
    { level: 6, label: 'Actual Attempt / Preparatory Behavior', description: 'Actual suicide attempt or specific preparatory acts toward attempt', color: '#7F1D1D' },
];

export function getCSSRSLabel(level: number): string {
    return CSSRS_SCALE[level]?.label || 'Unknown';
}

export function getCSSRSColor(level: number): string {
    return CSSRS_SCALE[level]?.color || '#6B7280';
}

// ── Crisis Resources (India + Global) ──
export interface CrisisResource {
    name: string;
    contact: string;
    region: 'India' | 'US' | 'UK' | 'Global';
    description: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
    // India
    { name: 'Vandrevala Foundation', contact: '1860-2662-345', region: 'India', description: '24/7 mental health helpline' },
    { name: 'iCall (TISS)', contact: '9152987821', region: 'India', description: 'Psychosocial helpline by TISS Mumbai' },
    { name: 'NIMHANS Helpline', contact: '080-46110007', region: 'India', description: 'National Institute of Mental Health helpline' },
    { name: 'Kiran Helpline', contact: '1800-599-0019', region: 'India', description: 'Govt. of India 24/7 mental health helpline (toll-free)' },
    // US
    { name: '988 Suicide & Crisis Lifeline', contact: '988', region: 'US', description: '24/7 crisis support' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741', region: 'US', description: 'Text-based crisis support' },
    // UK
    { name: 'Samaritans', contact: '116 123', region: 'UK', description: '24/7 emotional support' },
    { name: 'Crisis Text Line UK', contact: 'Text SHOUT to 85258', region: 'UK', description: 'Text-based crisis support' },
];

// â”€â”€ Clinically-informed keyword patterns â”€â”€
// Organized by severity tier with associated safety protocols

export const RISK_PATTERNS: RiskPattern[] = [
    // â•â•â• CRITICAL: Immediate safety concern â•â•â•
    {
        level: 'CRITICAL',
        category: 'Suicidal Ideation',
        cssrsLevel: 4, // Default to level 4; generateRiskAssessment provides precise mapping
        patterns: [
            /\b(want(s|ed)?|thinking|thought(s)?|plan(ning|ned|s)?)\b.{0,20}\b(to )?(kill|end|die|death|suicide|take my life|my own life)\b/i,
            /\b(better off dead|no reason to live|can'?t go on|don'?t want to (be here|live|exist|wake up))\b/i,
            /\b(suicid(e|al)|kill(ing)? (myself|me))\b/i,
            /\b(end it all|not (be|being) here|disappear forever)\b/i,
            /\b(wrote|writing|have) a (suicide )?note\b/i,
            /\b(have|got|bought|own) a (gun|weapon|pills|rope)\b.{0,30}\b(myself|end|plan)\b/i,
        ],
        protocol: {
            name: 'Columbia-SSRS Screening',
            steps: [
                'Ask directly: "Are you thinking about killing yourself?"',
                'Assess timeframe: "Have you had these thoughts in the past month?"',
                'Assess plan: "Have you thought about how you would do it?"',
                'Assess means: "Do you have access to [method]?"',
                'Assess intent: "Do you intend to act on these thoughts?"',
                'If YES to plan + means → Activate crisis protocol',
                'India: Vandrevala Foundation 1860-2662-345 | Kiran 1800-599-0019',
                'US: 988 Suicide & Crisis Lifeline',
            ],
        },
    },
    {
        level: 'CRITICAL',
        category: 'Active Self-Harm',
        cssrsLevel: 3,
        patterns: [
            /\b(cut(ting)?|burn(ing|ed)?|hurt(ing|ed)?|harm(ing|ed)?|hit(ting)?|punch(ing|ed)?)\b.{0,15}\b(myself|my (arm|leg|wrist|body|skin|self))\b/i,
            /\b(self[- ]?harm|self[- ]?injur(y|e|ing))\b/i,
            /\b(started|been) (cutting|burning|hitting|hurting) (myself|again)\b/i,
        ],
        protocol: {
            name: 'Self-Harm Safety Assessment',
            steps: [
                'Assess recency and frequency of self-harm behavior',
                'Assess medical severity — does the client need immediate wound care?',
                'Identify triggers and emotional antecedents',
                'Review and update safety plan',
                'Consider whether current level of care is sufficient',
            ],
        },
    },

    // â•â•â• HIGH: Significant clinical concern â•â•â•
    {
        level: 'HIGH',
        category: 'Domestic Violence / Abuse',
        cssrsLevel: 0,
        patterns: [
            /\b(hit(s|ting)?|beat(s|ing|en)?|chok(e[sd]?|ing)|slap(s|ped|ping)?|kick(s|ed|ing)?|punch(es|ed|ing)?)\b.{0,15}\bme\b/i,
            /\b(partner|spouse|husband|wife|boyfriend|girlfriend)\b.{0,30}\b(hit|beat|choke|slap|kick|punch|threw|shov)(s|ed|ing|es)?\b/i,
            /\b(afraid|scared|terrified)\b.{0,20}\b(of|around)\b.{0,15}\b(him|her|them|partner|spouse|husband|wife)\b/i,
            /\b(domestic|physical|sexual)\s+(violence|abuse|assault)\b/i,
            /\b(control(s|ling)?|isolat(e[sd]?|ing)|threaten(s|ed|ing)?)\b.{0,20}\bme\b/i,
        ],
        protocol: {
            name: 'Domestic Violence Safety Plan',
            steps: [
                'Assess immediate safety: "Are you safe right now?"',
                'Determine if client can speak freely (partner may be present)',
                'India: Women Helpline 181 | NCW Helpline 7827-170-170',
                'US: National DV Hotline 1-800-799-7233',
                'UK: National DV Helpline 0808-2000-247',
                'Discuss safety planning (safe location, emergency contacts, go-bag)',
                'Document per mandatory reporting requirements',
            ],
        },
    },
    {
        level: 'HIGH',
        category: 'Substance Crisis',
        cssrsLevel: 0,
        patterns: [
            /\b(overdos(e[sd]?|ing)|OD'?d)\b/i,
            /\b(relaps(e[sd]?|ing))\b.{0,20}\b(drug|alcohol|drink|use|substance|heroin|meth|cocaine|fentanyl|pills|opioid)\b/i,
            /\b(can'?t stop|out of control)\b.{0,20}\b(drinking|using|drug|substance)\b/i,
            /\b(blackout|blacked out|withdrawal|detox|DTs)\b/i,
        ],
        protocol: {
            name: 'Substance Use Crisis Response',
            steps: [
                'Assess for acute intoxication or withdrawal symptoms',
                'Determine if medical detox is needed',
                'Assess for co-occurring suicidal ideation',
                'India: NIMHANS De-addiction Centre 080-26995000',
                'US: SAMHSA Helpline 1-800-662-4357',
                'Consider referral to higher level of care (IOP/residential)',
            ],
        },
    },
    {
        level: 'HIGH',
        category: 'Psychotic Symptoms',
        cssrsLevel: 0,
        patterns: [
            /\b(hear(ing)?|heard)\b.{0,15}\b(voices?|things?|sounds?)\b.{0,20}\b(no one|nobody|aren'?t|not)\b/i,
            /\b(see(ing)?|saw)\b.{0,15}\b(things?|people|shadows?|figures?)\b.{0,20}\b(aren'?t|not|no one)\b/i,
            /\b(hallucin(ation|ating|ate)|delusion|paranoi[ad]|conspirac(y|ies))\b/i,
            /\b(people|they|government|someone)\b.{0,20}\b(watching|following|tracking|controlling|reading my|against me|out to get)\b/i,
        ],
        protocol: {
            name: 'Psychosis Assessment',
            steps: [
                'Remain calm and non-confrontational — do not challenge beliefs',
                'Assess reality testing: duration, frequency, content of experiences',
                'Assess command hallucinations: are voices telling them to harm self/others?',
                'Evaluate medication compliance and recent changes',
                'Consider urgent psychiatric consultation or hospitalization',
            ],
        },
    },

    // â•â•â• MODERATE: Warrants clinical attention â•â•â•
    {
        level: 'MODERATE',
        category: 'Hopelessness',
        cssrsLevel: 1, // Maps to C-SSRS Level 1: Wish to be dead
        patterns: [
            /\b(no (hope|point|reason|purpose)|hopeless|what'?s the point|give up|giving up)\b/i,
            /\b(nothing (will|ever|is going to) (change|get better|help|work))\b/i,
            /\b(trapped|stuck|no way out|can'?t (escape|leave|take it))\b/i,
        ],
        protocol: {
            name: 'Hopelessness Exploration',
            steps: [
                'Validate the emotional pain without dismissing it',
                'Explore: "When did you start feeling this way?"',
                'Identify any protective factors (family, pets, religion, future goals)',
                'Assess if hopelessness is escalating toward suicidal ideation',
                'Consider PHQ-9/DASS-21 administration to quantify depression severity',
            ],
        },
    },
    {
        level: 'MODERATE',
        category: 'Panic / Severe Anxiety',
        cssrsLevel: 0,
        patterns: [
            /\b(panic attack|can'?t breathe|heart (racing|pounding)|going (crazy|insane|to die)|losing (control|my mind))\b/i,
            /\b(constant(ly)?|always|every day)\b.{0,15}\b(anxious|anxiety|worried|panic|dread|fear)\b/i,
            /\b(haven'?t|can'?t|unable to)\b.{0,15}\b(sleep|eat|function|leave|work|concentrate)\b.{0,15}\b(days|weeks|month)\b/i,
        ],
        protocol: {
            name: 'Anxiety De-escalation',
            steps: [
                'Guide grounding exercise: 5-4-3-2-1 sensory technique',
                'Model slow diaphragmatic breathing (4-7-8 pattern)',
                'Assess frequency and severity â€” consider GAD-7 administration',
                'Evaluate for agoraphobia or social avoidance patterns',
                'Review current coping strategies and medication',
            ],
        },
    },
    {
        level: 'MODERATE',
        category: 'Disordered Eating',
        cssrsLevel: 0,
        patterns: [
            /\b(purg(e[sd]?|ing)|binge(d|ing)?|starv(e[sd]?|ing)|restrict(ing|ed)?|throw(ing)? up|making myself (sick|vomit|throw up))\b/i,
            /\b(hate my body|too fat|disgusting|don'?t eat|won'?t eat|afraid to eat)\b/i,
            /\b(laxativ|diuretic|diet pill)\b/i,
        ],
        protocol: {
            name: 'Eating Disorder Screen',
            steps: [
                'Assess medical stability (vitals, electrolytes, BMI if appropriate)',
                'Determine frequency and duration of behaviors',
                'Screen for co-occurring depression and body dysmorphia',
                'Evaluate need for nutritional counseling referral',
                'Consider higher level of care if medically compromised',
            ],
        },
    },
    // New Audit Fix Patterns
    {
        level: 'MODERATE',
        category: 'Somatic Idiom of Distress (India-specific)',
        cssrsLevel: 0,
        patterns: [
            /\b(ghabra(hat|na|wah)|dil baith|dil sunk|dil heavy|dil pe bojh)\b/i,
            /\b(jhum.?jhum|jhunjhuni|naseein phad|dimaag bhar|buzzing head)\b/i,
            /\b(seena bhaari|haath pair sune|sar mein awaaz|badan mein dard everywhere)\b/i,
            /\b(dhat|virya|shakti khatam|kamzori|weakness from nightfall)\b/i,
            /\b(pet mein aag|jalan andar|dimag jal raha|body burning inside)\b/i,
        ],
        protocol: {
            name: 'Somatic Idiom Documentation',
            steps: [
                'Document idiom verbatim in HOPI antecedents field',
                'Map to ICD-10 via NIMHANS somatic idiom taxonomy',
                'Explore cultural meaning before pathologising',
                'Reference: pmc.ncbi.nlm.nih.gov/articles/PMC5602270/',
            ]
        }
    },
    {
        level: 'HIGH',
        category: 'Passive Suicidal Ideation',
        cssrsLevel: 2,
        patterns: [
            /\b(wish(ed)? (I was|I had|I were) never (born|existed)|never been born)\b/i,
            /\b(everyone (would be|is) better off (without me|if I was gone))\b/i,
            /\b(don'?t care if I (live|die|wake up)|wouldn'?t mind dying)\b/i,
            /\b(tired of (living|being alive|existing)|exhausted of (life|being here))\b/i,
            /\b(sab ke liye behtar hoga|mera hona bekar hai|main nahi rahoon|zindagi nahi chahiye)\b/i,
        ],
        protocol: {
            name: 'Columbia SSRS Level 2 Assessment',
            steps: [
                'Acknowledge pain without reinforcing hopelessness',
                'Ask: "Kya aap sochte hain ki aap nahi hote to achha hota?"',
                'Assess for escalation to active ideation (CSSRS Level 3+)',
                'Full C-SSRS at: cssrs.columbia.edu',
            ]
        }
    },
    {
        level: 'CRITICAL',
        category: 'Command Hallucination — Immediate Risk',
        cssrsLevel: 5,
        patterns: [
            /\b(voice[s]?|sound[s]?|it|they).{0,20}(tell(s|ing)?|say(s|ing)?|order(s|ing)?|command(s|ing)?).{0,20}(hurt|kill|harm|cut|jump|end).{0,15}(myself|me|my life)\b/i,
            /\b(awaaz.{0,20}(bol rahi|keh rahi|kehta|bolti).{0,20}(maar|kaat|khatam|hurt))\b/i,
            /\b(God|Allah|bhagwan|voice).{0,20}(told|telling|saying).{0,20}(kill|hurt|punish).{0,10}(me|myself)\b/i,
        ],
        protocol: {
            name: 'Command Hallucination Crisis Protocol',
            steps: [
                'IMMEDIATE: Do not leave patient alone',
                'Assess if patient is acting on the commands',
                'Emergency: Vandrevala 1860-2662-345 | Kiran 1800-599-0019',
                'Consider emergency psychiatric admission per MHCA Section 23',
            ]
        }
    },

    // ── Loneliness & Social Isolation (UCLA-3 linked) ──
    {
        level: 'MODERATE',
        category: 'Social Isolation / Loneliness',
        cssrsLevel: 0,
        patterns: [
            /\b(no one (to talk to|understands|cares|is there)|nobody (cares|understands|listens))\b/i,
            /\b(completely alone|totally isolated|no friends|no one left|feel invisible)\b/i,
            /\b(akela(pan)?|akeli|koi nahi|koi samajhta nahi|koi nahi hai mere liye)\b/i,
            /\b(people around me but.{0,20}not with me|surrounded by people.{0,20}alone)\b/i,
            /\b(haven'?t spoken to (anyone|a person).{0,15}(days|weeks|months))\b/i,
        ],
        protocol: {
            name: 'Loneliness & Social Isolation Assessment',
            steps: [
                'Validate: loneliness is a signal that connection matters — not a character flaw',
                'Administer UCLA Loneliness Scale (Version 3) — available in OutcomeTracker',
                'Assess duration: acute vs chronic loneliness (different interventions)',
                'Screen for comorbid depression — loneliness is a strong predictor (PHQ-9/DASS-21)',
                'PSS-10 recommended — chronic loneliness elevates perceived stress',
                'Explore social network: who, what barriers to connection',
                'Consider: social skills training, group therapy, community activity referral',
            ],
        },
    },

    // ── Tobacco / Nicotine Withdrawal (NIMHANS 5A's Protocol) ──
    {
        level: 'MODERATE',
        category: 'Tobacco / Nicotine Withdrawal',
        cssrsLevel: 0,
        patterns: [
            /\b(quit(ting)? smoking|stopped smoking|gave up (cigarettes?|tobacco|beedis?)|trying to quit)\b/i,
            /\b(nicotine withdrawal|cigarette craving|craving (to smoke|a cigarette|tobacco))\b/i,
            /\b(irritable|can'?t sleep|restless|anxious).{0,20}(since I stopped|after quitting|without (cigarettes?|smoking))\b/i,
            /\b(smoke.{0,15}(20|25|30|pack|packs) a day|heavy smoker|chain smok)\b/i,
        ],
        protocol: {
            name: "NIMHANS Tobacco Cessation — 5A's Protocol",
            steps: [
                'ASK: Document tobacco type, quantity, duration in HOPI',
                'ADVISE: Link quitting to presenting complaint (anxiety/depression/sleep)',
                'ASSESS: Stage of change — Pre-contemplation / Contemplation / Ready to quit',
                'ASSIST: NRT (Nicotex 2mg/4mg, ₹4-6/gum) OR Bupropion (₹1,234/course) OR Varenicline (₹11,206/course)',
                'ARRANGE: Follow-up at 1 week, 2 weeks, 1 month, 3 months',
                'WARN: Withdrawal mimics anxiety/depression — rule out before adjusting psychiatric meds',
                'India Quitline: 1800-112-356 (toll-free)',
            ],
        },
    },
];

// ── Detected clinical themes for intervention matching ──
export type ClinicalTheme = 'depression' | 'anxiety' | 'trauma' | 'crisis' | 'anger' | 'grief' | 'relationship';

interface ThemePattern {
    theme: ClinicalTheme;
    patterns: RegExp[];
}

const THEME_PATTERNS: ThemePattern[] = [
    {
        theme: 'depression',
        patterns: [
            /\b(depress(ed|ion|ing)|sad(ness)?|low mood|empty|numb|worthless|guilt(y)?|fatigue|tired all|no energy|can'?t enjoy|lost interest)\b/i,
        ],
    },
    {
        theme: 'anxiety',
        patterns: [
            /\b(anxi(ous|ety)|nervous|worried|worry|panic|fear(ful)?|restless|on edge|tense|can'?t relax|overthink)\b/i,
        ],
    },
    {
        theme: 'trauma',
        patterns: [
            /\b(trauma|PTSD|flashback|nightmare|triggered|assault|abuse|accident|combat|war|sexual violence|molestation)\b/i,
        ],
    },
    {
        theme: 'crisis',
        patterns: [
            /\b(crisis|emergency|urgent|immediate|can'?t cope|breaking (point|down)|falling apart|desperate)\b/i,
        ],
    },
    {
        theme: 'anger',
        patterns: [
            /\b(angry|anger|rage|furious|irritable|aggressiv|violent|explosive|temper|blow up|snapped)\b/i,
        ],
    },
    {
        theme: 'grief',
        patterns: [
            /\b(grief|griev(ing|e)|loss|died|death|passed away|funeral|miss (him|her|them)|mourning|bereav)\b/i,
        ],
    },
    {
        theme: 'relationship',
        patterns: [
            /\b(divorce|breakup|broke up|cheating|affair|fight(ing)?|argument|conflict|abandon|reject|lonely|loneliness|isolat)\b/i,
        ],
    },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Public API
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let alertCounter = 0;

export function scanTranscript(text: string, timestamp: number): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    for (const pattern of RISK_PATTERNS) {
        for (const regex of pattern.patterns) {
            const match = text.match(regex);
            if (match) {
                alerts.push({
                    id: `risk-${++alertCounter}-${Date.now()}`,
                    level: pattern.level,
                    category: pattern.category,
                    matchedPhrase: match[0],
                    originalText: text,
                    timestamp,
                    protocol: pattern.protocol,
                    dismissed: false,
                    cssrsLevel: pattern.cssrsLevel,
                    cssrsLabel: getCSSRSLabel(pattern.cssrsLevel),
                });
                break; // One alert per category per segment
            }
        }
    }

    return alerts;
}

export function applyCoOccurrenceEscalation(alerts: RiskAlert[]): RiskAlert[] {
    const hopelessness = alerts.filter(a => a.category === 'Hopelessness' && !a.dismissed);
    if (hopelessness.length >= 3) {
        return alerts.map(a =>
            a.category === 'Hopelessness'
                ? {
                    ...a,
                    level: 'HIGH' as RiskLevel,
                    cssrsLevel: 2,
                    cssrsLabel: 'Sustained Hopelessness — Escalated',
                    protocol: {
                        name: 'Sustained Hopelessness Protocol',
                        steps: [
                            '3+ hopelessness indicators detected this session',
                            'Administer full PHQ-9 immediately',
                            'Directly ask C-SSRS Level 1 question',
                            'Update safety plan',
                        ]
                    }
                }
                : a
        );
    }
    return alerts;
}

export function detectThemes(fullTranscript: string): ClinicalTheme[] {
    const themes: ClinicalTheme[] = [];

    for (const tp of THEME_PATTERNS) {
        for (const regex of tp.patterns) {
            if (regex.test(fullTranscript)) {
                themes.push(tp.theme);
                break;
            }
        }
    }

    return themes;
}

export function getHighestRiskLevel(alerts: RiskAlert[]): RiskLevel | null {
    const active = alerts.filter((a) => !a.dismissed);
    if (active.some((a) => a.level === 'CRITICAL')) return 'CRITICAL';
    if (active.some((a) => a.level === 'HIGH')) return 'HIGH';
    if (active.some((a) => a.level === 'MODERATE')) return 'MODERATE';
    return null;
}

export function getHighestCSSRSLevel(alerts: RiskAlert[]): number {
    const active = alerts.filter((a) => !a.dismissed);
    if (active.length === 0) return 0;
    return Math.max(...active.map((a) => a.cssrsLevel));
}

export function getRiskLevelColor(level: RiskLevel): { bg: string; border: string; text: string; badge: string } {
    switch (level) {
        case 'CRITICAL':
            return { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', badge: '#DC2626' };
        case 'HIGH':
            return { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', badge: '#EA580C' };
        case 'MODERATE':
            return { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', badge: '#D97706' };
    }
}
