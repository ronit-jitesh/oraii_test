'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale';

const PHASES: { phase: Phase; label: string; duration: number; color: string }[] = [
    { phase: 'inhale', label: 'Breathe In', duration: 4, color: '#0891B2' },
    { phase: 'hold', label: 'Hold', duration: 7, color: '#7C3AED' },
    { phase: 'exhale', label: 'Breathe Out', duration: 8, color: '#059669' },
];

export default function BreathingPage() {
    const [running, setRunning] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [timer, setTimer] = useState(0);
    const [cycles, setCycles] = useState(0);
    const [phase, setPhase] = useState<Phase>('idle');

    const currentPhase = PHASES[phaseIndex];

    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev >= currentPhase.duration) {
                    // Move to next phase
                    const nextIndex = (phaseIndex + 1) % PHASES.length;
                    setPhaseIndex(nextIndex);
                    if (nextIndex === 0) setCycles(c => c + 1);
                    return 0;
                }
                return prev + 0.05;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [running, phaseIndex, currentPhase.duration]);

    useEffect(() => {
        if (running) {
            setPhase(currentPhase.phase);
        }
    }, [running, phaseIndex, currentPhase.phase]);

    const toggleRunning = useCallback(() => {
        if (!running) {
            setPhaseIndex(0);
            setTimer(0);
            setPhase('inhale');
        }
        setRunning(r => !r);
    }, [running]);

    const reset = () => {
        setRunning(false);
        setPhaseIndex(0);
        setTimer(0);
        setCycles(0);
        setPhase('idle');
    };

    const progress = running ? timer / currentPhase.duration : 0;
    const circleScale = phase === 'inhale' ? 1 + progress * 0.5 : phase === 'exhale' ? 1.5 - progress * 0.5 : 1.5;

    return (
        <div
            className="min-h-[calc(100vh-56px)] lg:min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000"
            style={{
                background: running
                    ? `radial-gradient(circle, ${currentPhase.color}08, ${currentPhase.color}03, var(--color-bg))`
                    : 'var(--color-bg)',
            }}
        >
            {/* Back */}
            <Link href="/patient/games" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={16} /> Back
            </Link>

            {/* Cycle Counter */}
            {cycles > 0 && (
                <div className="absolute top-6 right-6 px-4 py-2 rounded-full" style={{ background: 'var(--color-primary-light)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                        {cycles} cycle{cycles > 1 ? 's' : ''} complete
                    </span>
                </div>
            )}

            {/* Phase Label */}
            <div className="mb-8 text-center">
                <h2
                    className="text-3xl font-bold mb-2 transition-colors duration-500"
                    style={{
                        color: running ? currentPhase.color : 'var(--color-text)',
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    {running ? currentPhase.label : '4-7-8 Breathing'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {running
                        ? `${Math.ceil(currentPhase.duration - timer)}s`
                        : 'A calming breathing technique to ease anxiety'}
                </p>
            </div>

            {/* Breathing Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                {/* Outer ring */}
                <div
                    className="absolute inset-0 rounded-full transition-transform duration-[50ms] ease-linear"
                    style={{
                        background: `${running ? currentPhase.color : '#52B788'}15`,
                        border: `3px solid ${running ? currentPhase.color : '#52B788'}30`,
                        transform: `scale(${circleScale})`,
                    }}
                />
                {/* Inner circle */}
                <div
                    className="w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-[50ms] ease-linear"
                    style={{
                        background: `${running ? currentPhase.color : '#52B788'}20`,
                        transform: `scale(${circleScale * 0.8})`,
                    }}
                >
                    <span
                        className="text-5xl font-bold transition-colors duration-500"
                        style={{ color: running ? currentPhase.color : '#52B788' }}
                    >
                        {running ? Math.ceil(currentPhase.duration - timer) : '∞'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleRunning}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                    style={{ background: running ? '#D97706' : 'var(--color-primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                >
                    {running ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </button>
                {(running || cycles > 0) && (
                    <button
                        onClick={reset}
                        className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:bg-gray-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                        <RotateCcw size={16} />
                    </button>
                )}
            </div>

            {/* Instructions */}
            {!running && cycles === 0 && (
                <div className="mt-10 text-center max-w-xs">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        <strong>How it works:</strong> Breathe in for 4 seconds, hold for 7 seconds, and exhale slowly for 8 seconds. This activates your parasympathetic nervous system.
                    </p>
                </div>
            )}
        </div>
    );
}
