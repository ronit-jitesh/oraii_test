'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// Utility to clean double-encoded UTF-8 characters
function cleanNoteText(text: string): string {
    if (!text) return '';
    return text
        .replace(/â€"/g, '—')
        .replace(/â€”/g, '—')
        .replace(/â€˜/g, "'")
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        .replace(/Â·/g, '·')
        .replace(/Ã©/g, 'é');
}

// Utility to transform raw section keys into readable headers
function formatHeader(key: string): string {
    const mapping: Record<string, string> = {
        hpiABCDE: 'HPI — Behaviours, Consequences, Duration, Episodes',
        pastHistory: 'Past History',
        substanceUse: 'Substance Use',
        familyHistory: 'Family History',
        socialHistory: 'Social History',
        mse: 'Mental State Examination (MSE)',
        formulation: 'Case Formulation',
        diagnosis: 'Provisional Diagnosis',
        managementPlan: 'Management Plan',
        chiefComplaint: 'Chief Complaint',
        subjective: 'Subjective',
        objective: 'Objective',
        assessment: 'Assessment',
        plan: 'Plan',
        behavior: 'Behavior',
        intervention: 'Intervention',
        response: 'Response',
        goals: 'Goals',
    };
    return mapping[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

import { generateClinicalNote, saveSession, saveSuperbill, generateShareableSummary, generateSupervisionAnalysis, runComplianceCheck } from '@/app/actions';
import { Bot, FileText, Activity, Pill, Stethoscope, TestTube, Brain, Save, CheckCircle, Pencil, Check, ArrowLeft, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, DollarSign, ShieldCheck, Zap, Receipt, ClipboardCheck, ChevronRight, Share2, Copy, Loader2, Sparkles, Wand2 } from 'lucide-react';
import NoteTemplateSelector from './NoteTemplateSelector';
import type { NoteFormat } from '@/lib/prompts';
import { RISK_PATTERNS, RiskAlert, ClinicalTheme } from '@/lib/riskDetection';
import { getCPTByCode, mapSymptomsToICD10 } from '@/lib/cptCodes';
import CostTracker, { type SessionCostData } from './CostTracker';
import { type PrivacyTier } from '@/lib/ephemeralProcessor';
import { MODALITY_CONFIGS, type TherapyModality } from '@/lib/modalityConfig';
import MHCAAlertPanel from './MHCAAlertPanel';
import SupervisionDashboard from './SupervisionDashboard';
import type { ComplianceCheckResult } from '@/lib/mhcaCompliance';
import type { CulturalMapping } from '@/lib/hinglishTaxonomy';
import type { SupervisionAnalysis } from '@/lib/microSkillsAnalyzer';

interface NoteGeneratorProps {
    transcript: string;
    patientId?: string;
    patientName?: string;
    privacyTier?: PrivacyTier;
    modality?: TherapyModality;
}

interface Entities {
    symptoms: string[];
    medications: string[];
    diagnoses: string[];
    testsOrdered: string[];
}

interface RoleAnalysis {
    speaker0Role: string;
    speaker1Role: string;
    reasoning: string;
    confidenceScore: number;
}

interface RiskAssessment {
    level: string;
    factors: string[];
    recommendations: string[];
    suicidalIdeation: boolean;
    selfHarm: boolean;
    substanceUse: boolean;
    domesticViolence: boolean;
    psychoticSymptoms: boolean;
}

interface CPTSuggestion {
    code: string;
    description: string;
    rationale: string;
}

// Format-specific field configs
const FORMAT_FIELDS: Record<NoteFormat, { fields: string[]; noteKey: string; title: string }> = {
    soap: {
        fields: ['subjective', 'objective', 'assessment', 'plan'],
        noteKey: 'soapNote',
        title: 'Clinical SOAP Note',
    },
    dap: {
        fields: ['data', 'assessment', 'plan'],
        noteKey: 'dapNote',
        title: 'Clinical DAP Note',
    },
    birp: {
        fields: ['behavior', 'intervention', 'response', 'plan'],
        noteKey: 'birpNote',
        title: 'Clinical BIRP Note',
    },
    girp: {
        fields: ['goals', 'interventions', 'response', 'plan'],
        noteKey: 'girpNote',
        title: 'Clinical GIRP Note',
    },
    ips: {
        fields: ['chiefComplaint', 'hpiABCDE', 'pastHistory', 'substanceUse', 'familyHistory', 'socialHistory', 'mse', 'formulation', 'diagnosis', 'managementPlan'],
        noteKey: 'ipsNote',
        title: 'IPS Clinical Note (India)',
    },
};

export default function NoteGenerator({ transcript, patientId, patientName, privacyTier, modality: modalityProp }: NoteGeneratorProps) {
    const router = useRouter();
    const [noteFormat, setNoteFormat] = useState<NoteFormat>('ips');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [noteData, setNoteData] = useState<Record<string, string> | null>(null);
    const [editedNote, setEditedNote] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [entities, setEntities] = useState<Entities | null>(null);
    const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis | null>(null);
    const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
    const [suggestedCPTs, setSuggestedCPTs] = useState<CPTSuggestion[]>([]);
    const [activeFormat, setActiveFormat] = useState<NoteFormat>('ips');
    const [error, setError] = useState<string | null>(null);
    const [savingSuperbill, setSavingSuperbill] = useState(false);
    const [superbillSaved, setSuperbillSaved] = useState(false);
    const [costEstimate, setCostEstimate] = useState<SessionCostData | null>(null);

    // Shareable summary state
    const [patientSummary, setPatientSummary] = useState<string | null>(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summaryCopied, setSummaryCopied] = useState(false);

    // New Strategy Features State
    const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
    const [culturalIdioms, setCulturalIdioms] = useState<CulturalMapping[]>([]);
    const [supervisionAnalysis, setSupervisionAnalysis] = useState<SupervisionAnalysis | null>(null);
    const [analyzingModality, setAnalyzingModality] = useState(false);

    // IPS Billing State
    const [sessionFeeInr, setSessionFeeInr] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('cash');

    const handleGenerate = async () => {
        setLoading(true);
        setAnalyzingModality(true);
        setError(null);
        setSaved(false);
        try {
            const result = await generateClinicalNote(transcript, noteFormat, modalityProp || 'none');
            if (result.error) {
                setError(result.error);
            } else if (result.success && result.data) {
                const fmt = (result.format || noteFormat) as NoteFormat;
                setActiveFormat(fmt);

                const config = FORMAT_FIELDS[fmt];
                const note = result.data[config.noteKey] || result.data.soapNote || result.data.soap_note;

                // Clean the incoming note data
                const cleanedNote: Record<string, string> = {};
                Object.keys(note).forEach(key => {
                    cleanedNote[key] = cleanNoteText(note[key]);
                });

                setNoteData(cleanedNote);
                setEditedNote(cleanedNote);
                setEntities(result.data.entities || null);
                setRoleAnalysis(result.data.roleAnalysis || result.data.role_analysis || null);
                setRiskAssessment(result.data.riskAssessment || result.data.risk_assessment || null);
                setSuggestedCPTs(result.data.suggestedCPTCodes || []);
                if (result.costEstimate) {
                    setCostEstimate({
                        asrCost: result.costEstimate.asrCost,
                        llmCost: result.costEstimate.llmCost,
                        totalCost: result.costEstimate.totalCost,
                        breakdown: result.costEstimate.breakdown,
                        model: result.model,
                        durationMinutes: 45 // Fallback or calculated
                    });
                }

                // Run additional analyses in parallel
                try {
                    const [complianceRes, supervisionRes] = await Promise.all([
                        runComplianceCheck(transcript, result.data.riskAssessment || result.data.risk_assessment),
                        generateSupervisionAnalysis(transcript, result.data.roleAnalysis || result.data.role_analysis)
                    ]);

                    if (complianceRes.success && complianceRes.compliance) {
                        setComplianceResult(complianceRes.compliance);
                        setCulturalIdioms(complianceRes.culturalIdioms || []);
                    }

                    if (supervisionRes.success && supervisionRes.data) {
                        setSupervisionAnalysis(supervisionRes.data);
                    }
                } catch (analysisErr) {
                    console.error('Secondary analysis error:', analysisErr);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!noteData) return;

        setSaving(true);
        setError(null);
        try {
            const result = await saveSession({
                transcript,
                soapNote: editedNote,
                entities,
                roleAnalysis,
                riskAssessment,
                noteFormat: activeFormat,
                patientId,
                privacyTier,
                sessionFeeInr: sessionFeeInr ? parseInt(sessionFeeInr) : undefined,
                paymentMode,
            });

            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setSaved(true);
            }
        } catch (err) {
            setError('Failed to save session.');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateSuperbill = async () => {
        if (!patientId || suggestedCPTs.length === 0) return;

        setSavingSuperbill(true);
        setError(null);
        try {
            // Map suggested CPTs to required format with fees
            const cptCodes = suggestedCPTs.map(s => {
                const dbEntry = getCPTByCode(s.code);
                return {
                    code: s.code,
                    description: s.description,
                    fee: dbEntry?.typicalFee || 150
                };
            });

            // Map symptoms/diagnoses to ICD-10
            const icd10Codes = mapSymptomsToICD10(
                entities?.symptoms || [],
                entities?.diagnoses || []
            ).map(icd => ({
                code: icd.code,
                description: icd.description
            }));

            const result = await saveSuperbill({
                patientId,
                cptCodes,
                icd10Codes,
                status: 'draft',
                sessionDurationMinutes: 45, // Default or estimate
                totalFee: cptCodes.reduce((sum, c) => sum + c.fee, 0),
                serviceDate: new Date().toISOString().split('T')[0],
                notes: `Auto-generated from AI session analysis. Reason: ${entities?.diagnoses?.[0] || 'Clinical session'}`
            });

            if (result.error) {
                setError(result.error);
            } else {
                setSuperbillSaved(true);
            }
        } catch (err) {
            setError('Failed to create superbill.');
        } finally {
            setSavingSuperbill(false);
        }
    };

    const injectProtocol = () => {
        if (!riskAssessment || !riskAssessment.level || riskAssessment.level === 'none') return;
        
        // Find the highest-level pattern that matches the risk data
        const matchingPattern = RISK_PATTERNS.find((p: any) => {
          if (riskAssessment.suicidalIdeation && p.category.includes("Suicidal")) return true;
          if (riskAssessment.selfHarm && p.category.includes("Self-Harm")) return true;
          if (riskAssessment.domesticViolence && p.category.includes("Domestic")) return true;
          if (riskAssessment.psychoticSymptoms && p.category.includes("Psychotic")) return true;
          if (riskAssessment.substanceUse && p.category.includes("Substance")) return true;
          return false;
        });

        if (!matchingPattern) return;

        const protocolText = `\n\n[SAFETY PROTOCOL: ${matchingPattern.protocol.name}]\n- ` + matchingPattern.protocol.steps.join('\n- ');

        const planKey = activeFormat === 'soap' ? 'plan' : activeFormat === 'dap' ? 'plan' : (activeFormat === 'birp' ? 'plan' : 'plan'); // Most have 'plan'

        setEditedNote(prev => ({
            ...prev,
            [planKey]: (prev[planKey] || '') + protocolText
        }));
        setIsEditing(true);
    };

    // ── Pre-generation view ──
    if (!noteData) {
        return (
            <div className="space-y-4">
                <h2 className="text-[1.25rem] font-semibold text-[#1A1A1A] leading-tight" style={{ fontFamily: 'Lora, serif' }}>Generated Notes</h2>

                {/* Display Selected Modality (Read-only since it's set in sidebar) */}
                {modalityProp && modalityProp !== 'none' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-xl">
                            {MODALITY_CONFIGS[modalityProp].icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Active Therapeutic Framework</p>
                            <p className="text-sm font-bold text-[#1A1A1A]">{MODALITY_CONFIGS[modalityProp].name}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-indigo-100">
                           <Sparkles size={10} className="text-indigo-500" />
                           <span className="text-[9px] font-bold text-indigo-700 uppercase">Analysis Optimized</span>
                        </div>
                    </div>
                )}

                {/* 1. Format Tabs */}
                <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Note Format</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(FORMAT_FIELDS).map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setNoteFormat(fmt as NoteFormat)}
                                className={`px-[18px] py-[6px] rounded-full text-[0.85rem] font-medium border-[1.5px] transition-all
                                    ${noteFormat === fmt
                                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                                        : 'bg-white text-[#6B7280] border-[#E2DDD5] cursor-pointer'
                                    }`}
                            >
                                {fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate CTA */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-[#2D6A4F] hover:bg-[#1B4D38] text-white rounded-full p-[10px_24px] font-semibold text-[0.9rem] transition-all duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Analyzing session...
                        </>
                    ) : (
                        'Generate Note'
                    )}
                </button>

                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }

    // ── Post-generation view ──
    const config = FORMAT_FIELDS[activeFormat];

    return (
        <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Role Analysis */}
            {roleAnalysis && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2DDD5]">
                    <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Brain size={16} /> AI Role Identification
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleAnalysis.speaker0Role === 'Doctor'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                            Speaker 0: <strong>{roleAnalysis.speaker0Role}</strong>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleAnalysis.speaker1Role === 'Doctor'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                            Speaker 1: <strong>{roleAnalysis.speaker1Role}</strong>
                        </span>
                        <span className="px-2 py-1 bg-[#F0EDE6] text-[#6B7280] rounded text-xs">
                            Confidence: {Math.round((roleAnalysis.confidenceScore || 0) * 100)}%
                        </span>
                    </div>
                    <p className="text-xs text-[#6B7280] italic">{roleAnalysis.reasoning}</p>
                </div>
            )}

            {/* 1.5. MHCA Compliance Panel */}
            {complianceResult && (
                <MHCAAlertPanel 
                    compliance={complianceResult} 
                    culturalIdioms={culturalIdioms}
                />
            )}

            {/* 2. Entities Section */}
            {entities && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2DDD5]">
                    <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity size={16} /> Extracted Clinical Entities
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                                <Activity size={12} /> Symptoms
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {entities.symptoms?.length > 0 ? entities.symptoms.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">{s}</span>
                                )) : <span className="text-[#9CA3AF] text-xs">None reported</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                                <Pill size={12} /> Medications
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {entities.medications?.length > 0 ? entities.medications.map((m, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">{m}</span>
                                )) : <span className="text-[#9CA3AF] text-xs">None reported</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1">
                                <Stethoscope size={12} /> Diagnoses
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {entities.diagnoses?.length > 0 ? entities.diagnoses.map((d, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs">{d}</span>
                                )) : <span className="text-[#9CA3AF] text-xs">None reported</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1">
                                <TestTube size={12} /> Tests Ordered
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {entities.testsOrdered?.length > 0 ? entities.testsOrdered.map((t, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs">{t}</span>
                                )) : <span className="text-[#9CA3AF] text-xs">None reported</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2.5. Supervision Dashboard */}
            {supervisionAnalysis && (
                <SupervisionDashboard analysis={supervisionAnalysis} />
            )}

            {/* 3. Clinical Note Editor (Format-Aware) */}
            <div className="bg-white rounded-[10px] border-[1.5px] border-[#E2DDD5] overflow-hidden">
                <div className="bg-[#F7F5F0] px-5 py-4 border-b border-[#E2DDD5] flex justify-between items-center">
                    <h3 className="text-[1.1rem] font-semibold text-[#1A1A1A] flex items-center gap-2" style={{ fontFamily: 'Lora, serif' }}>
                        {config.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-[#D8EDDF] text-[#2D6A4F] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{activeFormat}</span>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isEditing
                                ? 'bg-[#2D6A4F] text-white'
                                : 'text-[#6B7280] hover:text-[#1A1A1A]'
                                }`}
                        >
                            {isEditing ? <><Check size={14} /> Done</> : <><Pencil size={14} /> Edit</>}
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {config.fields.map((field) => (
                        <div key={field}>
                            <label className="block text-[0.65rem] font-bold text-[#9CA3AF] uppercase mb-1">{formatHeader(field)}</label>
                            {isEditing ? (
                                <textarea
                                    className="w-full p-4 rounded-lg border-[1.5px] border-[#2D6A4F] text-[#1A1A1A] text-[0.9rem] min-h-[180px] outline-none transition-colors font-sans leading-[1.6] bg-white"
                                    value={editedNote[field] || ''}
                                    onChange={(e) => setEditedNote({ ...editedNote, [field]: e.target.value })}
                                />
                            ) : (
                                <div className="w-full p-5 rounded-lg border-[1.5px] border-[#E2DDD5] bg-white min-h-[100px] prose prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            strong: ({ children }) => <strong className="font-semibold text-[#1A1A1A]">{children}</strong>,
                                            p: ({ children }) => <p className="mb-3 text-[#1A1A1A] leading-relaxed last:mb-0">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                                            li: ({ children }) => <li className="text-[#1A1A1A]">{children}</li>,
                                            h3: ({ children }) => <h3 className="font-serif text-[#2D6A4F] text-[1.1rem] font-semibold mt-4 mb-2">{children}</h3>,
                                        }}
                                    >
                                        {editedNote[field] || ''}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Risk Assessment Card */}
            {riskAssessment && riskAssessment.level !== 'none' && (
                <RiskAssessmentCard assessment={riskAssessment} />
            )}

            {/* Cost Tracker Section (Strategic Analysis) */}
            {costEstimate && (
                <div className="mx-6">
                    <CostTracker sessionCost={costEstimate} />
                </div>
            )}

            {/* CPT Code Suggestions & Revenue Loop (Western formats only) */}
            {activeFormat !== 'ips' && suggestedCPTs.length > 0 && (
                <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #BBF7D0' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg" style={{ background: '#16653415' }}>
                                <DollarSign size={18} style={{ color: '#166534' }} />
                            </div>
                            <span className="text-sm font-bold" style={{ color: '#166534' }}>
                                Suggested CPT Codes
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#16653415', color: '#166534' }}>
                                AI Suggested
                            </span>
                        </div>

                        {patientId && (
                            superbillSaved ? (
                                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                                    <CheckCircle size={14} />
                                    Draft Bill Created
                                </div>
                            ) : (
                                <button
                                    onClick={handleCreateSuperbill}
                                    disabled={savingSuperbill}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Receipt size={12} />
                                    {savingSuperbill ? 'Creating...' : 'Create Draft Superbill'}
                                </button>
                            )
                        )}
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        {suggestedCPTs.map((cpt, i) => (
                            <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < suggestedCPTs.length - 1 ? '1px solid #D1FAE5' : undefined }}>
                                <span className="text-sm font-mono font-bold text-emerald-700 shrink-0">{cpt.code}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#1A1A1A]">{cpt.description}</p>
                                    <p className="text-[11px] text-[#6B7280] mt-0.5">{cpt.rationale}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ₹ Session Billing (IPS format only) */}
            {activeFormat === 'ips' && noteData && (
                <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ background: '#FFF7ED', border: '2px solid #FED7AA' }}>
                    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #FED7AA' }}>
                        <div className="p-1.5 rounded-lg" style={{ background: '#EA580C15' }}>
                            <Receipt size={18} style={{ color: '#EA580C' }} />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold" style={{ color: '#9A3412' }}>
                                Session Fee (₹)
                            </span>
                            <p className="text-[10px]" style={{ color: '#C2410C' }}>IPS format — Indian billing</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#EA580C15', color: '#EA580C' }}>
                            India
                        </span>
                    </div>
                    <div className="px-4 py-3 flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] font-semibold mb-1 text-[#6B7280]">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#6B7280]">₹</span>
                                <input 
                                    type="number" 
                                    placeholder="1500"
                                    value={sessionFeeInr}
                                    onChange={(e) => setSessionFeeInr(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm font-medium outline-none"
                                    style={{ borderColor: "#E2DDD5", color: "#1A1A1A" }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold mb-1 text-[#6B7280]">Payment</label>
                            <select 
                                value={paymentMode} 
                                onChange={(e) => setPaymentMode(e.target.value)}
                                className="px-3 py-2.5 rounded-lg border text-sm font-medium outline-none bg-white"
                                style={{ borderColor: "#E2DDD5", color: "#1A1A1A" }}
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                                <option value="insurance">Insurance</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Clinical Loop: Outcome Recommendations */}
            {entities && (entities.symptoms.some(s => s.toLowerCase().includes('depress') || s.toLowerCase().includes('anxiety')) || entities.diagnoses.some(d => d.toLowerCase().includes('depress') || d.toLowerCase().includes('anxiety'))) && (
                <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ background: '#F5F3FF', border: '2px solid #DDD6FE' }}>
                    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #DDD6FE' }}>
                        <div className="p-1.5 rounded-lg" style={{ background: '#5B21B615' }}>
                            <ClipboardCheck size={18} style={{ color: '#5B21B6' }} />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold" style={{ color: '#5B21B6' }}>
                                Outcome Tracking Recommended
                            </span>
                            <p className="text-[10px] text-[#2D6A4F] font-medium">Clinically relevant themes detected</p>
                        </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between bg-white/50">
                        <div className="flex gap-2">
                            {entities.symptoms.some(s => s.toLowerCase().includes('depress')) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-[#D8EDDF] text-[#2D6A4F] rounded-full">
                                    PHQ-9 (Depression)
                                </span>
                            )}
                            {entities.symptoms.some(s => s.toLowerCase().includes('anxiety')) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-[#D8EDDF] text-[#2D6A4F] rounded-full">
                                    GAD-7 (Anxiety)
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => router.push(`/patients/${patientId}`)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] hover:text-[#2D6A4F]"
                        >
                            Go to Assessments <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="px-6 pb-6">
                {saved ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">
                            <CheckCircle size={20} />
                            <span className="font-medium">Session saved to database!</span>
                        </div>
                        <button
                            onClick={() => {
                                const name = patientName ? encodeURIComponent(patientName) : '';
                                router.push(`/?saved=${name}`);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2D6A4F] hover:bg-[#1B4D38] text-white rounded-lg font-medium transition-all shadow-md"
                        >
                            <ArrowLeft size={16} />
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-70"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Session to Database'}
                    </button>
                )}
                {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}

                {/* Shareable Patient Summary */}
                {saved && activeFormat === 'ips' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        {!patientSummary ? (
                            <button
                                onClick={async () => {
                                    setGeneratingSummary(true);
                                    const fullNote = Object.values(editedNote).join('\n\n');
                                    const result = await generateShareableSummary(fullNote, patientName || 'Patient');
                                    if (result.success && result.summary) {
                                        setPatientSummary(result.summary);
                                    }
                                    setGeneratingSummary(false);
                                }}
                                disabled={generatingSummary}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-medium transition-all disabled:opacity-60"
                            >
                                {generatingSummary ? (
                                    <><Loader2 size={16} className="animate-spin" /> Generating Summary...</>
                                ) : (
                                    <><Share2 size={16} /> Generate Shareable Patient Summary</>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Share2 size={12} /> Shareable Summary
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(patientSummary);
                                            setSummaryCopied(true);
                                            setTimeout(() => setSummaryCopied(false), 2000);
                                        }}
                                        className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                                    >
                                        {summaryCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                                    {patientSummary}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Risk Assessment Card (sub-component) ──

function RiskAssessmentCard({ assessment }: { assessment: RiskAssessment }) {
    const levelConfig: Record<string, { bg: string; border: string; text: string; icon: any; label: string }> = {
        low: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: CheckCircle2, label: 'Low Risk' },
        moderate: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: AlertCircle, label: 'Moderate Risk' },
        high: { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', icon: AlertTriangle, label: 'High Risk' },
        critical: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: ShieldAlert, label: 'Critical Risk' },
    };

    const config = levelConfig[assessment.level] || levelConfig.low;
    const Icon = config.icon;

    const flags = [
        { key: 'suicidalIdeation', label: 'Suicidal Ideation', active: assessment.suicidalIdeation },
        { key: 'selfHarm', label: 'Self-Harm', active: assessment.selfHarm },
        { key: 'substanceUse', label: 'Substance Use', active: assessment.substanceUse },
        { key: 'domesticViolence', label: 'Domestic Violence', active: assessment.domesticViolence },
        { key: 'psychoticSymptoms', label: 'Psychotic Symptoms', active: assessment.psychoticSymptoms },
    ];

    const activeFlags = flags.filter((f) => f.active);

    return (
        <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ background: config.bg, border: `2px solid ${config.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${config.border}` }}>
                <div className="p-1.5 rounded-lg" style={{ background: config.text + '15' }}>
                    <Icon size={18} style={{ color: config.text }} />
                </div>
                <div className="flex-1">
                    <span className="text-sm font-bold" style={{ color: config.text }}>
                        AI Risk Assessment
                    </span>
                    <span
                        className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: config.text + '15', color: config.text }}
                    >
                        {config.label}
                    </span>
                </div>
            </div>

            <div className="px-4 py-3 space-y-3">
                {activeFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {activeFlags.map((flag) => (
                            <span
                                key={flag.key}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1"
                                style={{ background: config.text + '15', color: config.text }}
                            >
                                <AlertTriangle size={10} />
                                {flag.label}
                            </span>
                        ))}
                    </div>
                )}

                {assessment.factors.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: config.text + 'AA' }}>
                            Identified Factors
                        </p>
                        <ul className="space-y-1">
                            {assessment.factors.map((factor, i) => (
                                <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: config.text }}>
                                    <span className="shrink-0">&#8226;</span>
                                    <span>{factor}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {assessment.recommendations.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: config.text + 'AA' }}>
                            Recommendations
                        </p>
                        <ol className="space-y-1">
                            {assessment.recommendations.map((rec, i) => (
                                <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: config.text }}>
                                    <span className="font-bold shrink-0">{i + 1}.</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}

