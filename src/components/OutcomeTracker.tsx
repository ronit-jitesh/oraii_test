'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    ClipboardCheck,
    TrendingDown,
    TrendingUp,
    Minus,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Loader2,
    BarChart3,
    Brain,
} from 'lucide-react';
import { saveAssessment, getPatientAssessments } from '@/app/actions';
import {
    INSTRUMENTS,
    ALL_INSTRUMENT_TYPES,
    getSeverityLabel as getInstrumentSeverity,
    getSubscaleScores,
    type InstrumentType,
} from '@/lib/assessmentInstruments';

// =============================================
// Clinically Validated Questionnaire Data
// =============================================

const PHQ9_QUESTIONS = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const GAD7_QUESTIONS = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
];

const RESPONSE_OPTIONS = [
    { value: 0, label: 'Not at all' },
    { value: 1, label: 'Several days' },
    { value: 2, label: 'More than half the days' },
    { value: 3, label: 'Nearly every day' },
];

function getPHQ9Severity(score: number): string {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe';
}

function getGAD7Severity(score: number): string {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
}

function getSeverityColor(label: string): string {
    switch (label) {
        case 'Minimal': return '#10B981';
        case 'Mild': return '#F59E0B';
        case 'Moderate': return '#F97316';
        case 'Moderately Severe': return '#EF4444';
        case 'Severe': return '#DC2626';
        default: return '#94A3B8';
    }
}

// =============================================
// Types
// =============================================

interface Assessment {
    id: string;
    instrument: InstrumentType;
    item_scores: number[];
    total_score: number;
    severity_label: string;
    administered_at: string;
    subscale_scores?: { name: string; rawScore: number; doubled: number; severity: string }[];
}

interface OutcomeTrackerProps {
    patientId: string;
    patientName: string;
}

// =============================================
// Component
// =============================================

export default function OutcomeTracker({ patientId, patientName }: OutcomeTrackerProps) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Form state
    const [activeInstrument, setActiveInstrument] = useState<InstrumentType>('PHQ-9');
    const [showForm, setShowForm] = useState(false);
    const [responses, setResponses] = useState<(number | null)[]>([]);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const instrumentDef = INSTRUMENTS[activeInstrument];
    const questions = instrumentDef.items;
    const responseOptions = instrumentDef.responseOptions.length > 0 ? instrumentDef.responseOptions : RESPONSE_OPTIONS;

    // Load assessments on mount
    useEffect(() => {
        async function load() {
            const result = await getPatientAssessments(patientId);
            if (result.success && result.assessments) {
                setAssessments(result.assessments);
            }
            setLoading(false);
        }
        load();
    }, [patientId]);

    // Reset form when instrument changes
    useEffect(() => {
        setResponses(new Array(questions.length).fill(null));
        setSaved(false);
        setSaveError(null);
    }, [activeInstrument, questions.length]);

    const allAnswered = responses.every((r) => r !== null);
    const totalScore = responses.reduce<number>((sum, r) => sum + (r ?? 0), 0);
    const severityLabel = allAnswered
        ? getInstrumentSeverity(activeInstrument, totalScore)
        : '';

    const handleSubmit = () => {
        if (!allAnswered) return;
        setSaveError(null);

        // Calculate subscale scores for instruments that have them (e.g. DASS-21)
        const subscaleScores = getSubscaleScores(activeInstrument, responses as number[]);

        startTransition(async () => {
            const result = await saveAssessment({
                patientId,
                instrument: activeInstrument,
                itemScores: responses as number[],
                totalScore,
                severityLabel,
                subscaleScores: subscaleScores || undefined,
            });

            if (result.success && result.assessment) {
                setAssessments((prev) => [result.assessment!, ...prev]);
                setSaved(true);
                setTimeout(() => {
                    setShowForm(false);
                    setSaved(false);
                    setResponses(new Array(questions.length).fill(null));
                }, 2000);
            } else {
                setSaveError(result.error || 'Failed to save assessment');
            }
        });
    };

    // ── Chart Data ──
    const chartData = buildChartData(assessments);
    const efficacy = computeEfficacy(assessments);

    if (loading) {
        return (
            <div className="bg-white p-8 text-center" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
                <Loader2 size={24} className="animate-spin mx-auto text-[#2D6A4F]" />
                <p className="text-sm text-[#94A3B8] mt-2">Loading outcome data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Section Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain size={18} strokeWidth={1.5} className="text-[#2D6A4F]" />
                    <h2 className="font-bold text-[#1E293B]">Outcome Intelligence</h2>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setSaved(false); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                        background: showForm ? '#F0EDE6' : '#2D6A4F',
                        color: showForm ? '#64748B' : '#fff',
                    }}
                >
                    <ClipboardCheck size={15} />
                    {showForm ? 'Close Form' : 'Administer Assessment'}
                    {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* ── Efficacy Badges ── */}
            {(efficacy.phq9 || efficacy.gad7) && (
                <div className="flex flex-wrap gap-3">
                    {efficacy.phq9 && <EfficacyBadge instrument="PHQ-9" trend={efficacy.phq9} />}
                    {efficacy.gad7 && <EfficacyBadge instrument="GAD-7" trend={efficacy.gad7} />}
                </div>
            )}

            {/* ── Assessment Form ── */}
            {showForm && (
                <div className="bg-white overflow-hidden animate-in slide-in-from-top-2 duration-300" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
                    {/* Instrument Tabs */}
                    {/* Instrument Tabs — supports all 6 instruments */}
                    <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid #F0EDE6' }}>
                        {ALL_INSTRUMENT_TYPES.map((instr) => (
                            <button
                                key={instr}
                                onClick={() => setActiveInstrument(instr)}
                                className="relative py-3.5 px-4 text-center transition-colors whitespace-nowrap"
                                style={{
                                    color: activeInstrument === instr ? '#2D6A4F' : '#94A3B8',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    minWidth: 'fit-content',
                                }}
                            >
                                {instr}
                                {activeInstrument === instr && (
                                    <div
                                        className="absolute bottom-0 left-2 right-2 h-[2px]"
                                        style={{ background: '#2D6A4F', borderRadius: 2 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Instruction */}
                    <div className="px-5 pt-4 pb-2">
                        <p className="text-xs font-semibold text-[#334155] mb-1">{instrumentDef.fullName}</p>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                            {instrumentDef.description}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-1">
                            {instrumentDef.items.length} items • Max score: {instrumentDef.maxTotalScore}
                            {instrumentDef.inputType === 'visual-analog' && ' • Visual Analog Scale (0-10)'}
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="px-5 pb-4 space-y-3 max-h-[420px] overflow-y-auto">
                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className="rounded-lg p-3" style={{ background: '#FAFBFC', border: '1px solid #F0EDE6' }}>
                                <p className="text-sm text-[#334155] mb-2.5">
                                    <span className="font-bold text-[#2D6A4F] mr-1.5">{qIdx + 1}.</span>
                                    {q}
                                </p>
                                <div className={`grid gap-2 ${responseOptions.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5'}`}>
                                    {responseOptions.map((opt) => {
                                        const isSelected = responses[qIdx] === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    const next = [...responses];
                                                    next[qIdx] = opt.value;
                                                    setResponses(next);
                                                }}
                                                className="text-xs py-2 px-2 rounded-lg font-medium transition-all text-center"
                                                style={{
                                                    background: isSelected ? '#2D6A4F' : '#fff',
                                                    color: isSelected ? '#fff' : '#64748B',
                                                    border: isSelected ? '1px solid #2D6A4F' : '1px solid #E2DDD5',
                                                }}
                                            >
                                                <span className="font-bold block">{opt.value}</span>
                                                <span className="block mt-0.5 opacity-80" style={{ fontSize: 10 }}>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Score Summary + Submit */}
                    <div className="px-5 py-4" style={{ borderTop: '1px solid #F0EDE6', background: '#FAFBFC' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-[#64748B]">Total Score:</span>
                                <span className="text-2xl font-bold" style={{ color: allAnswered ? getSeverityColor(severityLabel) : '#CBD5E1' }}>
                                    {allAnswered ? totalScore : '—'}
                                </span>
                                <span className="text-sm text-[#64748B]">
                                    / {instrumentDef.maxTotalScore}
                                </span>
                            </div>
                            {allAnswered && (
                                <span
                                    className="text-xs font-bold px-3 py-1 rounded-full"
                                    style={{
                                        background: getSeverityColor(severityLabel) + '15',
                                        color: getSeverityColor(severityLabel),
                                        border: `1px solid ${getSeverityColor(severityLabel)}30`,
                                    }}
                                >
                                    {severityLabel}
                                </span>
                            )}
                        </div>

                        {saved ? (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">
                                <CheckCircle size={18} />
                                <span className="font-medium text-sm">Assessment saved successfully!</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!allAnswered || isPending}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                                style={{
                                    background: allAnswered ? '#2D6A4F' : '#E2DDD5',
                                    color: allAnswered ? '#fff' : '#94A3B8',
                                }}
                            >
                                {isPending ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
                                {isPending ? 'Saving...' : `Save ${activeInstrument} Assessment`}
                            </button>
                        )}
                        {saveError && <p className="text-red-500 text-xs mt-2 text-center">{saveError}</p>}
                    </div>
                </div>
            )}

            {/* ── Outcome Trend Chart ── */}
            {chartData.length > 0 ? (
                <div className="bg-white overflow-hidden" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F0EDE6' }}>
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} strokeWidth={1.5} className="text-[#2D6A4F]" />
                            <span className="font-semibold text-sm text-[#334155]">Outcome Trend</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#2D6A4F]">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#2D6A4F' }} />
                                PHQ-9
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#F59E0B]">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                                GAD-7
                            </span>
                        </div>
                    </div>
                    <div className="px-4 py-5">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={{ stroke: '#E2DDD5' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 27]}
                                    ticks={[0, 5, 10, 15, 20, 27]}
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={{ stroke: '#E2DDD5' }}
                                    tickLine={false}
                                />
                                <Tooltip content={<OutcomeTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="phq9"
                                    stroke="#2D6A4F"
                                    strokeWidth={2.5}
                                    dot={{ r: 5, fill: '#fff', stroke: '#2D6A4F', strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: '#2D6A4F', stroke: '#fff', strokeWidth: 2 }}
                                    connectNulls
                                    name="PHQ-9"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="gad7"
                                    stroke="#F59E0B"
                                    strokeWidth={2.5}
                                    dot={{ r: 5, fill: '#fff', stroke: '#F59E0B', strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                                    connectNulls
                                    name="GAD-7"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        <p className="text-center text-[10px] text-[#94A3B8] mt-2 uppercase tracking-wider font-semibold">
                            Lower score = Clinical Improvement
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 text-center" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
                    <BarChart3 size={28} className="mx-auto mb-3 text-[#CBD5E1]" strokeWidth={1.5} />
                    <p className="text-sm text-[#94A3B8]">
                        Administer a PHQ-9 or GAD-7 assessment to begin tracking outcomes
                    </p>
                </div>
            )}

            {/* ── Assessment History ── */}
            {assessments.length > 0 && (
                <div className="bg-white overflow-hidden" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
                    <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F0EDE6' }}>
                        <ClipboardCheck size={16} strokeWidth={1.5} className="text-[#94A3B8]" />
                        <span className="font-semibold text-sm text-[#334155]">Assessment History</span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ml-auto"
                            style={{ color: '#2D6A4F', background: '#D8EDDF' }}
                        >
                            {assessments.length} total
                        </span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {assessments.map((a) => {
                            const date = new Date(a.administered_at);
                            return (
                                <div
                                    key={a.id}
                                    className="px-5 py-3 flex items-center gap-4 hover:bg-[#FAFBFC] transition-colors"
                                    style={{ borderBottom: '1px solid #F0EDE6' }}
                                >
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
                                        style={{
                                            color: ['PHQ-9', 'DASS-21', 'CORE-10'].includes(a.instrument) ? '#2D6A4F' : '#D97706',
                                            background: ['PHQ-9', 'DASS-21', 'CORE-10'].includes(a.instrument) ? '#D8EDDF' : '#FFFBEB',
                                        }}
                                    >
                                        {a.instrument}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-[#1E293B]">{a.total_score}</span>
                                        <span className="text-xs text-[#94A3B8] ml-1.5">
                                            / {INSTRUMENTS[a.instrument]?.maxTotalScore || '?'}
                                        </span>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            color: getSeverityColor(a.severity_label),
                                            background: getSeverityColor(a.severity_label) + '15',
                                        }}
                                    >
                                        {a.severity_label}
                                    </span>
                                    <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================
// Sub-components & Helpers
// =============================================

function EfficacyBadge({ instrument, trend }: { instrument: string; trend: 'improving' | 'stable' | 'worsening' }) {
    const config = {
        improving: { icon: TrendingDown, label: 'Improving', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
        stable: { icon: Minus, label: 'Stable', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
        worsening: { icon: TrendingUp, label: 'Worsening', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    };
    const c = config[trend];
    const Icon = c.icon;

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
        >
            <Icon size={14} />
            <span>{instrument}:</span>
            <span className="font-bold">{c.label}</span>
        </div>
    );
}

function OutcomeTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div
                className="rounded-lg px-4 py-3 shadow-lg max-w-[220px]"
                style={{ background: '#1E293B', border: '1px solid #334155' }}
            >
                <p className="text-xs font-bold text-white mb-1">{data.date}</p>
                {data.phq9 != null && (
                    <p className="text-xs text-[#94A3B8]">
                        PHQ-9: <span className="text-[#A78BFA] font-semibold">{data.phq9}</span>
                        <span className="ml-1 opacity-70">({data.phq9Severity})</span>
                    </p>
                )}
                {data.gad7 != null && (
                    <p className="text-xs text-[#94A3B8]">
                        GAD-7: <span className="text-[#FBBF24] font-semibold">{data.gad7}</span>
                        <span className="ml-1 opacity-70">({data.gad7Severity})</span>
                    </p>
                )}
            </div>
        );
    }
    return null;
}

function buildChartData(assessments: Assessment[]) {
    // Group by date, merge PHQ-9 and GAD-7 onto same row
    const sorted = [...assessments].sort(
        (a, b) => new Date(a.administered_at).getTime() - new Date(b.administered_at).getTime()
    );

    const dateMap = new Map<string, any>();

    for (const a of sorted) {
        const dateKey = new Date(a.administered_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, { date: dateKey });
        }

        const entry = dateMap.get(dateKey)!;
        if (a.instrument === 'PHQ-9') {
            entry.phq9 = a.total_score;
            entry.phq9Severity = a.severity_label;
        } else {
            entry.gad7 = a.total_score;
            entry.gad7Severity = a.severity_label;
        }
    }

    return Array.from(dateMap.values());
}

function computeEfficacy(assessments: Assessment[]) {
    const result: { phq9?: 'improving' | 'stable' | 'worsening'; gad7?: 'improving' | 'stable' | 'worsening' } = {};

    for (const instrument of ['PHQ-9', 'GAD-7'] as const) {
        const scores = assessments
            .filter((a) => a.instrument === instrument)
            .sort((a, b) => new Date(a.administered_at).getTime() - new Date(b.administered_at).getTime())
            .map((a) => a.total_score);

        if (scores.length >= 2) {
            const first = scores[0];
            const last = scores[scores.length - 1];
            const delta = last - first;

            // Clinically meaningful change: ≥5 points for PHQ-9, ≥4 for GAD-7
            const threshold = instrument === 'PHQ-9' ? 5 : 4;
            const key = instrument === 'PHQ-9' ? 'phq9' : 'gad7';

            if (delta <= -threshold) {
                result[key] = 'improving';
            } else if (delta >= threshold) {
                result[key] = 'worsening';
            } else {
                result[key] = 'stable';
            }
        }
    }

    return result;
}


