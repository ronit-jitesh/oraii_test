import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

const ALLOWED_TYPES = [
    'audio/mpeg',       // .mp3
    'audio/mp4',        // .m4a
    'audio/x-m4a',      // .m4a alt
    'audio/wav',        // .wav
    'audio/x-wav',      // .wav alt
    'audio/ogg',        // .ogg
    'audio/webm',       // .webm
    'audio/aac',        // .aac
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// Map frontend language codes to Deepgram language codes
const LANGUAGE_MAP: Record<string, string> = {
    'hi-IN': 'hi',      // Hindi
    'kn-IN': 'kn',      // Kannada
    'ta-IN': 'ta',      // Tamil
    'te-IN': 'te',      // Telugu
    'ml-IN': 'ml',      // Malayalam
    'mr-IN': 'mr',      // Marathi
    'gu-IN': 'gu',      // Gujarati
    'bn-IN': 'bn',      // Bengali
    'pa-IN': 'pa',      // Punjabi
    'en-IN': 'en',      // English (India)
    'en': 'en',         // English
    'hi': 'hi',
    'kn': 'kn',
    'multi': 'multi',   // Multi-language (auto-detect)
    'unknown': 'multi', // Default to multi-language detection
};

export async function POST(request: NextRequest) {
    try {
        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

        if (!deepgramApiKey) {
            return NextResponse.json(
                { error: 'Deepgram API key not configured. Set DEEPGRAM_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('audio') as File | null;
        const language = (formData.get('language') as string) || 'unknown';

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|ogg|webm|aac)$/i)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${file.type}. Supported: .mp3, .m4a, .wav, .ogg, .webm, .aac` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 25MB` },
                { status: 400 }
            );
        }

        const dgLang = LANGUAGE_MAP[language] || 'multi';
        const isNonEnglish = dgLang !== 'en';

        console.log(`[transcribe-file] Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB), lang: ${language} â†’ dg: ${dgLang}, translate: ${isNonEnglish}`);

        // Read file into buffer for Deepgram
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Initialize Deepgram client
        const deepgram = createClient(deepgramApiKey);

        // Build transcription options
        const options: Record<string, any> = {
            model: 'nova-2',
            smart_format: true,
            punctuate: true,
            diarize: true,
            paragraphs: true,
        };

        // For non-English or mixed-language audio:
        // - Use detect_language to auto-detect the spoken language
        // - Use translate to get English output regardless of input language
        if (isNonEnglish) {
            if (dgLang === 'multi') {
                // Auto-detect language (handles Hinglish, Kanglish, code-switching)
                options.detect_language = true;
            } else {
                // Specific language hint
                options.language = dgLang;
            }
            // Translate everything to English
            options.translate = true;
        } else {
            options.language = 'en';
        }

        // Call Deepgram pre-recorded API
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            buffer,
            options
        );

        if (error) {
            console.error('[transcribe-file] Deepgram API error:', error);
            return NextResponse.json(
                { error: `Deepgram transcription failed: ${(error instanceof Error ? error.message : String(error)) || JSON.stringify(error)}` },
                { status: 502 }
            );
        }

        // Extract transcript from Deepgram response
        const channels = result?.results?.channels;
        if (!channels || channels.length === 0) {
            return NextResponse.json(
                { error: 'Deepgram returned no transcription results. The audio may be too short or unclear.' },
                { status: 422 }
            );
        }

        // If translation is available, prefer the translated (English) transcript
        let transcript = '';
        let detectedLanguage = dgLang;
        const channel = channels[0];

        if (isNonEnglish && channel.alternatives?.[0]?.translations) {
            // Use the English translation
            const translation = channel.alternatives[0].translations;
            if (translation && typeof translation === 'object') {
                // Deepgram returns translations as { language: "en", translation: "..." }
                const enTranslation = Array.isArray(translation)
                    ? translation.find((t: any) => t.language === 'en')
                    : translation;
                if (enTranslation?.translation) {
                    transcript = enTranslation.translation;
                }
            }
        }

        // Fallback to the main transcript (or paragraphs)
        if (!transcript) {
            // Try paragraphs first for better formatting
            const paragraphs = channel.alternatives?.[0]?.paragraphs;
            if (paragraphs?.transcript) {
                transcript = paragraphs.transcript;
            } else {
                transcript = channel.alternatives?.[0]?.transcript || '';
            }
        }

        // Get detected language info
        if (channel.detected_language) {
            detectedLanguage = channel.detected_language;
        } else if (channel.alternatives?.[0]?.languages) {
            detectedLanguage = channel.alternatives[0].languages[0] || dgLang;
        }

        if (!transcript) {
            return NextResponse.json(
                { error: 'Deepgram returned empty transcript. The audio may be too short or unclear.' },
                { status: 422 }
            );
        }

        console.log(`[transcribe-file] Success: ${transcript.length} chars, detected: ${detectedLanguage}, translated: ${isNonEnglish}`);

        return NextResponse.json({
            success: true,
            transcript,
            language: detectedLanguage,
            translated: isNonEnglish,
            fileName: file.name,
            fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
        });

    } catch (error) {
        console.error('[transcribe-file] Error:', error);
        return NextResponse.json(
            { error: `Transcription failed: ${(error instanceof Error ? error.message : String(error)) || error}` },
            { status: 500 }
        );
    }
}
