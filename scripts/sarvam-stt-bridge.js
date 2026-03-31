const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const apiKey = process.env.SARVAM_API_KEY;
if (!apiKey) {
    console.error('ERROR: SARVAM_API_KEY not found in .env.local');
    process.exit(1);
}

const SARVAM_WS_URL = 'wss://api.sarvam.ai/speech-to-text-translate/ws';

const wss = new WebSocket.Server({ port: 3002 });
console.log('Sarvam STT Bridge running on ws://localhost:3002');

wss.on('connection', (clientWs) => {
    console.log('Client connected');
    let sarvamWs = null;
    let configReceived = false;
    let audioBuffer = [];

    clientWs.on('message', (message) => {
        // First message is always config JSON
        if (!configReceived) {
            let config;
            try {
                config = JSON.parse(message.toString());
            } catch (e) {
                // Binary arrived before config, buffer it
                audioBuffer.push(message);
                return;
            }

            configReceived = true;
            console.log('Config received:', config);

            // Build Sarvam URL with query params — auto-detect language
            const params = new URLSearchParams({
                language_code: 'unknown',
                model: 'saaras:v3',
                mode: 'codemix',
                sample_rate: '16000',
            });

            const url = `${SARVAM_WS_URL}?${params.toString()}`;
            console.log('Connecting to Sarvam:', url);

            // Connect to Sarvam with proper headers
            sarvamWs = new WebSocket(url, {
                headers: {
                    'Api-Subscription-Key': apiKey,
                }
            });

            sarvamWs.on('open', () => {
                console.log('Connected to Sarvam');
                clientWs.send(JSON.stringify({ status: 'connected' }));

                // Flush buffered audio
                if (audioBuffer.length > 0) {
                    console.log(`Flushing ${audioBuffer.length} buffered audio chunks`);
                    audioBuffer.forEach(chunk => sarvamWs.send(chunk));
                    audioBuffer = [];
                }
            });

            sarvamWs.on('message', (data) => {
                // Forward Sarvam responses to browser
                try {
                    const response = JSON.parse(data.toString());
                    console.log('Sarvam response:', JSON.stringify(response).substring(0, 200));
                    clientWs.send(JSON.stringify(response));
                } catch (e) {
                    clientWs.send(data);
                }
            });

            sarvamWs.on('error', (err) => {
                console.error('Sarvam WS Error:', err.message);
                clientWs.send(JSON.stringify({ error: err.message }));
            });

            sarvamWs.on('close', (code, reason) => {
                console.log(`Sarvam WS closed: ${code} ${reason}`);
                clientWs.send(JSON.stringify({ status: 'closed', code }));
            });

        } else if (sarvamWs && sarvamWs.readyState === WebSocket.OPEN) {
            // Forward binary audio to Sarvam
            sarvamWs.send(message);
        } else {
            // Buffer if Sarvam isn't ready yet
            audioBuffer.push(message);
        }
    });

    clientWs.on('close', () => {
        console.log('Client disconnected');
        if (sarvamWs) {
            sarvamWs.close();
            sarvamWs = null;
        }
    });
});
