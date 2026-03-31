'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronRight, TrendingDown, TrendingUp as TrendUp, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { saveScreeningResult, getScreeningHistory } from '../actions';
import { PHQ9, GAD7, INSTRUMENTS, getSeverityLabel, type InstrumentDefinition, type InstrumentType } from '@/lib/assessmentInstruments';

const PATIENT_INSTRUMENTS: { type: InstrumentType; icon: string }[] = [
    { type: 'PHQ-9', icon: '🧠' },
    { type: 'GAD-7', icon: '😰' },
];

export default function ScreeningPage() {
    const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            const res = await getScreeningHistory();
            if (res.success && res.results) setHistory(res.results);
        })();
    }, []);

    const instrument: InstrumentDefinition | null = selectedInstrument ? INSTRUMENTS[selectedInstrument] : null;

    const startAssessment = (type: InstrumentType) => {
        const inst = INSTRUMENTS[type];
        setSelectedInstrument(type);
        setAnswers(Array(inst.items.length).fill(-1));
        setCurrentQ(0);
        setSubmitted(false);
    };

    const selectAnswer = (value: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQ] = value;
        setAnswers(newAnswers);

        // Auto-advance after brief delay
        setTimeout(() => {
            if (currentQ < (instrument?.items.length || 0) - 1) {
                setCurrentQ(currentQ + 1);
            }
        }, 300);
    };

    const totalScore = answers.reduce((sum, v) => sum + (v >= 0 ? v : 0), 0);
    const allAnswered = answers.every(a => a >= 0);

    const submit = async () => {
        if (!instrument || !selectedInstrument || !allAnswered) return;
        setSaving(true);
        const severity = getSeverityLabel(selectedInstrument, totalScore);

        const res = await saveScreeningResult({
            instrument: selectedInstrument,
            itemScores: answers,
            totalScore,
            severityLabel: severity,
        });

        if (res.success) {
            setSubmitted(true);
            // Refresh history
            const histRes = await getScreeningHistory();
            if (histRes.success && histRes.results) setHistory(histRes.results);
        }
        setSaving(false);
    };

    const getSeverityColor = (severity: string) => {
        if (['Minimal', 'Normal', 'Healthy'].includes(severity)) return '#059669';
        if (['Mild', 'Low'].includes(severity)) return '#D97706';
        if (['Moderate'].includes(severity)) return '#EA580C';
        return '#DC2626';
    };

    // Results view
    if (submitted && instrument && selectedInstrument) {
        const severity = getSeverityLabel(selectedInstrument, totalScore);
        const band = instrument.severityBands.find(b => totalScore >= b.min && totalScore <= b.max);

        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${getSeverityColor(severity)}15` }}>
                        {severity === 'Minimal' || severity === 'Normal'
                            ? <CheckCircle2 size={32} style={{ color: getSeverityColor(severity) }} />
                            : <AlertTriangle size={32} style={{ color: getSeverityColor(severity) }} />
                        }
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        Your Score: {totalScore}/{instrument.maxTotalScore}
                    </h2>
                    <p className="text-lg font-semibold" style={{ color: getSeverityColor(severity) }}>{severity}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{band?.action}</p>
                </div>

                <div className="rounded-2xl p-5 border mb-6" style={{ background: '#FFF9E6', borderColor: '#FDE68A' }}>
                    <p className="text-xs" style={{ color: '#92400E' }}>
                        <strong>Note:</strong> This result has been shared with your therapist for review. This screening is a self-reporting tool and does not constitute a clinical diagnosis.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setSelectedInstrument(null); setSubmitted(false); }}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        Take Another Assessment
                    </button>
                </div>
            </div>
        );
    }

    // Question view
    if (instrument && selectedInstrument) {
        const progress = ((currentQ + 1) / instrument.items.length) * 100;

        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto">
                <button onClick={() => setSelectedInstrument(null)} className="text-sm font-medium mb-6 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    ← Back
                </button>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                            {selectedInstrument} • Question {currentQ + 1} of {instrument.items.length}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                            Score: {totalScore}
                        </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%`, background: 'var(--color-primary)' }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="rounded-3xl p-6 border mb-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                        Over the last 2 weeks, how often have you been bothered by:
                    </p>
                    <p className="text-base font-bold leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {instrument.items[currentQ]}
                    </p>
                </div>

                {/* Response Options */}
                <div className="space-y-3 mb-6">
                    {instrument.responseOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => selectAnswer(opt.value)}
                            className="w-full text-left px-5 py-4 rounded-2xl border transition-all text-sm font-medium"
                            style={{
                                background: answers[currentQ] === opt.value ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                borderColor: answers[currentQ] === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                                color: answers[currentQ] === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                                fontWeight: answers[currentQ] === opt.value ? 600 : 500,
                            }}
                        >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold"
                                style={{
                                    background: answers[currentQ] === opt.value ? 'var(--color-primary)' : 'var(--color-bg)',
                                    color: answers[currentQ] === opt.value ? 'white' : 'var(--color-text-muted)',
                                }}
                            >
                                {opt.value}
                            </span>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                    {currentQ > 0 && (
                        <button
                            onClick={() => setCurrentQ(currentQ - 1)}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium border"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                        >
                            Previous
                        </button>
                    )}
                    {currentQ < instrument.items.length - 1 ? (
                        <button
                            onClick={() => answers[currentQ] >= 0 && setCurrentQ(currentQ + 1)}
                            disabled={answers[currentQ] < 0}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={submit}
                            disabled={!allAnswered || saving}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            {saving ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Hub view
    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D9770615' }}>
                        <ClipboardCheck size={20} style={{ color: '#D97706' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        Mental Health Screening
                    </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Standardized self-assessments. Results are shared with your therapist.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {PATIENT_INSTRUMENTS.map(pi => {
                    const inst = INSTRUMENTS[pi.type];
                    return (
                        <button
                            key={pi.type}
                            onClick={() => startAssessment(pi.type)}
                            className="text-left rounded-3xl p-6 border transition-all hover:-translate-y-1"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
                        >
                            <span className="text-3xl mb-3 block">{pi.icon}</span>
                            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-text)' }}>{inst.fullName}</h3>
                            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{inst.description}</p>
                            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                                Start <ChevronRight size={12} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Past Results</h2>
                    <div className="space-y-3">
                        {history.slice(0, 10).map((r: any) => (
                            <div
                                key={r.id}
                                className="rounded-2xl px-5 py-4 border flex items-center justify-between"
                                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                                        {r.instrument} • {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                                        Score: {r.total_score}
                                    </p>
                                </div>
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{
                                        background: `${getSeverityColor(r.severity_label)}12`,
                                        color: getSeverityColor(r.severity_label),
                                    }}
                                >
                                    {r.severity_label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
