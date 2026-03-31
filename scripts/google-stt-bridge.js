const WebSocket = require('ws');
const { SpeechClient } = require('@google-cloud/speech').v2;
const { Translate } = require('@google-cloud/translate').v2;
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const fs = require('fs');

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId) {
    console.error('ERROR: GOOGLE_CLOUD_PROJECT missing from .env.local');
    process.exit(1);
}

// Support inline JSON credentials (for production) or file path (for local dev)
let credentials = null;
if (credentialsJson) {
    try {
        credentials = JSON.parse(credentialsJson);
        console.log('Using inline GOOGLE_CREDENTIALS_JSON');
    } catch (e) {
        console.error('ERROR: GOOGLE_CREDENTIALS_JSON is not valid JSON');
        process.exit(1);
    }
} else if (keyFilename) {
    if (!fs.existsSync(keyFilename)) {
        console.error(`ERROR: JSON Key file NOT found at: ${keyFilename}`);
        console.error('Please move your downloaded JSON key to this path and rename it to google-key.json');
    }
    console.log(`Using key file: ${keyFilename}`);
} else {
    console.error('ERROR: Either GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS must be set');
    process.exit(1);
}

const LOCATION = 'us-central1';

// Build client options: prefer inline credentials, fall back to keyFilename
const clientOptions = {
    projectId,
    apiEndpoint: `${LOCATION}-speech.googleapis.com`,
};
if (credentials) {
    clientOptions.credentials = credentials;
} else {
    clientOptions.keyFilename = keyFilename;
}

// Google STT V2 client (regional endpoint for Chirp 2)
const sttClient = new SpeechClient(clientOptions);

// Google Translate client (for Hindi/Kannada → English translation)
const translateOptions = { projectId };
if (credentials) {
    translateOptions.credentials = credentials;
} else {
    translateOptions.keyFilename = keyFilename;
}
const translateClient = new Translate(translateOptions);

// Translate text to English. Returns the original text if translation fails.
async function translateToEnglish(text) {
    try {
        const [translation] = await translateClient.translate(text, 'en');
        return translation;
    } catch (err) {
        console.error('Translation error:', err.message);
        return text; // Fallback to original text
    }
}

const wss = new WebSocket.Server({ port: 3001 });

console.log('Google STT V2 Bridge running on ws://localhost:3001');
console.log(`Using location: ${LOCATION}, project: ${projectId}`);

wss.on('connection', (ws) => {
    console.log('Client connected');
    let recognizeStream = null;
    let streamDestroyed = false;
    let audioBuffer = [];
    let needsTranslation = false; // true when input language is non-English

    ws.on('message', (message) => {
        // Don't process if stream has been destroyed
        if (streamDestroyed) return;

        let config = null;

        // In many WS implementations, strings might arrive as Buffers
        try {
            const str = message.toString();
            if (str.startsWith('{') && str.endsWith('}')) {
                config = JSON.parse(str);
            }
        } catch (e) {
            // Not JSON, treat as binary audio
        }

        if (config) {
            // First message: Configuration from client
            // config.language: e.g. 'en-US', 'hi-IN', 'kn-IN'
            const clientLang = config.language || 'en-US';
            needsTranslation = !clientLang.startsWith('en');
            console.log('Initializing Google STT with config:', config);
            console.log(`Language: ${clientLang}, Translation to English: ${needsTranslation}`);

            recognizeStream = sttClient
                ._streamingRecognize()
                .on('error', (err) => {
                    console.error('Google STT Stream Error:', err.message);
                    streamDestroyed = true;
                    try {
                        ws.send(JSON.stringify({ error: err.message }));
                    } catch (e) { /* ws may be closed */ }
                })
                .on('data', async (data) => {
                    if (data.results && data.results[0]) {
                        const result = data.results[0];
                        let transcript = result.alternatives[0].transcript;
                        const isFinal = result.isFinal;

                        // Extract speaker tag from diarization
                        // Google V2 attaches speakerLabel to each word; the last word's label is most reliable
                        const words = result.alternatives[0].words || [];
                        const speakerTag = words.length > 0
                            ? (words[words.length - 1].speakerLabel || words[words.length - 1].speakerTag || 0)
                            : 0;

                        if (needsTranslation && transcript.trim()) {
                            if (isFinal) {
                                const translated = await translateToEnglish(transcript);
                                console.log(`Translated: "${transcript}" → "${translated}" (final, speaker: ${speakerTag})`);
                                transcript = translated;
                            } else {
                                const translated = await translateToEnglish(transcript);
                                transcript = translated;
                            }
                        } else {
                            console.log('Transcript:', transcript, '(final:', isFinal, ', speaker:', speakerTag, ')');
                        }

                        try {
                            ws.send(JSON.stringify({ transcript, isFinal, speakerTag }));
                        } catch (e) { /* ws may be closed */ }
                    }
                });

            // Build the recognition config
            // NOTE: chirp_2 does NOT support multiple languageCodes for streaming.
            // Use a single language code. Chirp 2 handles code-switched speech
            // (e.g. Hindi-English mix) natively with a single language code.
            //
            // CHIRP 2 STREAMING LIMITATIONS:
            //   - diarizationConfig: NOT supported (use Chirp 3 or Deepgram for diarization)
            //   - inlinePhraseSet: NOT supported (V2 requires pre-created PhraseSet resources)
            //   - enableWordTimeOffsets: NOT supported in streaming mode
            //   Speaker diarization currently works via Deepgram (nova-3-medical) and Simulator modes.
            //   When upgrading to Chirp 3, re-enable diarizationConfig and adaptation.
            const recognitionConfig = {
                explicitDecodingConfig: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    audioChannelCount: 1,
                },
                model: 'chirp_2',
                languageCodes: [clientLang],
                features: {
                    enableAutomaticPunctuation: true,
                },
            };

            // V2 StreamingRecognize: first write must be the config
            recognizeStream.write({
                recognizer: `projects/${projectId}/locations/${LOCATION}/recognizers/_`,
                streamingConfig: {
                    config: recognitionConfig,
                    streamingFeatures: {
                        interimResults: true,
                    },
                },
            });
            console.log('Sent initial config to Google (chirp_2, punctuation enabled)');

            // Flush any buffered audio
            if (audioBuffer.length > 0) {
                console.log(`Flushing ${audioBuffer.length} buffered audio chunks`);
                audioBuffer.forEach(chunk => recognizeStream.write({ audio: chunk }));
                audioBuffer = [];
            }
        } else if (recognizeStream && !streamDestroyed) {
            // Binary audio data
            recognizeStream.write({ audio: message });
        } else if (!recognizeStream) {
            // Buffer audio while waiting for config
            audioBuffer.push(message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (recognizeStream && !streamDestroyed) {
            recognizeStream.end();
        }
        recognizeStream = null;
        streamDestroyed = false;
    });
});
