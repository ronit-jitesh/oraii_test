'use client';

import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, MessageSquareQuote } from 'lucide-react';
import { ClinicalTheme } from '@/lib/riskDetection';
import { Intervention, getInterventions } from '@/lib/interventions';

interface InterventionPanelProps {
    themes: ClinicalTheme[];
    isRecording: boolean;
}

const THEME_COLORS: Record<ClinicalTheme, { bg: string; text: string; label: string }> = {
    depression: { bg: '#EDE9FE', text: '#6D28D9', label: 'Depression' },
    anxiety: { bg: '#FEF3C7', text: '#92400E', label: 'Anxiety' },
    trauma: { bg: '#FCE7F3', text: '#9D174D', label: 'Trauma' },
    crisis: { bg: '#FEE2E2', text: '#991B1B', label: 'Crisis' },
    anger: { bg: '#FFEDD5', text: '#9A3412', label: 'Anger' },
    grief: { bg: '#E0E7FF', text: '#3730A3', label: 'Grief' },
    relationship: { bg: '#D1FAE5', text: '#065F46', label: 'Relationship' },
};

export default function InterventionPanel({ themes, isRecording }: InterventionPanelProps) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    if (!isRecording || themes.length === 0) return null;

    const interventions = getInterventions(themes);
    if (interventions.length === 0) return null;

    return (
        <div
            className="bg-white overflow-hidden animate-in slide-in-from-right-3 duration-300"
            style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}
        >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #F0EDE6', background: '#F7F5F0' }}>
                <Sparkles size={16} strokeWidth={1.5} className="text-[#2D6A4F]" />
                <span className="font-semibold text-sm text-[#1A1A1A]">ORAII Suggestions</span>
                <span
                    className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: '#D8EDDF', color: '#2D6A4F' }}
                >
                    Live
                </span>
            </div>

            {/* Detected Themes */}
            <div className="px-4 py-2.5 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid #F0EDE6' }}>
                {themes.map((theme) => {
                    const tc = THEME_COLORS[theme];
                    return (
                        <span
                            key={theme}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: tc.bg, color: tc.text }}
                        >
                            {tc.label}
                        </span>
                    );
                })}
            </div>

            {/* Intervention Cards */}
            <div className="max-h-[400px] overflow-y-auto">
                {interventions.slice(0, 6).map((intervention, idx) => {
                    const isExpanded = expandedIdx === idx;

                    return (
                        <div
                            key={intervention.name}
                            className="transition-colors hover:bg-[#F7F5F0]"
                            style={{ borderBottom: '1px solid #F0EDE6' }}
                        >
                            <button
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                className="w-full text-left px-4 py-3 flex items-start gap-3"
                            >
                                <div
                                    className="p-1.5 rounded-lg mt-0.5 shrink-0"
                                    style={{ background: '#D8EDDF' }}
                                >
                                    <Lightbulb size={14} className="text-[#2D6A4F]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-[#1A1A1A]">
                                            {intervention.name}
                                        </span>
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            style={{ background: '#F0EDE6', color: '#6B7280' }}
                                        >
                                            {intervention.approach}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                                        {intervention.description}
                                    </p>
                                </div>
                                <div className="shrink-0 mt-1 text-[#9CA3AF]">
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 pl-[52px] animate-in slide-in-from-top-1 duration-200">
                                    <div className="space-y-2.5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                                                When to Use
                                            </p>
                                            <p className="text-xs text-[#6B7280] leading-relaxed">
                                                {intervention.whenToUse}
                                            </p>
                                        </div>
                                        <div
                                            className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                                            style={{ background: '#F7F5F0', border: '1px solid #E2DDD5' }}
                                        >
                                            <MessageSquareQuote size={14} className="text-[#2D6A4F] mt-0.5 shrink-0" />
                                            <p className="text-xs text-[#1A1A1A] leading-relaxed italic">
                                                {intervention.examplePhrasing}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

