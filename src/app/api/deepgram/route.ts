import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function GET() {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
        return NextResponse.json(
            { error: 'Deepgram API key not configured' },
            { status: 500 }
        );
    }

    // In a production environment, you should generate a temporary key here
    // using the Deepgram Management API.
    // For this local MVP PoC, we will return the key directly to allow
    // the client to connect immediately.
    return NextResponse.json({ key: deepgramApiKey });
}
