// Diagnostic test: test different Google STT V2 configs to find what works
const { SpeechClient } = require('@google-cloud/speech').v2;
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const LOCATION = 'us-central1';

const client = new SpeechClient({
    projectId,
    keyFilename,
    apiEndpoint: `${LOCATION}-speech.googleapis.com`,
});

async function testConfig(label, config) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            stream.end();
            resolve({ label, result: 'OK (no error in 5s)' });
        }, 5000);

        const stream = client._streamingRecognize()
            .on('error', (err) => {
                clearTimeout(timeout);
                resolve({ label, result: `ERROR: ${err.message}` });
            })
            .on('data', (data) => {
                // any data is fine
            });

        stream.write({
            recognizer: `projects/${projectId}/locations/${LOCATION}/recognizers/_`,
            streamingConfig: {
                config: config,
                streamingFeatures: { interimResults: true },
            },
        });

        // Send a small chunk of silence audio to trigger full validation
        const silence = Buffer.alloc(8192, 0); // 256ms of silence at 16kHz 16-bit
        setTimeout(() => {
            stream.write({ audio: silence });
        }, 500);
    });
}

async function main() {
    const tests = [
        // Test 1: Original config (chirp_2 + auto) - was this ever working?
        ['chirp_2 + auto', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp_2',
            languageCodes: ['auto'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 2: chirp_2 + en-US
        ['chirp_2 + en-US', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp_2',
            languageCodes: ['en-US'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 3: chirp_2 + hi-IN
        ['chirp_2 + hi-IN', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp_2',
            languageCodes: ['hi-IN'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 4: chirp_2 + hi-IN + en-US (multi)
        ['chirp_2 + [hi-IN, en-US]', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp_2',
            languageCodes: ['hi-IN', 'en-US'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 5: chirp_2 + kn-IN
        ['chirp_2 + kn-IN', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp_2',
            languageCodes: ['kn-IN'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 6: latest_long + hi-IN (fallback model)
        ['latest_long + hi-IN', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'latest_long',
            languageCodes: ['hi-IN'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 7: latest_long + kn-IN (fallback model)
        ['latest_long + kn-IN', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'latest_long',
            languageCodes: ['kn-IN'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 8: chirp + auto (Chirp 1)
        ['chirp + auto', {
            explicitDecodingConfig: { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 },
            model: 'chirp',
            languageCodes: ['auto'],
            features: { enableAutomaticPunctuation: true },
        }],
        // Test 9: chirp_2 + autoDecodingConfig + en-US
        ['chirp_2 + autoDecoding + en-US', {
            autoDecodingConfig: {},
            model: 'chirp_2',
            languageCodes: ['en-US'],
            features: { enableAutomaticPunctuation: true },
        }],
    ];

    console.log('=== Google STT V2 Config Diagnostic ===\n');
    const lines = [];
    for (const [label, config] of tests) {
        const result = await testConfig(label, config);
        const icon = result.result.startsWith('OK') ? 'PASS' : 'FAIL';
        const line = `${icon} | ${result.label} => ${result.result}`;
        console.log(line);
        lines.push(line);
    }
    console.log('\n=== Done ===');
    require('fs').writeFileSync('scripts/test-results.txt', lines.join('\n'));
    process.exit(0);
}

main();
