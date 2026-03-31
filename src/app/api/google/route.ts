import { NextResponse } from 'next/server';

export async function GET() {
    const googleProject = process.env.GOOGLE_CLOUD_PROJECT;
    const googleCredentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const googleCredentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Support inline JSON credentials (for production/Vercel) or file path (for local dev)
    if (!googleProject || (!googleCredentialsJson && !googleCredentialsFile)) {
        return NextResponse.json(
            { error: 'Google Cloud credentials not configured. Please ensure GOOGLE_CLOUD_PROJECT and either GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS are set.' },
            { status: 500 }
        );
    }

    // For real-time streaming, we will return the project ID and a token-like status
    // The client will use this to confirm the server is ready to proxy
    return NextResponse.json({
        ready: true,
        project: googleProject
    });
}

// POST endpoint to handle proxying or token generation if needed
// Google V2 usually requires server-side streaming due to security of the long-lived keys
export async function POST(req: Request) {
    // Placeholder for future server-side streaming orchestration if browser-direct is blocked
    return NextResponse.json({ message: "Google STT V2 Proxy endpoint active" });
}

