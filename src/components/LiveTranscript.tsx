'use client';

import React, { useEffect, useRef } from 'react';

interface TranscriptSegment {
    speaker: string;
    text: string;
    isDraft: boolean;
    timestamp: number;
}

interface LiveTranscriptProps {
    segments: TranscriptSegment[];
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveTranscript({ segments }: LiveTranscriptProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const el = containerRef.current;
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (isNearBottom) {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [segments]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 scroll-smooth"
        >
            {segments.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <svg className="w-8 h-8 text-[#9CA3AF] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="text-xs font-medium text-[#9CA3AF]">Session not started</p>
                </div>
            )}

            {segments.map((segment, index) => {
                const isSpeaker0 = segment.speaker === 'Speaker 0';
                const showHeader = index === 0 || segments[index - 1].speaker !== segment.speaker;

                return (
                    <div
                        key={index}
                        className={`flex ${isSpeaker0 ? 'justify-start' : 'justify-end'} ${showHeader ? 'mt-2.5' : 'mt-0.5'}`}
                        style={{ animation: 'fadeSlideIn 200ms ease-out' }}
                    >
                        <div className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed transition-opacity duration-150 ${segment.isDraft ? 'opacity-50' : 'opacity-100'
                            } ${isSpeaker0
                                ? 'bg-[#F0EDE6] text-[#1A1A1A] rounded-2xl rounded-tl-sm'
                                : 'bg-[#D8EDDF] text-[#1A1A1A] rounded-2xl rounded-tr-sm'
                            }`}>
                            {showHeader && (
                                <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${isSpeaker0 ? 'text-[#9CA3AF]' : 'text-[#2D6A4F]'
                                    }`}>
                                    {isSpeaker0 ? 'Therapist' : 'Client'}
                                    <span className="ml-1.5 font-normal text-[#9CA3AF]">{formatTime(segment.timestamp)}</span>
                                </p>
                            )}
                            <p>
                                {segment.text}
                                {segment.isDraft && (
                                    <span className="inline-block ml-1 animate-pulse text-[#9CA3AF]">...</span>
                                )}
                            </p>
                        </div>
                    </div>
                );
            })}

            <div ref={bottomRef} className="h-1" />
        </div>
    );
}

