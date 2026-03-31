import { NextResponse } from 'next/server';

export async function GET() {
    const sarvamApiKey = process.env.SARVAM_API_KEY;

    if (!sarvamApiKey) {
        return NextResponse.json(
            { error: 'Sarvam API key not configured' },
            { status: 500 }
        );
    }

    // Saaras v3 uses clinical-grade streaming
    return NextResponse.json({
        key: sarvamApiKey,
        wsUrl: 'wss://api.sarvam.ai/speech-to-text/ws',
    });
}
