'use client';

import { useRef, useState, useCallback } from 'react';

export interface VoiceMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export function useVoiceAssistant() {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [liveTranscript, setLiveTranscript] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const stopMic = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        mediaRecorderRef.current = null;
    }, []);

    const sendToVoiceAPI = useCallback(async (
        transcript: string,
        history: VoiceMessage[],
        onMessage: (msg: VoiceMessage) => void,
        onFlagged: () => void,
    ) => {
        if (!transcript.trim()) {
            setVoiceState('idle');
            return;
        }

        setVoiceState('processing');
        onMessage({ role: 'user', content: transcript });

        try {
            const res = await fetch('/api/voice-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, history: history.slice(-10) }),
            });

            if (!res.ok) throw new Error('Voice API failed');

            const contentType = res.headers.get('Content-Type') || '';

            if (contentType.includes('audio')) {
                const replyText = decodeURIComponent(res.headers.get('X-Reply-Text') || '');
                const flagged = res.headers.get('X-Flagged') === 'true';

                if (replyText) onMessage({ role: 'assistant', content: replyText });
                if (flagged) onFlagged();

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);

                if (!audioRef.current) audioRef.current = new Audio();
                audioRef.current.src = url;
                setVoiceState('speaking');

                audioRef.current.onended = () => {
                    URL.revokeObjectURL(url);
                    setVoiceState('idle');
                };
                audioRef.current.onerror = () => {
                    URL.revokeObjectURL(url);
                    setVoiceState('idle');
                };

                await audioRef.current.play();
            } else {
                const data = await res.json();
                if (data.reply) onMessage({ role: 'assistant', content: data.reply });
                if (data.flagged) onFlagged();
                setVoiceState('idle');
            }
        } catch (err) {
            console.error('[voice] API error:', err);
            setVoiceState('idle');
        }
    }, []);

    const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
        // Send audio to our server-side transcription endpoint (avoids CORS/WSS issues)
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Transcription failed');
        const data = await res.json();
        return data.transcript || '';
    }, []);

    const startListening = useCallback(async (
        history: VoiceMessage[],
        onMessage: (msg: VoiceMessage) => void,
        onFlagged: () => void,
    ) => {
        if (voiceState !== 'idle') return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            streamRef.current = stream;
            chunksRef.current = [];

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                chunksRef.current = [];

                if (audioBlob.size < 1000) {
                    // Too short — ignore
                    setVoiceState('idle');
                    setLiveTranscript('');
                    return;
                }

                setLiveTranscript('Transcribing...');
                setVoiceState('processing');

                try {
                    const transcript = await transcribeAudio(audioBlob);
                    setLiveTranscript('');
                    if (transcript.trim()) {
                        await sendToVoiceAPI(transcript, history, onMessage, onFlagged);
                    } else {
                        setVoiceState('idle');
                    }
                } catch (err) {
                    console.error('[voice] Transcription error:', err);
                    setVoiceState('idle');
                    setLiveTranscript('');
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setVoiceState('listening');
            setLiveTranscript('');

        } catch (err) {
            console.error('[voice] Mic error:', err);
            setVoiceState('idle');
        }
    }, [voiceState, transcribeAudio, sendToVoiceAPI]);

    const stopListening = useCallback(() => {
        // Stopping the recorder triggers onstop → transcription
        stopMic();
        // State will be set to 'processing' by onstop handler
    }, [stopMic]);

    const stopSpeaking = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setVoiceState('idle');
    }, []);

    const toggle = useCallback((
        history: VoiceMessage[],
        onMessage: (msg: VoiceMessage) => void,
        onFlagged: () => void,
    ) => {
        if (voiceState === 'idle') {
            startListening(history, onMessage, onFlagged);
        } else if (voiceState === 'listening') {
            stopListening();
        } else if (voiceState === 'speaking') {
            stopSpeaking();
        }
    }, [voiceState, startListening, stopListening, stopSpeaking]);

    return {
        voiceState,
        liveTranscript,
        toggle,
        stopListening,
        stopSpeaking,
        audioRef,
    };
}
