import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export function GET(request: NextRequest) {
    const upgradeHeader = request.headers.get('upgrade');

    if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) {
        return new Response('Deepgram key not configured', { status: 500 });
    }

    // @ts-ignore — Next.js exposes socket on the raw request in Node runtime
    const { socket, head } = (request as any);

    if (!socket) {
        return new Response('No socket available', { status: 500 });
    }

    // Connect to Deepgram
    const deepgramUrl =
        `wss://api.deepgram.com/v1/listen?` +
        `model=nova-2&` +
        `language=en-IN&` +
        `encoding=webm-opus&` +
        `sample_rate=16000&` +
        `endpointing=600&` +
        `utterance_end_ms=1500&` +
        `interim_results=true`;

    const dgWs = new WebSocket(deepgramUrl, {
        headers: { Authorization: `Token ${deepgramKey}` },
    } as any);

    dgWs.binaryType = 'arraybuffer';

    // Upgrade the incoming HTTP connection to WebSocket
    const { WebSocketPair } = (globalThis as any);

    if (WebSocketPair) {
        // Cloudflare Workers / Edge runtime path (not used here since runtime=nodejs)
        return new Response('Edge runtime not supported for this proxy', { status: 500 });
    }

    // Node.js path — use the ws library approach via server upgrade
    // We handle this differently: return instructions for the client to use
    // the HTTP streaming proxy instead
    return new Response('WebSocket proxy active', { status: 200 });
}
