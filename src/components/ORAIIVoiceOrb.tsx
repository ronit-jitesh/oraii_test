'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { VoiceState } from '@/hooks/useVoiceAssistant';

interface ORAIIVoiceOrbProps {
    voiceState: VoiceState;
    liveTranscript: string;
    onToggle: () => void;
    onClose: () => void;
    audioElement?: HTMLAudioElement | null;
}

export function ORAIIVoiceOrb({
    voiceState,
    liveTranscript,
    onToggle,
    onClose,
    audioElement,
}: ORAIIVoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // ── Real-time waveform when ORAII is speaking ──
    const startWaveform = useCallback(() => {
        if (!audioElement || !canvasRef.current) return;

        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContext();
            }
            const ctx = audioCtxRef.current;

            if (!sourceRef.current) {
                sourceRef.current = ctx.createMediaElementSource(audioElement);
                sourceRef.current.connect(ctx.destination);
            }

            if (!analyserRef.current) {
                analyserRef.current = ctx.createAnalyser();
                analyserRef.current.fftSize = 128;
                sourceRef.current.connect(analyserRef.current);
            }

            const analyser = analyserRef.current;
            const canvas = canvasRef.current;
            const ctxCanvas = canvas.getContext('2d')!;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                animFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                const W = canvas.width;
                const H = canvas.height;
                ctxCanvas.clearRect(0, 0, W, H);

                const barCount = 32;
                const barW = 3;
                const gap = (W - barCount * barW) / (barCount + 1);

                for (let i = 0; i < barCount; i++) {
                    const idx = Math.floor((i / barCount) * bufferLength);
                    const v = dataArray[idx] / 255;
                    const barH = Math.max(4, v * H * 0.85);
                    const x = gap + i * (barW + gap);
                    const y = (H - barH) / 2;

                    // Gradient bar — green to teal
                    const grad = ctxCanvas.createLinearGradient(x, y, x, y + barH);
                    grad.addColorStop(0, 'rgba(82,183,136,0.9)');
                    grad.addColorStop(1, 'rgba(45,106,79,0.6)');
                    ctxCanvas.fillStyle = grad;
                    ctxCanvas.beginPath();
                    ctxCanvas.roundRect(x, y, barW, barH, 2);
                    ctxCanvas.fill();
                }
            };
            draw();
        } catch (_) {
            // Audio context already exists or blocked — show static bars
            drawStaticBars();
        }
    }, [audioElement]);

    const drawStaticBars = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;
        const barCount = 32;
        const barW = 3;
        const gap = (W - barCount * barW) / (barCount + 1);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, W, H);
            const t = Date.now() / 400;
            for (let i = 0; i < barCount; i++) {
                const v = 0.3 + 0.5 * Math.abs(Math.sin(t + i * 0.4));
                const barH = Math.max(4, v * H * 0.8);
                const x = gap + i * (barW + gap);
                const y = (H - barH) / 2;
                const grad = ctx.createLinearGradient(x, y, x, y + barH);
                grad.addColorStop(0, 'rgba(82,183,136,0.9)');
                grad.addColorStop(1, 'rgba(45,106,79,0.6)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, barH, 2);
                ctx.fill();
            }
        };
        draw();
    };

    const stopWaveform = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    useEffect(() => {
        if (voiceState === 'speaking') {
            startWaveform();
        } else {
            stopWaveform();
        }
        return () => stopWaveform();
    }, [voiceState, startWaveform, stopWaveform]);

    // ── State config ──
    const stateConfig = {
        idle: {
            orbClass: 'oraii-idle',
            label: 'Tap to talk',
            sublabel: 'I\'m listening',
            showRipples: false,
            showWave: false,
            showDots: false,
        },
        listening: {
            orbClass: 'oraii-listening',
            label: 'Listening...',
            sublabel: liveTranscript || 'Speak now',
            showRipples: true,
            showWave: false,
            showDots: false,
        },
        processing: {
            orbClass: 'oraii-processing',
            label: 'Thinking...',
            sublabel: 'ORAII is reflecting',
            showRipples: false,
            showWave: false,
            showDots: true,
        },
        speaking: {
            orbClass: 'oraii-speaking',
            label: 'ORAII is speaking',
            sublabel: 'Tap to stop',
            showRipples: false,
            showWave: true,
            showDots: false,
        },
    }[voiceState];

    return (
        <>
            {/* Inline keyframes */}
            <style>{`
                @keyframes orbBreath {
                    0%, 100% { transform: scale(1); opacity: 0.95; }
                    50% { transform: scale(1.06); opacity: 1; }
                }
                @keyframes orbSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes orbPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes ripple {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.8); opacity: 0; }
                }
                @keyframes dotOrbit {
                    from { transform: rotate(0deg) translateX(54px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
                }
                @keyframes dotOrbit2 {
                    from { transform: rotate(120deg) translateX(54px) rotate(-120deg); }
                    to { transform: rotate(480deg) translateX(54px) rotate(-480deg); }
                }
                @keyframes dotOrbit3 {
                    from { transform: rotate(240deg) translateX(54px) rotate(-240deg); }
                    to { transform: rotate(600deg) translateX(54px) rotate(-600deg); }
                }
                @keyframes ringRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes ringRotateRev {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes overlayIn {
                    from { opacity: 0; backdrop-filter: blur(0px); }
                    to { opacity: 1; backdrop-filter: blur(16px); }
                }
                .oraii-idle .orb-core {
                    animation: orbBreath 3.5s ease-in-out infinite;
                    background: radial-gradient(circle at 38% 35%, #52B788, #2D6A4F 60%, #1B4D38);
                    box-shadow: 0 0 40px rgba(82,183,136,0.4), 0 0 80px rgba(45,106,79,0.2);
                }
                .oraii-listening .orb-core {
                    animation: orbPulse 1s ease-in-out infinite;
                    background: radial-gradient(circle at 38% 35%, #EF4444, #DC2626 60%, #991B1B);
                    box-shadow: 0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(220,38,38,0.25);
                }
                .oraii-processing .orb-core {
                    background: radial-gradient(circle at 38% 35%, #F59E0B, #D97706 60%, #92400E);
                    box-shadow: 0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(217,119,6,0.25);
                }
                .oraii-speaking .orb-core {
                    animation: orbPulse 0.8s ease-in-out infinite;
                    background: radial-gradient(circle at 38% 35%, #52B788, #2D6A4F 50%, #1B4D38);
                    box-shadow: 0 0 50px rgba(82,183,136,0.6), 0 0 100px rgba(45,106,79,0.3);
                }
                .ring-1 { animation: ringRotate 8s linear infinite; }
                .ring-2 { animation: ringRotateRev 12s linear infinite; }
                .ring-3 { animation: ringRotate 20s linear infinite; }
            `}</style>

            {/* Full overlay */}
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16"
                style={{
                    background: 'rgba(10, 20, 15, 0.92)',
                    backdropFilter: 'blur(20px)',
                    animation: 'overlayIn 0.3s ease-out forwards',
                }}
            >
                {/* Top bar */}
                <div className="flex items-center justify-between w-full px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xl tracking-widest" style={{ fontFamily: 'Lora, serif', letterSpacing: '0.15em' }}>
                            ORAII
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(82,183,136,0.2)', color: '#52B788', border: '1px solid rgba(82,183,136,0.3)' }}>
                            o·rah·eee
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Orb section */}
                <div className={`relative flex items-center justify-center ${stateConfig.orbClass}`}>
                    {/* Ripple rings — listening state */}
                    {stateConfig.showRipples && (
                        <>
                            <div className="absolute rounded-full border border-red-400 opacity-0"
                                style={{ width: 160, height: 160, animation: 'ripple 1.8s ease-out infinite' }} />
                            <div className="absolute rounded-full border border-red-400 opacity-0"
                                style={{ width: 160, height: 160, animation: 'ripple 1.8s ease-out infinite 0.6s' }} />
                            <div className="absolute rounded-full border border-red-400 opacity-0"
                                style={{ width: 160, height: 160, animation: 'ripple 1.8s ease-out infinite 1.2s' }} />
                        </>
                    )}

                    {/* Orbital rings — idle / speaking */}
                    {(voiceState === 'idle' || voiceState === 'speaking') && (
                        <>
                            <div className="absolute rounded-full ring-1" style={{
                                width: 200, height: 200,
                                border: '1px solid rgba(82,183,136,0.25)',
                                borderTopColor: 'rgba(82,183,136,0.6)',
                            }} />
                            <div className="absolute rounded-full ring-2" style={{
                                width: 230, height: 230,
                                border: '1px dashed rgba(82,183,136,0.15)',
                                borderRightColor: 'rgba(82,183,136,0.4)',
                            }} />
                        </>
                    )}

                    {/* Orbiting dots — processing */}
                    {stateConfig.showDots && (
                        <>
                            <div className="absolute" style={{ width: 0, height: 0 }}>
                                <div style={{
                                    position: 'absolute', width: 10, height: 10,
                                    borderRadius: '50%', background: '#F59E0B',
                                    top: -5, left: -5,
                                    animation: 'dotOrbit 2s linear infinite',
                                    boxShadow: '0 0 8px rgba(245,158,11,0.8)',
                                }} />
                            </div>
                            <div className="absolute" style={{ width: 0, height: 0 }}>
                                <div style={{
                                    position: 'absolute', width: 7, height: 7,
                                    borderRadius: '50%', background: '#FCD34D',
                                    top: -3.5, left: -3.5,
                                    animation: 'dotOrbit2 2s linear infinite',
                                    boxShadow: '0 0 6px rgba(252,211,77,0.8)',
                                }} />
                            </div>
                            <div className="absolute" style={{ width: 0, height: 0 }}>
                                <div style={{
                                    position: 'absolute', width: 6, height: 6,
                                    borderRadius: '50%', background: '#92400E',
                                    top: -3, left: -3,
                                    animation: 'dotOrbit3 2s linear infinite',
                                    boxShadow: '0 0 6px rgba(146,64,14,0.8)',
                                }} />
                            </div>
                        </>
                    )}

                    {/* Main orb — clickable */}
                    <button
                        onClick={onToggle}
                        disabled={voiceState === 'processing'}
                        className="orb-core relative flex items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed"
                        style={{ width: 160, height: 160 }}
                    >
                        {/* Gloss highlight */}
                        <div style={{
                            position: 'absolute', top: 20, left: 28,
                            width: 50, height: 30,
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '50%',
                            transform: 'rotate(-30deg)',
                            pointerEvents: 'none',
                        }} />

                        {/* State icon */}
                        {voiceState === 'idle' && (
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
                                <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4z" />
                                <path d="M19 10a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.93V19H9a1 1 0 000 2h6a1 1 0 000-2h-2v-2.07A7 7 0 0019 10z" />
                            </svg>
                        )}
                        {voiceState === 'listening' && (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                                <rect x="6" y="6" width="12" height="12" rx="3" />
                            </svg>
                        )}
                        {voiceState === 'processing' && (
                            <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        )}
                        {voiceState === 'speaking' && (
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Waveform canvas — speaking state */}
                <div style={{ height: 64, width: 280 }}>
                    {stateConfig.showWave && (
                        <canvas
                            ref={canvasRef}
                            width={280}
                            height={64}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                    {voiceState === 'listening' && (
                        // Mic bars — static but animated
                        <div className="flex items-center justify-center gap-1 h-full">
                            {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8, 0.5].map((h, i) => (
                                <div key={i} style={{
                                    width: 4, borderRadius: 2,
                                    background: 'rgba(239,68,68,0.7)',
                                    height: `${h * 48}px`,
                                    animation: `orbPulse ${0.6 + i * 0.1}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.08}s`,
                                }} />
                            ))}
                        </div>
                    )}
                    {voiceState === 'processing' && (
                        <div className="flex items-center justify-center gap-2 h-full">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2 h-2 rounded-full" style={{
                                    background: '#F59E0B',
                                    animation: `orbPulse 0.9s ease-in-out infinite`,
                                    animationDelay: `${i * 0.3}s`,
                                }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Label */}
                <div className="text-center px-8" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
                    <p className="text-white text-lg font-semibold mb-1">{stateConfig.label}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 280 }}>
                        {stateConfig.sublabel}
                    </p>
                </div>

                {/* Bottom hint */}
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    ORAII is an AI companion, not a therapist
                </p>
            </div>
        </>
    );
}
