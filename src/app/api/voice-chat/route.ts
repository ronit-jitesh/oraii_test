import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const VOICE_SYSTEM_PROMPT = `You are ORAII, a warm and empathetic AI mental health companion speaking in a voice conversation.

RULES FOR VOICE:
1. Keep responses to 2-3 short sentences maximum — this is a spoken conversation
2. Never use bullet points, markdown, lists, or special characters
3. Speak naturally and warmly, like a caring friend
4. Always validate emotions before offering anything practical
5. If the user expresses suicidal ideation or crisis — say: "I hear you, and I care about you. Please call Vandrevala Foundation right now at 1860-2662-345. You don't have to go through this alone."
6. End with one short, gentle open-ended question
7. Use simple conversational language — no clinical terms`;

const RISK_KEYWORDS = [
    'kill myself', 'end my life', 'suicide', 'suicidal', 'want to die',
    'self-harm', 'hurt myself', 'cutting', 'no reason to live',
    'better off dead', 'overdose', 'end it all',
];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { transcript, history } = await request.json();

        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const isRisky = RISK_KEYWORDS.some(kw => transcript.toLowerCase().includes(kw));

        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: VOICE_SYSTEM_PROMPT },
        ];

        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({ role: msg.role, content: msg.content });
                }
            }
        }

        messages.push({ role: 'user', content: transcript });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 150,
            temperature: 0.7,
        });

        const replyText = completion.choices[0]?.message?.content ||
            "I'm here with you. Can you tell me a little more about how you're feeling?";

        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

        if (!ELEVENLABS_API_KEY || !VOICE_ID) {
            return NextResponse.json({ reply: replyText, flagged: isRisky });
        }

        const elevenRes = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: replyText,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.65,
                        similarity_boost: 0.85,
                        style: 0.2,
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!elevenRes.ok) {
            return NextResponse.json({ reply: replyText, flagged: isRisky });
        }

        const headers = new Headers({
            'Content-Type': 'audio/mpeg',
            'X-Reply-Text': encodeURIComponent(replyText),
            'X-Flagged': String(isRisky),
        });

        return new Response(elevenRes.body, { headers });

    } catch (error) {
        console.error('[voice-chat] Error:', error);
        return NextResponse.json({ error: 'Voice chat failed' }, { status: 500 });
    }
}
