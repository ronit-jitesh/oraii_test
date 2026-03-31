'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mic, AlertTriangle, Check, type LucideIcon } from 'lucide-react';
import { PrivacyTier, PRIVACY_TIERS } from '@/lib/ephemeralProcessor';

interface PrivacySelectorProps {
    value: PrivacyTier;
    onChange: (tier: PrivacyTier) => void;
    disabled?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
    ShieldCheck,
    Mic,
    AlertTriangle,
};

export default function PrivacySelector({ value, onChange, disabled }: PrivacySelectorProps) {
    const [showDetail, setShowDetail] = useState(false);

    const tiers = Object.values(PRIVACY_TIERS);

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 mb-1"> {/* Changed gap-1.5 to gap-1 and added mb-1 */}
                {tiers.map((tier) => {
                    const isSelected = value === tier.tier;
                    const IconComp = ICON_MAP[tier.icon] || ShieldCheck;

                    return (
                        <div
                            key={tier.tier}
                            onClick={() => !disabled && onChange(tier.tier)}
                            className={`
                                relative flex flex-col items-center p-[5px_3px] rounded-lg text-center
                                transition-all duration-150 border-[1.5px] font-sans antialiased
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                ${isSelected
                                    ? 'bg-[#D8EDDF] border-[#2D6A4F] text-[#2D6A4F]'
                                    : 'bg-[#F0EDE6] border-[#E2DDD5] text-[#1A1A1A] hover:bg-[#E8F5EE] hover:border-[#52B788]'
                                }
                            `}
                        >
                            <IconComp
                                size={14}
                                className="transition-colors duration-150 mb-0.5"
                                color={isSelected ? '#2D6A4F' : '#9CA3AF'}
                            />
                            <span
                                className="text-[0.62rem] font-semibold leading-tight"
                                style={{ color: isSelected ? '#2D6A4F' : '#1A1A1A' }}
                            >
                                {tier.label}
                            </span>
                            <p
                                className="text-[0.58rem] leading-[1.2] mt-0.5 text-center"
                                style={{
                                    color: isSelected ? '#2D6A4F' : '#6B7280',
                                    fontWeight: isSelected ? 500 : 400,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                {tier.shortDescription}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Description */}
            <button
                onClick={() => setShowDetail(!showDetail)}
                className="text-[10px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
                {showDetail ? '▴ Hide details' : '▸ What does this mean?'}
            </button>


            {showDetail && (
                <div className="rounded-lg bg-[#F0EDE6] border border-[#E2DDD5] p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                    {tiers.map((tier) => (
                        <div key={tier.tier} className="text-[0.75rem] leading-relaxed text-[#6B7280] font-sans">
                            <span className="font-semibold text-[#2D6A4F] text-[0.8rem] block mb-0.5">{tier.label}:</span>
                            {tier.description}
                            <div className="flex gap-4 mt-1.5 text-[#52B788] font-medium text-[0.7rem]">
                                <span className="flex items-center gap-1">Audio: {tier.capturesPatientAudio ? '🔊' : '🔇'}</span>
                                <span className="flex items-center gap-1">Transcript: {tier.storesTranscript ? '💾' : '🚫'}</span>
                                <span className="flex items-center gap-1">Full Note: {tier.generatesFullNote ? '📝' : '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
