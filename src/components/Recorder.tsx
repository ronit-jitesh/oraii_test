'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Mic, Square, Bookmark, Volume2, X, Upload } from 'lucide-react';
import LiveTranscript from './LiveTranscript';
import NoteGenerator from './NoteGenerator';
import RiskAlertBanner from './RiskAlertBanner';
import InterventionPanel from './InterventionPanel';
import PrivacySelector from './PrivacySelector';
import ConsentManager, { type ConsentRecord } from './ConsentManager';
import { scanTranscript, detectThemes, RiskAlert, ClinicalTheme, applyCoOccurrenceEscalation } from '@/lib/riskDetection';
import { type PrivacyTier } from '@/lib/ephemeralProcessor';
import { ASR_CONFIG } from '@/lib/modelConfig';
import { MODALITY_CONFIGS, type TherapyModality } from '@/lib/modalityConfig';

interface TranscriptSegment {
    speaker: string;
    text: string;
    isDraft: boolean;
    timestamp: number;
}

interface RecorderProps {
    patientId?: string;
    patientName?: string;
    sessionNumber?: number;
}

export default function Recorder({ patientId, patientName, sessionNumber }: RecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<string>('Ready');
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [asrProvider, setAsrProvider] = useState<'deepgram' | 'deepgram-hi' | 'deepgram-kn' | 'deepgram-multi' | 'simulator' | 'simulator-hinglish'>('deepgram');
    const [language, setLanguage] = useState<string>('en');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const connectionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const [privacyTier, setPrivacyTier] = useState<PrivacyTier>('ephemeral');
    const [showConsent, setShowConsent] = useState(false);
    const [consentGranted, setConsentGranted] = useState(false);
    const [modality, setModality] = useState<TherapyModality>('none');

    // ── Therapist Copilot State ──
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [detectedThemes, setDetectedThemes] = useState<ClinicalTheme[]>([]);
    const scannedCountRef = useRef(0);

    // ── Ambient Listener State ──
    const [ambientPrompt, setAmbientPrompt] = useState(false);
    const [ambientDismissed, setAmbientDismissed] = useState(false);
    const ambientStreamRef = useRef<MediaStream | null>(null);
    const ambientAnalyserRef = useRef<AnalyserNode | null>(null);
    const ambientRafRef = useRef<number | null>(null);
    const speechStartRef = useRef<number | null>(null);

    const hasRecordedSegments = segments.length > 0;

    // ── Upload State ──
    const [sessionMode, setSessionMode] = useState<'live' | 'upload'>('live');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Real-time risk scanning: fires when new final segments appear
    useEffect(() => {
        const finalSegments = segments.filter((s) => !s.isDraft);
        if (finalSegments.length <= scannedCountRef.current) return;

        // Scan only new final segments
        const newSegments = finalSegments.slice(scannedCountRef.current);
        scannedCountRef.current = finalSegments.length;

        for (const seg of newSegments) {
            const alerts = scanTranscript(seg.text, seg.timestamp);
            if (alerts.length > 0) {
                setRiskAlerts((prev) => applyCoOccurrenceEscalation([...prev, ...alerts]));
            }
        }

        // Update detected themes from full transcript
        const fullText = finalSegments.map((s) => s.text).join(' ');
        setDetectedThemes(detectThemes(fullText));
    }, [segments]);

    const handleDismissAlert = useCallback((alertId: string) => {
        setRiskAlerts((prev) =>
            prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
        );
    }, []);

    // ── Ambient Listener: detect microphone audio when idle ──
    useEffect(() => {
        if (isRecording || hasRecordedSegments || ambientDismissed) return;

        let cancelled = false;

        const startAmbientListening = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                ambientStreamRef.current = stream;
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 512;
                source.connect(analyser);
                ambientAnalyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const THRESHOLD = 30; // audio level threshold (0-128)
                const SPEECH_DURATION_MS = 2000; // 2 seconds sustained

                const checkLevel = () => {
                    if (cancelled) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                    if (avg > THRESHOLD) {
                        if (!speechStartRef.current) {
                            speechStartRef.current = Date.now();
                        } else if (Date.now() - speechStartRef.current > SPEECH_DURATION_MS) {
                            setAmbientPrompt(true);
                            // Stop listening once prompt is shown
                            stream.getTracks().forEach(t => t.stop());
                            return;
                        }
                    } else {
                        speechStartRef.current = null;
                    }

                    ambientRafRef.current = requestAnimationFrame(checkLevel);
                };

                checkLevel();
            } catch {
                // Microphone access denied — silently fail
            }
        };

        startAmbientListening();

        return () => {
            cancelled = true;
            if (ambientRafRef.current) cancelAnimationFrame(ambientRafRef.current);
            if (ambientStreamRef.current) ambientStreamRef.current.getTracks().forEach(t => t.stop());
            speechStartRef.current = null;
        };
    }, [isRecording, hasRecordedSegments, ambientDismissed]);

    const startRecording = async () => {
        if (asrProvider === 'simulator' || asrProvider === 'simulator-hinglish') {
            await startSimulatorRecording();
        } else {
            // All live languages go through Deepgram Nova-3
            let dgLang = 'en';
            if (asrProvider === 'deepgram-hi') dgLang = 'hi';
            else if (asrProvider === 'deepgram-kn') dgLang = 'kn';
            else if (asrProvider === 'deepgram-multi') dgLang = 'multi';
            await startDeepgramRecording(dgLang);
        }
    };

    const MOCK_SCRIPT = [
        { speaker: "Speaker 0", text: "Hello, thanks for coming in today. How have you been feeling since our last session?", delay: 1000 },
        { speaker: "Speaker 1", text: "To be honest, I've been feeling quite anxious lately, especially at night.", delay: 2500 },
        { speaker: "Speaker 0", text: "I'm sorry to hear that. Can you tell me more about what those feelings of anxiety are like for you?", delay: 3000 },
        { speaker: "Speaker 1", text: "It's like this constant weight on my chest. I start overthinking everything I did during the day, worrying if I made a mistake at my new job.", delay: 4000 },
        { speaker: "Speaker 0", text: "It sounds like you're experiencing some imposter syndrome with the new role. Have you noticed any physical symptoms, like trouble sleeping or changes in appetite?", delay: 4500 },
        { speaker: "Speaker 1", text: "Yes, definitely trouble sleeping. I've been waking up at 3 AM with my heart racing. And I've been feeling pretty hopeless about it ever getting better.", delay: 4000 },
        { speaker: "Speaker 0", text: "I understand. That sounds very distressing. We should definitely monitor those feelings of hopelessness. Any thoughts of self-harm or suicide?", delay: 5000 },
        { speaker: "Speaker 1", text: "No, nothing like that. I don't want to hurt myself, I just want the noise in my head to stop.", delay: 3500 },
        { speaker: "Speaker 0", text: "I'm glad to hear you're safe. Let's work on some cognitive reframing today. I also want to suggest a follow-up in two weeks.", delay: 4000 },
    ];

    const MOCK_HINGLISH_SCRIPT = [
        { speaker: "Speaker 0", text: "Namaste Alex, kaise hain aap? Aaj hamare sesssion mein aap kis cheez par focus karna chahenge?", delay: 1000 },
        { speaker: "Speaker 1", text: "Doctor, main theek hoon par work ka tension bahut zyada ho gaya hai. Mujhe constant anxiety rehti hai.", delay: 2500 },
        { speaker: "Speaker 0", text: "I understand. Work anxiety handle karna difficult hota hai. Kya aapko sleep issues bhi ho rahi hain?", delay: 3000 },
        { speaker: "Speaker 1", text: "Haan, bilkul. Raat ko neend nahi aati, bas dimag mein wahi chalta rehta hai ki kal office mein kya hoga. I feel very hopeless sometimes.", delay: 4000 },
        { speaker: "Speaker 0", text: "Hopelessness ek serious symptom hai. Please tell me, kya aapke man mein self-harm ya suicide ke thoughts aate hain?", delay: 4500 },
        { speaker: "Speaker 1", text: "Nahi, aise thoughts nahi hain. Bas main chahta hoon ki ye stress kam ho jaye so I can relax properly.", delay: 3500 },
        { speaker: "Speaker 0", text: "Theek hai. Ham CBT techniques use karenge to manage your thoughts. Next week phir milte hain.", delay: 4000 },
    ];

    const startSimulatorRecording = async () => {
        setSegments([]);
        setStatus('Initializing Simulator...');
        setIsRecording(true);

        let currentIndex = 0;
        const script = asrProvider === 'simulator-hinglish' ? MOCK_HINGLISH_SCRIPT : MOCK_SCRIPT;

        const nextStep = () => {
            if (currentIndex >= script.length) {
                setStatus('Simulation Complete');
                setIsRecording(false);
                return;
            }

            const item = script[currentIndex];
            setStatus(`Recording (Simulated: ${item.speaker})...`);

            // Simulate typing effect / draft state
            const words = item.text.split(' ');
            let wordIndex = 0;

            const typeInterval = setInterval(() => {
                const currentText = words.slice(0, wordIndex + 1).join(' ');

                setSegments(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.speaker === item.speaker && last.isDraft) {
                        return [...prev.slice(0, -1), {
                            speaker: item.speaker,
                            text: currentText,
                            isDraft: wordIndex < words.length - 1,
                            timestamp: Date.now()
                        }];
                    }
                    return [...prev, {
                        speaker: item.speaker,
                        text: currentText,
                        isDraft: wordIndex < words.length - 1,
                        timestamp: Date.now()
                    }];
                });

                wordIndex++;
                if (wordIndex >= words.length) {
                    clearInterval(typeInterval);
                    currentIndex++;
                    setTimeout(nextStep, 1500); // Gap between speakers
                }
            }, 150); // Speed of "typing"
        };

        setTimeout(nextStep, 1000);
    };

    const startDeepgramRecording = async (lang: string = 'en') => {
        setSegments([]);
        setStatus('Initializing...');
        try {
            const response = await fetch('/api/deepgram');
            const data = await response.json();

            if (!data.key) {
                throw new Error('No API key returned');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const deepgram = createClient(data.key);

            // Deepgram Nova-3 supports: en, hi, kn, multi (code-mixed)
            const langLabel = lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : lang === 'multi' ? 'Multi-language' : 'English';
            console.log(`[Deepgram] Starting with language: ${lang} (${langLabel})`);

            const connection = deepgram.listen.live({
                model: lang === 'multi' ? 'nova-3' : 'nova-3',
                language: lang === 'multi' ? 'multi' : lang,
                smart_format: true,
                diarize: true,
                interim_results: true,
            });

            connection.on(LiveTranscriptionEvents.Open, () => {
                setStatus(`Connected (${langLabel})`);
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

                mediaRecorder.addEventListener('dataavailable', (event) => {
                    if (event.data.size > 0 && connection.getReadyState() === 1) {
                        connection.send(event.data);
                    }
                });

                mediaRecorder.start(250);
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);
                setStatus(`Recording (${langLabel})...`);
            });

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const transcript = data.channel.alternatives[0]?.transcript;
                if (transcript) handleTranscript(data);
            });

            connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error('Deepgram Error:', err);
                setStatus('Connection Error');
            });

            connectionRef.current = connection;
        } catch (error) {
            console.error('Start error:', error);
            setStatus('Error: ' + (error as Error).message);
        }
    };

    // Sarvam WebSocket removed — browser cannot set custom HTTP headers.
    // All live streaming now goes through Deepgram Nova-3 (supports hi, kn, multi).
    // Sarvam REST API (saarika:v2.5) is still used for file upload transcription.

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (connectionRef.current) {
            connectionRef.current.finish(); // always Deepgram now
            connectionRef.current = null;
        }

        setIsRecording(false);
        setStatus('Session Ended');
    };

    const handleTranscript = (data: any) => {
        const alternative = data.channel.alternatives[0];
        const transcript = alternative.transcript;
        const isFinal = data.is_final;

        // Use Speaker 0/1 labels - AI will determine actual roles
        const speakerId = alternative.words?.[0]?.speaker ?? 0;
        const speakerLabel = `Speaker ${speakerId}`;

        if (transcript.length > 0) {
            setSegments(prev => {
                const last = prev[prev.length - 1];

                // If same speaker and still a draft, update it
                if (last && last.speaker === speakerLabel && last.isDraft) {
                    return [...prev.slice(0, -1), {
                        speaker: speakerLabel,
                        text: transcript,
                        isDraft: !isFinal,
                        timestamp: Date.now()
                    }];
                }

                // New speaker or final segment, add new entry
                return [...prev, {
                    speaker: speakerLabel,
                    text: transcript,
                    isDraft: !isFinal,
                    timestamp: Date.now()
                }];
            });
        }
    };

    const handleConsentSave = async (record: ConsentRecord) => {
        // Persist consent to Supabase
        if (patientId) {
            try {
                const { savePatientConsent } = await import('@/app/actions');
                await savePatientConsent({
                    patientId,
                    treatment: record.treatment,
                    dataProcessing: record.dataProcessing,
                    recording: record.recording,
                    aiProcessing: record.aiProcessing,
                    dataSharing: record.dataSharing,
                });
            } catch (err) {
                console.error('Failed to persist consent:', err);
            }
        }
        setConsentGranted(record.dataProcessing && record.treatment);
        setShowConsent(false);
    };

    // Gate: must have consent before starting session
    const handleStartSession = () => {
        if (patientId && !consentGranted) {
            setShowConsent(true);
            return;
        }
        startRecording();
    };

    // ── File Upload Handler ──
    const handleFileUpload = async (file: File) => {
        setUploadFile(file);
        setUploadError(null);
        setIsUploading(true);
        setSegments([]);
        setStatus('Transcribing uploaded file...');

        try {
            const formData = new FormData();
            formData.append('audio', file);
            // Map ASR provider to language for Deepgram pre-recorded API
            let uploadLang = 'multi'; // default: auto-detect language
            if (asrProvider === 'deepgram') uploadLang = 'en';
            else if (asrProvider === 'deepgram-hi') uploadLang = 'hi-IN';
            else if (asrProvider === 'deepgram-kn') uploadLang = 'kn-IN';
            else if (asrProvider === 'deepgram-multi') uploadLang = 'multi';
            formData.append('language', uploadLang);

            const response = await fetch('/api/transcribe-file', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Transcription failed');
            }

            // Split transcript into segment-like structure for the UI
            const transcriptText = data.transcript;
            const sentences = transcriptText.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim());

            const uploadedSegments: TranscriptSegment[] = sentences.map((sentence: string, i: number) => ({
                speaker: 'Speaker 0',
                text: sentence.trim(),
                isDraft: false,
                timestamp: Date.now() + i,
            }));

            setSegments(uploadedSegments);
            setStatus(`Transcribed (${data.language || 'auto'}) — ${uploadedSegments.length} segments`);

        } catch (err) {
            setUploadError((err instanceof Error ? err.message : String(err)) || 'Upload failed');
            setStatus('Upload Error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    // Format transcript for AI with speaker labels
    const fullTranscript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
            {/* ─── Left Sidebar (220px) ─── */}
            <div className="w-[220px] shrink-0 bg-white border-r border-[#E2DDD5] flex flex-col p-[12px_14px] overflow-hidden">
                {/* TOP — fixed/scrollable content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-2" style={{ scrollbarWidth: 'none' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                    ` }} />
                    <div className="hide-scrollbar">
                        {/* Session info */}
                        <div className="mb-2">
                            <p className="text-[0.65rem] font-bold tracking-widest text-[#9CA3AF] uppercase">Session</p>
                            <div className="mt-1">
                                <p className="text-[1rem] font-semibold text-[#1A1A1A]">{patientName || 'Unnamed Patient'}</p>
                                <p className="text-[0.75rem] text-[#6B7280] mt-0.5 font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : hasRecordedSegments ? 'bg-emerald-400' : 'bg-[#9CA3AF]'}`} />
                                <span className={`text-[0.75rem] font-medium ${isRecording ? 'text-red-400' : hasRecordedSegments ? 'text-emerald-400' : 'text-[#9CA3AF]'}`}>
                                    {status === 'Ready' && !isRecording && !hasRecordedSegments ? 'Ready' : status}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-[#E2DDD5] mx-2 mb-2" />

                        {/* Controls */}
                        <div className="space-y-2">
                            {/* Mode */}
                            {!isRecording && !hasRecordedSegments && (
                                <div className="flex bg-[#F0EDE6] p-0.5 rounded-lg mb-2">
                                    <button onClick={() => setSessionMode('live')}
                                        className={`flex-1 py-[7px] px-[10px] text-[0.8rem] font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${sessionMode === 'live' ? 'bg-[#2D6A4F] text-white' : 'text-[#9CA3AF]'}`}>
                                        <Mic size={11} /> Live
                                    </button>
                                    <button onClick={() => setSessionMode('upload')}
                                        className={`flex-1 py-[7px] px-[10px] text-[0.8rem] font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${sessionMode === 'upload' ? 'bg-[#2D6A4F] text-white' : 'text-[#9CA3AF]'}`}>
                                        <Upload size={11} /> Upload
                                    </button>
                                </div>
                            )}

                            {/* Language */}
                            {sessionMode === 'live' && !isRecording && !hasRecordedSegments && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[0.65rem] font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">Therapeutic Modality</p>
                                        <select
                                            value={modality}
                                            onChange={(e) => setModality(e.target.value as TherapyModality)}
                                            className="w-full text-[0.8rem] px-[7px] py-[7px] rounded-lg border border-[#E2DDD5] bg-[#F0EDE6] text-[#9CA3AF] outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            {Object.values(MODALITY_CONFIGS).map(m => (
                                                <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <p className="text-[0.65rem] font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">Language</p>
                                        <select
                                            value={asrProvider}
                                            onChange={(e) => {
                                                const v = e.target.value as typeof asrProvider;
                                                setAsrProvider(v);
                                                if (v === 'deepgram') setLanguage('en');
                                                else if (v === 'deepgram-hi') setLanguage('hi');
                                                else if (v === 'deepgram-kn') setLanguage('kn');
                                                else if (v === 'deepgram-multi') setLanguage('multi');
                                            }}
                                            className="w-full text-[0.8rem] px-[7px] py-[7px] rounded-lg border border-[#E2DDD5] bg-[#F0EDE6] text-[#9CA3AF] outline-none focus:border-[#2D6A4F] transition-all cursor-pointer"
                                        >
                                            <option value="deepgram">🇬🇧  English</option>
                                            <option value="deepgram-hi">🇮🇳  Hindi (हिंदी)</option>
                                            <option value="deepgram-kn">🇮🇳  Kannada (ಕನ್ನಡ)</option>
                                            <option value="deepgram-multi">🌐  Multi (Hinglish)</option>
                                            <option value="simulator">🧪  Simulator (EN)</option>
                                            <option value="simulator-hinglish">🧪  Simulator (HIN)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Privacy */}
                            {sessionMode === 'live' && !isRecording && !hasRecordedSegments && (
                                <div className="space-y-1.5">
                                    <div>
                                        <p className="text-[0.65rem] font-bold tracking-widest text-[#9CA3AF] uppercase mb-[6px]">Privacy Tier</p>
                                        <PrivacySelector value={privacyTier} onChange={setPrivacyTier} disabled={isRecording} />
                                    </div>

                                    {/* Session Privacy Info Block */}
                                    <div className="bg-[#F0EDE6] border border-[#E2DDD5] rounded-[10px] p-[8px_10px]">
                                        <p className="text-[#2D6A4F] font-semibold text-[0.8rem] mb-1">
                                            🔒 Session Privacy
                                        </p>
                                        <p className="text-[#6B7280] text-[0.7rem]" style={{ lineHeight: '1.5' }}>
                                            Your selected privacy tier controls how audio is
                                            handled. No data is stored beyond your chosen mode.
                                            Client consent is required before starting.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM — pinned buttons */}
                <div className="flex-shrink-0 pt-[10px] border-t border-[#E2DDD5] flex flex-col gap-2 bg-white pb-2">
                    {sessionMode === 'live' && !hasRecordedSegments && (
                        <button
                            onClick={() => {
                                console.log('Start Session Clicked - context:', { consentGranted, patientId });
                                handleStartSession();
                            }}
                            disabled={!consentGranted}
                            style={{
                                width: '100%',
                                background: consentGranted ? '#2D6A4F' : '#F0EDE6',
                                color: consentGranted ? '#FFFFFF' : '#9CA3AF',
                                border: consentGranted ? 'none' : '1.5px solid #E2DDD5',
                                borderRadius: '9999px',
                                padding: '10px 16px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: consentGranted ? 'pointer' : 'not-allowed',
                                opacity: consentGranted ? 1 : 0.6,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                if (consentGranted) e.currentTarget.style.background = '#1B4D38';
                            }}
                            onMouseOut={(e) => {
                                if (consentGranted) e.currentTarget.style.background = '#2D6A4F';
                            }}
                        >
                            Start Session
                        </button>
                    )}

                    {!isRecording && patientId && (
                        <button
                            onClick={() => !consentGranted && setShowConsent(true)}
                            disabled={consentGranted}
                            className={`w-full rounded-full p-[10px_16px] font-sans font-semibold text-[0.875rem] text-center transition-all duration-200 flex items-center justify-center gap-2 shrink-0
                                ${consentGranted
                                    ? 'bg-[#D8EDDF] text-[#2D6A4F] border-[1.5px] border-[#2D6A4F] cursor-default'
                                    : 'bg-[#2D6A4F] text-white cursor-pointer hover:bg-[#1B4D38]'}`}
                        >
                            <div className={`rounded-full w-[22px] h-[22px] flex items-center justify-center text-[0.72rem] font-bold shrink-0 transition-colors
                                ${consentGranted ? 'bg-[#2D6A4F] text-white' : 'bg-[rgba(255,255,255,0.25)] text-white'}`}>
                                {consentGranted ? '✓' : (patientName ? patientName.charAt(0).toUpperCase() : 'N')}
                            </div>
                            <span>{consentGranted ? 'Consent Granted' : 'Consent Required'}</span>
                        </button>
                    )}

                    {isRecording && (
                        <button onClick={stopRecording}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-full transition-all duration-150 flex items-center justify-center gap-2">
                            <Square size={12} fill="currentColor" />
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Centre Column: Vertically Split TOP (Transcript) / BOTTOM (Notes) ─── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* TOP section: Live Transcript (45%) */}
                <div className="h-[45%] flex-shrink-0 bg-white border-b border-[#E2DDD5] flex flex-col overflow-hidden p-[16px_20px]">
                    {/* Header */}
                    <div className="flex items-center gap-[10px] mb-3 pb-[10px] border-b border-[#E2DDD5] shrink-0">
                        <h3 className="text-[1rem] font-semibold text-[#1A1A1A] leading-tight" style={{ fontFamily: 'Lora, serif' }}>Live Transcript</h3>
                        <span className="bg-[#D8EDDF] text-[#2D6A4F] rounded-full px-[10px] py-0.5 text-[0.7rem] font-bold tracking-wide uppercase">DIARIZATION</span>
                        {segments.length > 0 && (
                            <span className="ml-auto text-[10px] text-[#9CA3AF] font-medium">{segments.filter(s => !s.isDraft).length} segments</span>
                        )}
                    </div>

                    {/* Transcript content container */}
                    <div className="flex-1 overflow-y-auto">
                        {segments.length === 0 && !isRecording ? (
                            <div className="h-full bg-[#FAFAF8] border border-[#E2DDD5] rounded-[10px] flex flex-col items-center justify-center gap-2">
                                <Mic size={32} className="text-[#D1D5DB]" />
                                <p className="text-[0.85rem] text-[#9CA3AF]">Session not started</p>
                            </div>
                        ) : (
                            <LiveTranscript segments={segments} />
                        )}
                    </div>
                </div>

                {/* BOTTOM section: Notes (takes all remaining space) */}
                <div className="flex-1 overflow-y-auto bg-[#F7F5F0] p-[20px_24px]">
                    <NoteGenerator
                        transcript={fullTranscript}
                        patientId={patientId}
                        patientName={patientName}
                        privacyTier={privacyTier}
                        modality={modality}
                    />
                </div>
            </div>

            {/* ─── Right Panel: HERO — Clinical Notes (340px) ─── */}
            <div className="w-[340px] shrink-0 bg-white border-l border-[#E2DDD5] overflow-hidden">
                <div className="h-full flex flex-col">
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-[#E2DDD5]">
                            <h3 className="text-base font-bold tracking-wide text-[#2D6A4F] uppercase" style={{ fontFamily: 'Lora, serif' }}>ORAII Copilot</h3>
                        </div>

                        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                            <RiskAlertBanner alerts={riskAlerts} onDismiss={handleDismissAlert} />
                            <InterventionPanel themes={detectedThemes} isRecording={isRecording} />

                            {riskAlerts.length === 0 && detectedThemes.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
                                    <Bookmark className="text-[#D8EDDF]" size={40} />
                                    <p className="text-base font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Lora, serif' }}>
                                        {isRecording ? 'Analyzing session...' : 'Start a session to activate Copilot'}
                                    </p>
                                    <p className="text-xs text-[#6B7280]">Risk alerts and clinical themes will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Consent Modal */}
            {showConsent && patientId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <ConsentManager
                        patientId={patientId}
                        patientName={patientName || 'Patient'}
                        onSave={handleConsentSave}
                        onCancel={() => setShowConsent(false)}
                    />
                </div>
            )}
        </div>
    );
}

