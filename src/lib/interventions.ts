// =============================================
// Evidence-Based Intervention Database
// CBT/DBT/Crisis techniques mapped to clinical themes
// =============================================

import { ClinicalTheme } from './riskDetection';

export interface Intervention {
    name: string;
    approach: string;
    description: string;
    whenToUse: string;
    examplePhrasing: string;
}

const INTERVENTIONS: Record<ClinicalTheme, Intervention[]> = {
    depression: [
        {
            name: 'Behavioral Activation',
            approach: 'CBT',
            description: 'Identify and schedule pleasurable or meaningful activities to counteract withdrawal and inactivity.',
            whenToUse: 'Client reports low motivation, withdrawal from activities, or spending excessive time in bed.',
            examplePhrasing: '"What\'s one small activity you used to enjoy that we could schedule for this week?"',
        },
        {
            name: 'Cognitive Restructuring',
            approach: 'CBT',
            description: 'Identify and challenge negative automatic thoughts using evidence-based questioning.',
            whenToUse: 'Client expresses all-or-nothing thinking, catastrophizing, or self-blame.',
            examplePhrasing: '"What evidence do you have for and against that thought?"',
        },
        {
            name: 'Gratitude Journaling',
            approach: 'Positive Psychology',
            description: 'Daily practice of noting three things that went well, building positive attention bias.',
            whenToUse: 'Client has pervasive negativity bias or difficulty recognizing positive experiences.',
            examplePhrasing: '"Each evening, can you write down three things -- even small ones -- that went okay today?"',
        },
    ],
    anxiety: [
        {
            name: 'Diaphragmatic Breathing (4-7-8)',
            approach: 'Somatic',
            description: 'Slow breathing to activate the parasympathetic nervous system: inhale 4s, hold 7s, exhale 8s.',
            whenToUse: 'Client reports acute anxiety, panic symptoms, or physiological arousal.',
            examplePhrasing: '"Let\'s try this together right now. Breathe in for 4... hold for 7... out for 8..."',
        },
        {
            name: '5-4-3-2-1 Grounding',
            approach: 'Mindfulness',
            description: 'Sensory grounding: name 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste.',
            whenToUse: 'Client is dissociating, experiencing derealization, or overwhelmed by racing thoughts.',
            examplePhrasing: '"Look around the room -- tell me five things you can see right now."',
        },
        {
            name: 'Worry Time Scheduling',
            approach: 'CBT',
            description: 'Designate a specific 15-minute daily window for worry, postponing worry outside that window.',
            whenToUse: 'Client reports constant, uncontrollable worrying throughout the day.',
            examplePhrasing: '"When a worry comes up outside your worry window, write it down and tell yourself: I\'ll think about that at 6pm."',
        },
    ],
    trauma: [
        {
            name: 'Container Exercise',
            approach: 'EMDR / Stabilization',
            description: 'Visualize placing distressing memories in a locked container to set aside between sessions.',
            whenToUse: 'Client is overwhelmed by intrusive memories or flashbacks.',
            examplePhrasing: '"Imagine a strong container -- what does it look like? Now, place that memory inside and lock it."',
        },
        {
            name: 'Safe/Calm Place Visualization',
            approach: 'EMDR / Stabilization',
            description: 'Build and anchor a mental image of a safe, peaceful place to access during distress.',
            whenToUse: 'Client needs a self-regulation tool for managing trauma triggers between sessions.',
            examplePhrasing: '"Think of a place -- real or imagined -- where you feel completely safe. Describe it to me in detail."',
        },
        {
            name: 'Psychoeducation on Window of Tolerance',
            approach: 'Trauma-Informed',
            description: 'Teach the concept of hyperarousal vs. hypoarousal and help client identify their current zone.',
            whenToUse: 'Client swings between emotional numbing and intense reactivity.',
            examplePhrasing: '"It sounds like you\'re bouncing between shutdown and overwhelm. Let me draw something that might help explain what\'s happening."',
        },
    ],
    crisis: [
        {
            name: 'Safety Planning (Stanley-Brown)',
            approach: 'Crisis Intervention',
            description: 'Collaborative 6-step safety plan: warning signs, coping strategies, support contacts, emergency numbers.',
            whenToUse: 'Any time client expresses suicidal ideation or intent to self-harm.',
            examplePhrasing: '"I want to make sure you\'re safe. Let\'s build a plan together for when these feelings get intense."',
        },
        {
            name: 'Means Restriction Counseling',
            approach: 'Crisis Intervention',
            description: 'Collaboratively reduce access to lethal means (firearms, medications, sharp objects).',
            whenToUse: 'Client has identified a specific method or has access to lethal means.',
            examplePhrasing: '"Is there someone you trust who could hold onto [item] for you until you\'re feeling more stable?"',
        },
        {
            name: 'Crisis Coping Card',
            approach: 'DBT',
            description: 'Create a pocket-sized card with: 3 reasons to live, 3 coping skills, 3 people to call, crisis number.',
            whenToUse: 'As a takeaway tool after safety planning to reinforce in-the-moment coping.',
            examplePhrasing: '"Let\'s make a card you can keep in your wallet -- who are three people you could call when things feel unbearable?"',
        },
    ],
    anger: [
        {
            name: 'STOP Skill',
            approach: 'DBT',
            description: 'Stop, Take a step back, Observe, Proceed mindfully -- interrupts the anger-action cycle.',
            whenToUse: 'Client reports acting impulsively when angry or having verbal/physical outbursts.',
            examplePhrasing: '"Next time you feel that anger rising, literally say STOP to yourself. Then take one step back."',
        },
        {
            name: 'Anger Iceberg',
            approach: 'CBT',
            description: 'Explore the emotions underneath anger (hurt, fear, shame) that anger may be masking.',
            whenToUse: 'Client identifies anger as their primary emotion but may be avoiding underlying vulnerability.',
            examplePhrasing: '"Anger is often the tip of the iceberg. What\'s underneath -- what are you really feeling?"',
        },
    ],
    grief: [
        {
            name: 'Dual Process Model',
            approach: 'Grief Therapy',
            description: 'Normalize oscillation between loss-oriented coping (crying, remembering) and restoration-oriented coping (new routines).',
            whenToUse: 'Client feels guilty for having good days or fears they are not grieving correctly.',
            examplePhrasing: '"It\'s completely normal to have moments of joy in grief. Your mind needs breaks -- that doesn\'t mean you\'ve stopped caring."',
        },
        {
            name: 'Continuing Bonds Letter',
            approach: 'Narrative Therapy',
            description: 'Write a letter to the deceased expressing unfinished thoughts, feelings, or updates about life.',
            whenToUse: 'Client has unresolved feelings, guilt, or things they wished they had said.',
            examplePhrasing: '"If you could write one letter to [name] right now, what would you want them to know?"',
        },
    ],
    relationship: [
        {
            name: 'Interpersonal Effectiveness (DEAR MAN)',
            approach: 'DBT',
            description: 'Structured assertiveness: Describe, Express, Assert, Reinforce. Mindful, Appear confident, Negotiate.',
            whenToUse: 'Client struggles with communication, boundary-setting, or conflict resolution.',
            examplePhrasing: '"Let\'s practice: Describe the situation factually, then express how it makes you feel, then clearly state what you need."',
        },
        {
            name: 'Attachment Style Exploration',
            approach: 'Attachment Theory',
            description: 'Help client identify their attachment style and how it manifests in current relationships.',
            whenToUse: 'Client has recurring relationship patterns (avoidance, clinginess, fear of abandonment).',
            examplePhrasing: '"I notice a pattern -- when someone gets close, you tend to pull away. Does that feel familiar?"',
        },
    ],
};

export function getInterventions(themes: ClinicalTheme[]): Intervention[] {
    const results: Intervention[] = [];
    const seen = new Set<string>();

    for (const theme of themes) {
        const interventions = INTERVENTIONS[theme] || [];
        for (const intervention of interventions) {
            if (!seen.has(intervention.name)) {
                seen.add(intervention.name);
                results.push(intervention);
            }
        }
    }

    return results;
}
