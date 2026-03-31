import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const deepgramKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramKey) {
            return NextResponse.json({ error: 'Deepgram key not configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file' }, { status: 400 });
        }

        const audioBuffer = await audioFile.arrayBuffer();

        // Call Deepgram REST API — works from server, no WebSocket needed
        const response = await fetch(
            'https://api.deepgram.com/v1/listen' +
            '?model=nova-2' +
            '&language=en-IN' +
            '&smart_format=true' +
            '&punctuate=true',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${deepgramKey}`,
                    'Content-Type': audioFile.type || 'audio/webm',
                },
                body: audioBuffer,
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('[transcribe] Deepgram error:', errText);
            return NextResponse.json({ error: 'Transcription failed', detail: errText }, { status: 500 });
        }

        const data = await response.json();
        const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

        return NextResponse.json({ transcript });

    } catch (error) {
        console.error('[transcribe] Error:', error);
        return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }
}
