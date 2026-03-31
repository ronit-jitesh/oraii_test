'use client';

import React from 'react';
import { VoiceState } from '@/hooks/useVoiceAssistant';

interface VoiceMicButtonProps {
    voiceState: VoiceState;
    liveTranscript: string;
    onToggle: () => void;
}

export function VoiceMicButton({ voiceState, liveTranscript, onToggle }: VoiceMicButtonProps) {
    const isDisabled = voiceState === 'processing';

    const label = {
        idle: 'Talk to ORAII',
        listening: 'Listening...',
        processing: 'Thinking...',
        speaking: 'Tap to stop',
    }[voiceState];

    // Button colour matches ORAII design system
    const bgColor = {
        idle: 'var(--color-primary)',
        listening: '#DC2626',   // red — actively recording
        processing: '#D97706',  // amber — waiting
        speaking: 'var(--color-primary)',
    }[voiceState];

    return (
        <div className="flex flex-col items-center gap-1">
            {/* Live transcript bubble — only shows while listening */}
            {voiceState === 'listening' && liveTranscript && (
                <div
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl text-xs text-center max-w-xs z-10 shadow-md"
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    {liveTranscript}
                </div>
            )}

            <button
                onClick={onToggle}
                disabled={isDisabled}
                title={label}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: bgColor }}
            >
                {/* Pulse ring when listening */}
                {voiceState === 'listening' && (
                    <span
                        className="absolute inset-0 rounded-xl animate-ping opacity-30"
                        style={{ background: '#DC2626' }}
                    />
                )}

                {/* Icon */}
                {voiceState === 'processing' ? (
                    // Spinner
                    <svg
                        className="animate-spin w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                ) : voiceState === 'speaking' ? (
                    // Speaker wave icon
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                ) : voiceState === 'listening' ? (
                    // Stop square
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                ) : (
                    // Microphone
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4z" />
                        <path d="M19 10a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.93V19H9a1 1 0 000 2h6a1 1 0 000-2h-2v-2.07A7 7 0 0019 10z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
