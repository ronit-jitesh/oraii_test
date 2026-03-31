'use client';

import React, { useState } from 'react';
import { Shield, Check, ChevronRight, Lock, Database, Mic, Brain, Share2 } from 'lucide-react';

// â”€â”€ Consent Types (aligned with DPDP Act 2023) â”€â”€

export interface ConsentRecord {
    treatment: boolean;        // Consent to receive treatment
    dataProcessing: boolean;   // Personal Data Processing (DPDP Section 6)
    recording: boolean;        // Session audio recording
    aiProcessing: boolean;     // AI/ML processing of session data
    dataSharing: boolean;      // Sharing with third parties (insurance, referral)
}

interface ConsentManagerProps {
    patientId: string;
    patientName: string;
    existingConsent?: Partial<ConsentRecord>;
    onSave: (consent: ConsentRecord) => void;
    onCancel: () => void;
}

const CONSENT_ITEMS: {
    key: keyof ConsentRecord;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    required: boolean;
}[] = [
        {
            key: 'treatment',
            label: 'Treatment Consent',
            description: 'I consent to receive mental health treatment from my therapist. I understand that I can withdraw this consent at any time.',
            icon: Shield,
            required: true,
        },
        {
            key: 'dataProcessing',
            label: 'Data Processing (DPDP Act)',
            description: 'I consent to the processing of my personal data as outlined in the Digital Personal Data Protection Act, 2023. My data will be processed only for the stated purpose of clinical documentation.',
            icon: Database,
            required: true,
        },
        {
            key: 'recording',
            label: 'Session Recording',
            description: 'I consent to audio recording of therapy sessions for the purpose of generating clinical notes. Depending on the privacy tier selected, raw audio may be deleted immediately after processing.',
            icon: Mic,
            required: false,
        },
        {
            key: 'aiProcessing',
            label: 'AI-Assisted Documentation',
            description: 'I consent to the use of AI/ML models to transcribe audio, generate clinical notes, and detect safety concerns. I understand that a qualified clinician reviews all AI-generated content.',
            icon: Brain,
            required: false,
        },
        {
            key: 'dataSharing',
            label: 'Data Sharing',
            description: 'I consent to sharing my clinical data with authorized third parties (e.g., insurance providers, referral clinicians) only when explicitly requested.',
            icon: Share2,
            required: false,
        },
    ];

export default function ConsentManager({
    patientName,
    existingConsent,
    onSave,
    onCancel,
}: ConsentManagerProps) {
    const [step, setStep] = useState(0);
    const [consent, setConsent] = useState<ConsentRecord>({
        treatment: existingConsent?.treatment ?? false,
        dataProcessing: existingConsent?.dataProcessing ?? false,
        recording: existingConsent?.recording ?? false,
        aiProcessing: existingConsent?.aiProcessing ?? false,
        dataSharing: existingConsent?.dataSharing ?? false,
    });

    const currentItem = CONSENT_ITEMS[step];
    const isLast = step === CONSENT_ITEMS.length - 1;
    const allRequiredMet = CONSENT_ITEMS.filter(i => i.required).every(i => consent[i.key]);

    const toggle = (key: keyof ConsentRecord) => {
        setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNext = () => {
        if (isLast) {
            onSave(consent);
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-lg mx-auto backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Lock size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Consent Management</h3>
                    <p className="text-[10px] text-white/40">
                        {patientName} â€¢ DPDP Act 2023 Compliant
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1 mb-6">
                {CONSENT_ITEMS.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-emerald-400' : i === step ? 'bg-emerald-400/60' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>

            {/* Current Item */}
            {currentItem && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/5 rounded-lg mt-0.5">
                            <currentItem.icon size={16} className="text-white/60" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-white">{currentItem.label}</h4>
                                {currentItem.required && (
                                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                                        REQUIRED
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">
                                {currentItem.description}
                            </p>
                        </div>
                    </div>

                    {/* Toggle */}
                    <button
                        onClick={() => toggle(currentItem.key)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-xl
                            transition-all duration-200 border-2
                            ${consent[currentItem.key]
                                ? 'border-emerald-400/40 bg-emerald-500/10'
                                : 'border-white/10 bg-white/5'
                            }
                        `}
                    >
                        <span className={`text-xs font-bold ${consent[currentItem.key] ? 'text-emerald-300' : 'text-white/50'
                            }`}>
                            {consent[currentItem.key] ? 'Consent Given' : 'Tap to Consent'}
                        </span>
                        <div className={`
                            w-10 h-6 rounded-full transition-all duration-200 flex items-center
                            ${consent[currentItem.key]
                                ? 'bg-emerald-500 justify-end pr-0.5'
                                : 'bg-white/20 justify-start pl-0.5'
                            }
                        `}>
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                {consent[currentItem.key] && <Check size={12} className="text-emerald-600" />}
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={step === 0 ? onCancel : () => setStep(step - 1)}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors px-3 py-2"
                >
                    {step === 0 ? 'Cancel' : 'â† Back'}
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentItem?.required && !consent[currentItem.key]}
                    className={`
                        flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all
                        ${currentItem?.required && !consent[currentItem.key]
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }
                    `}
                >
                    {isLast ? 'Save Consent' : 'Next'}
                    {!isLast && <ChevronRight size={14} />}
                </button>
            </div>

            {/* Summary (shown on last step) */}
            {isLast && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/30 mb-2">Consent Summary:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {CONSENT_ITEMS.map((item) => (
                            <span
                                key={item.key}
                                className={`text-[9px] px-2 py-1 rounded-full ${consent[item.key]
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-red-500/15 text-red-300'
                                    }`}
                            >
                                {consent[item.key] ? 'âœ“' : 'âœ—'} {item.label}
                            </span>
                        ))}
                    </div>
                    {!allRequiredMet && (
                        <p className="text-[10px] text-amber-400 mt-2">
                            âš  Required consents must be given before proceeding.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
