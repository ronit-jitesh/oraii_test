'use client';

import React from 'react';
import { FileText, ClipboardList, Target, Brain } from 'lucide-react';
import type { NoteFormat } from '@/lib/prompts';

interface NoteTemplateSelectorProps {
    selected: NoteFormat;
    onChange: (format: NoteFormat) => void;
    disabled?: boolean;
}

const FORMATS: { key: NoteFormat; label: string; full: string; icon: any; color: string }[] = [
    {
        key: 'ips',
        label: 'IPS',
        full: 'Indian Psychiatric Society 2025',
        icon: Brain,
        color: '#2D6A4F',
    },
    {
        key: 'soap',
        label: 'SOAP',
        full: 'Subjective, Objective, Assessment, Plan',
        icon: FileText,
        color: '#52B788',
    },
    {
        key: 'dap',
        label: 'DAP',
        full: 'Data, Assessment, Plan',
        icon: ClipboardList,
        color: '#40916C',
    },
    {
        key: 'girp',
        label: 'GIRP',
        full: 'Goals, Interventions, Response, Plan',
        icon: Target,
        color: '#B7935A',
    },
];

export default function NoteTemplateSelector({ selected, onChange, disabled }: NoteTemplateSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Note Format
            </label>
            <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((fmt) => {
                    const isActive = selected === fmt.key;
                    const Icon = fmt.icon;

                    return (
                        <button
                            key={fmt.key}
                            onClick={() => onChange(fmt.key)}
                            disabled={disabled}
                            className="relative rounded-xl px-3 py-3 text-left transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[72px]"
                            style={{
                                background: isActive ? fmt.color + '12' : '#F7F5F0',
                                border: `2px solid ${isActive ? fmt.color : '#E2DDD5'}`,
                                boxShadow: isActive ? `0 0 0 1px ${fmt.color}30` : undefined,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div
                                    className="p-1 rounded-md"
                                    style={{
                                        background: isActive ? fmt.color + '20' : '#F0EDE6',
                                    }}
                                >
                                    <Icon
                                        size={14}
                                        style={{ color: isActive ? fmt.color : '#9CA3AF' }}
                                    />
                                </div>
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: isActive ? fmt.color : '#1A1A1A' }}
                                >
                                    {fmt.label}
                                </span>
                            </div>
                            <p className="text-[10px] leading-tight" style={{ color: isActive ? fmt.color + 'CC' : '#9CA3AF' }}>
                                {fmt.full}
                            </p>

                            {/* Active indicator */}
                            {isActive && (
                                <div
                                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                                    style={{ background: fmt.color }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
