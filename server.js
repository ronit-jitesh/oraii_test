// @ts-check
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        const { pathname } = parse(req.url);

        if (pathname === '/api/deepgram-proxy') {
            wss.handleUpgrade(req, socket, head, (clientWs) => {
                wss.emit('connection', clientWs, req);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (clientWs) => {
        console.log('[deepgram-proxy] Client connected');

        const deepgramUrl =
            'wss://api.deepgram.com/v1/listen' +
            '?model=nova-2' +
            '&language=en-IN' +
            '&encoding=webm-opus' +
            '&sample_rate=16000' +
            '&endpointing=600' +
            '&utterance_end_ms=1500' +
            '&interim_results=true';

        const dgWs = new WebSocket(deepgramUrl, {
            headers: { Authorization: `Token ${DEEPGRAM_KEY}` },
        });

        // Browser audio → Deepgram
        clientWs.on('message', (data) => {
            if (dgWs.readyState === WebSocket.OPEN) {
                dgWs.send(data);
            }
        });

        // Deepgram transcripts → browser
        dgWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data);
            }
        });

        dgWs.on('open', () => {
            console.log('[deepgram-proxy] Connected to Deepgram ✓');
        });

        dgWs.on('error', (err) => {
            console.error('[deepgram-proxy] Deepgram error:', err.message);
            clientWs.close(1011, 'Deepgram error');
        });

        dgWs.on('close', (code, reason) => {
            console.log('[deepgram-proxy] Deepgram closed:', code, reason.toString());
            if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
        });

        clientWs.on('close', () => {
            console.log('[deepgram-proxy] Client disconnected');
            if (dgWs.readyState === WebSocket.OPEN) dgWs.close();
        });

        clientWs.on('error', (err) => {
            console.error('[deepgram-proxy] Client error:', err.message);
            if (dgWs.readyState === WebSocket.OPEN) dgWs.close();
        });
    });

    server.listen(3000, () => {
        console.log('> Ready on http://localhost:3000');
        console.log('> WebSocket proxy → ws://localhost:3000/api/deepgram-proxy');
    });
});
