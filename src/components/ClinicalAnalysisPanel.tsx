'use client';

import React, { useState } from 'react';
import { Brain, FlaskConical, CheckCircle2, Pill, Stethoscope, ChevronDown, ChevronUp, Loader2, AlertTriangle, Sparkles, BookOpen, Activity } from 'lucide-react';
import type { ClinicalAnalysisResult, DifferentialDiagnosis } from '@/lib/clinicalAnalysisEngine';

interface Props {
    patientId: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    sessionCount?: number;
    latestTranscript?: string;
    latestNotes?: string;
    assessmentScores?: Record<string, { score: number; severity: string }>;
}

const LIKELIHOOD_CONFIG = {
    High: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444' },
    Moderate: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
    Low: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E' },
};

export default function ClinicalAnalysisPanel({
    patientId, patientName, patientAge, patientGender,
    sessionCount, latestTranscript, latestNotes, assessmentScores
}: Props) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ClinicalAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedDiff, setExpandedDiff] = useState<number | null>(null);
    const [showPharm, setShowPharm] = useState(false);
    const [presentingComplaint, setPresentingComplaint] = useState('');

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/clinical-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: latestTranscript,
                    presentingComplaint: presentingComplaint || undefined,
                    existingNotes: latestNotes,
                    assessmentScores,
                    patientAge,
                    patientGender,
                    sessionCount,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-2" style={{ borderBottom: '1px solid #E2DDD5' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                    <Brain size={18} style={{ color: '#7C3AED' }} />
                </div>
                <div>
                    <h3 className="font-semibold text-sm" style={{ color: '#1A1A1A', fontFamily: 'Lora, serif' }}>
                        Clinical Analysis Engine
                    </h3>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        NIMHANS · WHO mhGAP · IPS 2025 · DSM-5/ICD-10
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    <Sparkles size={10} />
                    GPT-4o
                </div>
            </div>

            {/* Input */}
            {!result && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
                            Additional presenting complaint (optional — supplements session transcript)
                        </label>
                        <textarea
                            value={presentingComplaint}
                            onChange={e => setPresentingComplaint(e.target.value)}
                            placeholder="E.g. Patient reports 3-month history of low mood, insomnia, anhedonia..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ border: '1px solid #E2DDD5', color: '#1A1A1A', background: '#FAFAF9' }}
                        />
                    </div>

                    {assessmentScores && Object.keys(assessmentScores).length > 0 && (
                        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}>
                            <span className="font-bold">Assessment scores will be included:</span>{' '}
                            {Object.entries(assessmentScores).map(([k, v]) => `${k}: ${v.score} (${v.severity})`).join(' · ')}
                        </div>
                    )}

                    <button
                        onClick={runAnalysis}
                        disabled={loading || (!latestTranscript && !presentingComplaint)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ background: '#7C3AED', color: '#fff' }}
                    >
                        {loading ? (
                            <><Loader2 size={15} className="animate-spin" /> Running 3-tier analysis...</>
                        ) : (
                            <><Brain size={15} /> Run Clinical Analysis</>
                        )}
                    </button>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#FEF2F2', color: '#991B1B' }}>
                            <AlertTriangle size={13} /> {error}
                        </div>
                    )}
                </div>
            )}

            {result && (
                <div className="space-y-4">
                    {/* Reset button */}
                    <button
                        onClick={() => setResult(null)}
                        className="text-xs font-medium"
                        style={{ color: '#7C3AED' }}
                    >
                        ← Run new analysis
                    </button>

                    {/* Presenting Illness Summary */}
                    {result.presentingIllnessSummary && (
                        <div className="px-4 py-3 rounded-xl text-sm leading-relaxed" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#3730A3' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7C3AED' }}>Presenting Illness</p>
                            {result.presentingIllnessSummary}
                        </div>
                    )}

                    {/* TIER 1: Differential */}
                    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #E0E7FF' }}>
                        <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#EEF2FF', borderBottom: '1px solid #E0E7FF' }}>
                            <FlaskConical size={15} style={{ color: '#4338CA' }} />
                            <span className="text-sm font-bold" style={{ color: '#3730A3' }}>Tier 1 — Differential Diagnoses</span>
                            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#C7D2FE', color: '#3730A3' }}>
                                {result.differentialDiagnoses?.length || 0} conditions
                            </span>
                        </div>
                        <div className="divide-y" style={{ background: '#fff', borderColor: '#F0F0F0' }}>
                            {result.differentialDiagnoses?.map((dx, i) => {
                                const cfg = LIKELIHOOD_CONFIG[dx.likelihood] || LIKELIHOOD_CONFIG.Low;
                                const isOpen = expandedDiff === i;
                                return (
                                    <div key={i}>
                                        <button
                                            onClick={() => setExpandedDiff(isOpen ? null : i)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                                            <span className="text-xs font-mono font-bold" style={{ color: '#6B7280', minWidth: '50px' }}>{dx.icd10Code}</span>
                                            <span className="text-sm font-medium flex-1" style={{ color: '#1A1A1A' }}>{dx.name}</span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                                                {dx.likelihood}
                                            </span>
                                            {isOpen ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs font-bold mb-1" style={{ color: '#166534' }}>Supporting evidence</p>
                                                    {dx.supportingEvidence?.map((e, j) => (
                                                        <p key={j} className="text-xs leading-relaxed flex gap-1" style={{ color: '#374151' }}>
                                                            <span style={{ color: '#22C55E' }}>✓</span> {e}
                                                        </p>
                                                    ))}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold mb-1" style={{ color: '#991B1B' }}>Ruling-out factors</p>
                                                    {dx.rulingOutFactors?.map((e, j) => (
                                                        <p key={j} className="text-xs leading-relaxed flex gap-1" style={{ color: '#374151' }}>
                                                            <span style={{ color: '#EF4444' }}>✗</span> {e}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {result.ruledOutConditions?.length > 0 && (
                            <div className="px-4 py-3" style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                                <p className="text-xs font-bold mb-1" style={{ color: '#6B7280' }}>Ruled out</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.ruledOutConditions.map((c, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TIER 2: Provisional */}
                    {result.provisionalDiagnosis && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #FDE68A' }}>
                            <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
                                <Activity size={15} style={{ color: '#B45309' }} />
                                <span className="text-sm font-bold" style={{ color: '#92400E' }}>Tier 2 — Provisional Diagnosis</span>
                                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FDE68A', color: '#92400E' }}>
                                    {result.provisionalDiagnosis.primary?.confidence || 0}% confidence
                                </span>
                            </div>
                            <div className="p-4 space-y-3" style={{ background: '#fff' }}>
                                {/* Primary */}
                                <div className="flex items-start gap-3">
                                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                        {result.provisionalDiagnosis.primary?.icd10}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{result.provisionalDiagnosis.primary?.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Primary diagnosis</p>
                                    </div>
                                </div>

                                {/* Comorbidities */}
                                {result.provisionalDiagnosis.comorbidities?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold mb-1.5" style={{ color: '#6B7280' }}>Comorbidities</p>
                                        {result.provisionalDiagnosis.comorbidities.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#374151' }}>{c.icd10}</span>
                                                <span className="text-xs" style={{ color: '#374151' }}>{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Key symptoms */}
                                <div className="flex flex-wrap gap-1.5">
                                    {result.provisionalDiagnosis.keySymptoms?.map((s, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {/* Justification */}
                                <p className="text-xs leading-relaxed px-3 py-2 rounded-lg" style={{ background: '#FAFAF9', color: '#374151', border: '1px solid #E2DDD5' }}>
                                    {result.provisionalDiagnosis.justification}
                                </p>

                                {/* Functional impairment */}
                                {result.provisionalDiagnosis.functionalImpairment && (
                                    <p className="text-xs" style={{ color: '#6B7280' }}>
                                        <span className="font-semibold">Functional impairment:</span> {result.provisionalDiagnosis.functionalImpairment}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TIER 3: Final */}
                    {result.finalAnalysis && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #BBF7D0' }}>
                            <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}>
                                <CheckCircle2 size={15} style={{ color: '#15803D' }} />
                                <span className="text-sm font-bold" style={{ color: '#166534' }}>Tier 3 — Final Analysis & Path to Confirmation</span>
                            </div>
                            <div className="p-4 space-y-3" style={{ background: '#fff' }}>
                                {/* Investigations */}
                                <div>
                                    <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: '#374151' }}>
                                        <FlaskConical size={11} /> Investigations required
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.finalAnalysis.recommendedInvestigations?.map((inv, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
                                                {inv}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Psychometric tools */}
                                <div>
                                    <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: '#374151' }}>
                                        <BookOpen size={11} /> Psychometric assessments
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.finalAnalysis.psychometricAssessments?.map((a, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full font-mono font-bold" style={{ background: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE' }}>
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="px-3 py-2 rounded-lg" style={{ background: '#FAFAF9', border: '1px solid #E2DDD5' }}>
                                        <p className="text-xs font-bold mb-0.5" style={{ color: '#6B7280' }}>Timeline</p>
                                        <p className="text-xs" style={{ color: '#374151' }}>{result.finalAnalysis.timelineToConfirmation}</p>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg" style={{ background: '#FAFAF9', border: '1px solid #E2DDD5' }}>
                                        <p className="text-xs font-bold mb-0.5" style={{ color: '#6B7280' }}>WHO mhGAP Level</p>
                                        <p className="text-xs font-semibold" style={{ color: result.whoMhGAPLevel === 'Severe' ? '#991B1B' : result.whoMhGAPLevel === 'Moderate' ? '#92400E' : '#166534' }}>
                                            {result.whoMhGAPLevel} — {result.whoInterventionType}
                                        </p>
                                    </div>
                                </div>

                                {/* Prognostic factors */}
                                {result.finalAnalysis.prognosticFactors?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold mb-1.5" style={{ color: '#374151' }}>Prognostic factors</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.finalAnalysis.prognosticFactors.map((f, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* NIMHANS staging */}
                                {result.finalAnalysis.nimsStaging && (
                                    <div className="px-3 py-2 rounded-lg" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                                        <p className="text-xs font-bold mb-0.5" style={{ color: '#7C3AED' }}>NIMHANS Staging</p>
                                        <p className="text-xs" style={{ color: '#3730A3' }}>{result.finalAnalysis.nimsStaging}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Therapy recommendation */}
                    {result.recommendedModality && (
                        <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                            <Stethoscope size={16} style={{ color: '#15803D', marginTop: 2 }} />
                            <div>
                                <p className="text-xs font-bold" style={{ color: '#166534' }}>Recommended therapy modality</p>
                                <p className="text-sm font-semibold mt-0.5" style={{ color: '#1A1A1A' }}>{result.recommendedModality}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#374151' }}>{result.modalityRationale}</p>
                            </div>
                        </div>
                    )}

                    {/* Pharmacotherapy — collapsible */}
                    {result.pharmacotherapy && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #FDBA74' }}>
                            <button
                                onClick={() => setShowPharm(!showPharm)}
                                className="w-full flex items-center gap-2 px-4 py-3"
                                style={{ background: '#FFF7ED', borderBottom: showPharm ? '1px solid #FDBA74' : 'none' }}
                            >
                                <Pill size={15} style={{ color: '#C2410C' }} />
                                <span className="text-sm font-bold" style={{ color: '#9A3412' }}>Pharmacotherapy Plan</span>
                                <span className="text-xs ml-1" style={{ color: '#C2410C' }}>NIMHANS · WHO mhGAP</span>
                                <div className="ml-auto">
                                    {showPharm ? <ChevronUp size={14} style={{ color: '#C2410C' }} /> : <ChevronDown size={14} style={{ color: '#C2410C' }} />}
                                </div>
                            </button>

                            {showPharm && (
                                <div className="p-4 space-y-4" style={{ background: '#fff' }}>
                                    {/* First line */}
                                    {result.pharmacotherapy.firstLine?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold mb-2" style={{ color: '#166534' }}>First-line agents</p>
                                            {result.pharmacotherapy.firstLine.map((drug, i) => (
                                                <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{drug.drug}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>{drug.class}</span>
                                                    </div>
                                                    <p className="text-xs" style={{ color: '#374151' }}>
                                                        <span className="font-semibold">Dose:</span> {drug.dose} {drug.frequency} — {drug.duration}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: '#374151' }}>
                                                        <span className="font-semibold">Rationale:</span> {drug.rationale}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                                        <span className="font-semibold">Cost:</span> {drug.costINR}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Second line */}
                                    {result.pharmacotherapy.secondLine?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold mb-2" style={{ color: '#92400E' }}>Second-line alternatives</p>
                                            {result.pharmacotherapy.secondLine.map((drug, i) => (
                                                <div key={i} className="mb-2 p-3 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{drug.drug} <span className="text-xs font-normal" style={{ color: '#92400E' }}>({drug.class})</span></p>
                                                    <p className="text-xs" style={{ color: '#374151' }}>{drug.dose} {drug.frequency}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Monitoring */}
                                    {result.pharmacotherapy.monitoringParameters?.length > 0 && (
                                        <div className="p-3 rounded-xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                                            <p className="text-xs font-bold mb-1.5" style={{ color: '#3730A3' }}>Monitoring parameters</p>
                                            {result.pharmacotherapy.monitoringParameters.map((m, i) => (
                                                <p key={i} className="text-xs flex gap-1" style={{ color: '#374151' }}><span>•</span>{m}</p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Contraindications */}
                                    {result.pharmacotherapy.contraindications?.length > 0 && (
                                        <div className="p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                                            <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: '#991B1B' }}>
                                                <AlertTriangle size={11} /> Contraindications
                                            </p>
                                            {result.pharmacotherapy.contraindications.map((c, i) => (
                                                <p key={i} className="text-xs flex gap-1" style={{ color: '#374151' }}><span>⚠</span>{c}</p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Guideline reference */}
                                    {result.pharmacotherapy.nimhansGuideline && (
                                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                            Reference: {result.pharmacotherapy.nimhansGuideline}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
