import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { CLINICAL_ANALYSIS_SYSTEM_PROMPT } from '@/lib/clinicalAnalysisEngine';
import { detectTobaccoUse, getTobaccoOverlayForAnalysis } from '@/lib/substanceUseEngine';
import { detectCulturalIdioms } from '@/lib/hinglishTaxonomy';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Instrument recommendation logic — based on what scores exist and what's missing
function getRecommendedInstruments(
    assessmentScores: Record<string, { score: number; severity: string }>,
    transcript: string
): string[] {
    const existing = Object.keys(assessmentScores || {});
    const recommendations: string[] = [];
    const text = (transcript || '').toLowerCase();

    // Stress indicators → PSS-10
    if (!existing.includes('PSS-10') && (
        text.includes('stress') || text.includes('tension') || text.includes('overwhelm') ||
        text.includes('too much') || text.includes('can\'t cope')
    )) recommendations.push('PSS-10 (Perceived Stress Scale)');

    // Loneliness/isolation → UCLA-3
    if (!existing.includes('UCLA-3') && (
        text.includes('lonely') || text.includes('alone') || text.includes('no one') ||
        text.includes('isolated') || text.includes('no friends') || text.includes('nobody')
    )) recommendations.push('UCLA-3 (UCLA Loneliness Scale)');

    // Depression → PHQ-9 or DASS-21
    if (!existing.includes('PHQ-9') && !existing.includes('DASS-21') && (
        text.includes('depress') || text.includes('sad') || text.includes('hopeless') ||
        text.includes('numb') || text.includes('empty')
    )) recommendations.push('DASS-21 (Depression/Anxiety/Stress subscales)');

    // Anxiety → GAD-7 or DASS-21
    if (!existing.includes('GAD-7') && !existing.includes('DASS-21') && (
        text.includes('anxious') || text.includes('anxiety') || text.includes('panic') ||
        text.includes('worry') || text.includes('fear')
    )) recommendations.push('GAD-7 or DASS-21 Anxiety subscale');

    // If DASS-21 stress subscale elevated → PSS-10 for deeper stress profiling
    const dass = assessmentScores?.['DASS-21'];
    if (dass && dass.severity === 'Moderate' || dass?.severity === 'Severe') {
        if (!existing.includes('PSS-10')) recommendations.push('PSS-10 (stress severity is elevated — PSS-10 gives deeper profile)');
    }

    return recommendations;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const body = await request.json();
        const {
            transcript,
            presentingComplaint,
            existingNotes,
            assessmentScores,
            patientAge,
            patientGender,
            sessionCount,
        } = body;

        if (!transcript && !presentingComplaint) {
            return NextResponse.json({ error: 'Provide transcript or presenting complaint' }, { status: 400 });
        }

        const fullText = `${presentingComplaint || ''} ${transcript || ''}`;

        // Detect tobacco use → inject NIMHANS overlay
        const hasTobacco = detectTobaccoUse(fullText);

        // Detect cultural idioms → add to context
        const culturalIdioms = detectCulturalIdioms(fullText);

        // Instrument recommendations
        const instrumentRecommendations = getRecommendedInstruments(assessmentScores || {}, fullText);

        // Build system prompt — base + optional overlays
        let systemPrompt = CLINICAL_ANALYSIS_SYSTEM_PROMPT;
        if (hasTobacco) systemPrompt += '\n\n' + getTobaccoOverlayForAnalysis();
        if (culturalIdioms.length > 0) {
            systemPrompt += `\n\n### CULTURAL IDIOMS DETECTED\n${culturalIdioms.map(c =>
                `- "${c.originalExpression}" → ${c.clinicalMapping} (${c.idiomDetected})`
            ).join('\n')}\nDocument these under DSM-5 Cultural Concepts of Distress in the formulation.`;
        }
        if (instrumentRecommendations.length > 0) {
            systemPrompt += `\n\n### RECOMMENDED PSYCHOMETRIC INSTRUMENTS (NOT YET ADMINISTERED)\nInclude these in your Tier 3 psychometricAssessments field:\n${instrumentRecommendations.map(i => `- ${i}`).join('\n')}`;
        }

        // Build context for user message
        const parts: string[] = [];
        if (presentingComplaint) parts.push(`PRESENTING COMPLAINT:\n${presentingComplaint}`);
        if (patientAge || patientGender) parts.push(`DEMOGRAPHICS: Age ${patientAge || '?'}, Gender: ${patientGender || '?'}`);
        if (sessionCount) parts.push(`SESSION NUMBER: ${sessionCount}`);
        if (assessmentScores && Object.keys(assessmentScores).length > 0) {
            const scores = Object.entries(assessmentScores)
                .map(([k, v]: [string, any]) => `${k}: ${v.score} (${v.severity})`).join('\n');
            parts.push(`PSYCHOMETRIC SCORES (ALREADY ADMINISTERED):\n${scores}`);
        }
        if (existingNotes) parts.push(`EXISTING CLINICAL NOTES:\n${existingNotes}`);
        if (transcript) parts.push(`SESSION TRANSCRIPT:\n${transcript}`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: parts.join('\n\n---\n\n') },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content from OpenAI');

        const analysisData = JSON.parse(content);

        // Enrich response with metadata
        return NextResponse.json({
            success: true,
            data: analysisData,
            meta: {
                tobaccoDetected: hasTobacco,
                culturalIdioms: culturalIdioms.length,
                instrumentRecommendations,
            },
        });

    } catch (error) {
        console.error('[clinical-analysis] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
