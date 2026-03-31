'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Heart, Target, PenLine, ChevronRight, Check, Sparkles } from 'lucide-react';
import { savePurposeEntry, getPurposeEntries } from '../actions';

const IKIGAI_PROMPTS = [
    { key: 'love', label: 'What you love', placeholder: 'Activities, hobbies, or topics that energize you...', color: '#E63946' },
    { key: 'good', label: "What you're good at", placeholder: 'Skills, talents, things people say you excel at...', color: '#2D6A4F' },
    { key: 'world', label: 'What the world needs', placeholder: 'Problems you care about solving, ways to help others...', color: '#0891B2' },
    { key: 'paid', label: 'What you can be paid for', placeholder: 'Jobs, services, or value you can offer professionally...', color: '#D97706' },
];

const VALUES_LIST = [
    'Family', 'Creativity', 'Adventure', 'Spirituality', 'Health', 'Friendship',
    'Learning', 'Freedom', 'Compassion', 'Honesty', 'Courage', 'Gratitude',
    'Humor', 'Justice', 'Nature', 'Simplicity', 'Leadership', 'Love',
    'Respect', 'Patience', 'Resilience', 'Wisdom', 'Joy', 'Community',
    'Growth', 'Peace', 'Purpose', 'Belonging', 'Independence', 'Service',
];

type Module = 'ikigai' | 'values' | 'goals';

const MODULES: { id: Module; label: string; desc: string; icon: any; color: string }[] = [
    { id: 'ikigai', label: 'Ikigai Explorer', desc: 'Discover your reason for being', icon: Compass, color: '#7C3AED' },
    { id: 'values', label: 'Values Compass', desc: 'Identify your core values', icon: Heart, color: '#E63946' },
    { id: 'goals', label: 'Goal Builder', desc: 'Set SMART goals', icon: Target, color: '#059669' },
];

export default function PurposePage() {
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [completedModules, setCompletedModules] = useState<string[]>([]);

    // Ikigai state
    const [ikigaiResponses, setIkigaiResponses] = useState<Record<string, string>>({});

    // Values state
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [valuesReflection, setValuesReflection] = useState('');

    // Goals state
    const [goalData, setGoalData] = useState({ specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' });

    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await getPurposeEntries();
            if (res.success && res.entries) {
                const modules = [...new Set(res.entries.map((e: any) => e.module))];
                setCompletedModules(modules as string[]);
            }
        })();
    }, []);

    const saveModule = async (module: string, responses: Record<string, unknown>) => {
        setSaving(true);
        const res = await savePurposeEntry({ module, responses });
        if (res.success) {
            setCompletedModules(prev => [...prev, module]);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setActiveModule(null);
            }, 2000);
        }
        setSaving(false);
    };

    const toggleValue = (v: string) => {
        setSelectedValues(prev =>
            prev.includes(v)
                ? prev.filter(x => x !== v)
                : prev.length < 5 ? [...prev, v] : prev
        );
    };

    if (showSuccess) {
        return (
            <div className="min-h-[calc(100vh-56px)] lg:min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Saved!</h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Your reflection has been recorded. 🌿</p>
                </div>
            </div>
        );
    }

    if (!activeModule) {
        return (
            <div className="p-6 md:p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED15' }}>
                            <Sparkles size={20} style={{ color: '#7C3AED' }} />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                            Finding Purpose
                        </h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Guided exercises to explore your values, passions, and life direction.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {MODULES.map(m => {
                        const Icon = m.icon;
                        const isComplete = completedModules.includes(m.id);
                        return (
                            <button
                                key={m.id}
                                onClick={() => setActiveModule(m.id)}
                                className="text-left rounded-3xl p-6 border transition-all hover:-translate-y-1"
                                style={{
                                    background: 'var(--color-surface)',
                                    borderColor: isComplete ? '#D8EDDF' : 'var(--color-border)',
                                    boxShadow: 'var(--shadow-card)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${m.color}12` }}>
                                        <Icon size={22} style={{ color: m.color }} />
                                    </div>
                                    {isComplete && (
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <Check size={14} className="text-green-600" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{m.label}</h3>
                                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{m.desc}</p>
                                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: m.color }}>
                                    {isComplete ? 'Redo' : 'Start'} <ChevronRight size={12} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Ikigai Module
    if (activeModule === 'ikigai') {
        return (
            <div className="p-6 md:p-8 max-w-3xl mx-auto">
                <button onClick={() => setActiveModule(null)} className="text-sm font-medium mb-6 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    ← Back to modules
                </button>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Ikigai Explorer</h2>
                <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    Ikigai (生き甲斐) — your "reason for being". Answer each question to discover where your passion, mission, vocation, and profession intersect.
                </p>

                <div className="space-y-5">
                    {IKIGAI_PROMPTS.map(prompt => (
                        <div key={prompt.key} className="rounded-2xl p-5 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full" style={{ background: prompt.color }} />
                                <label className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{prompt.label}</label>
                            </div>
                            <textarea
                                value={ikigaiResponses[prompt.key] || ''}
                                onChange={e => setIkigaiResponses(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                                placeholder={prompt.placeholder}
                                rows={3}
                                className="w-full text-sm resize-none rounded-xl"
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => saveModule('ikigai', ikigaiResponses)}
                    disabled={saving || !Object.values(ikigaiResponses).some(v => v.trim())}
                    className="mt-6 px-8 py-3 rounded-full text-white font-bold text-sm transition-all disabled:opacity-50"
                    style={{ background: 'var(--color-primary)' }}
                >
                    {saving ? 'Saving...' : 'Save My Ikigai'}
                </button>
            </div>
        );
    }

    // Values Module
    if (activeModule === 'values') {
        return (
            <div className="p-6 md:p-8 max-w-3xl mx-auto">
                <button onClick={() => setActiveModule(null)} className="text-sm font-medium mb-6 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    ← Back to modules
                </button>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Values Compass</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                    Select your top 5 core values — the principles that guide your decisions and define who you want to be.
                </p>

                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                    {selectedValues.length}/5 selected
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {VALUES_LIST.map(v => {
                        const isSelected = selectedValues.includes(v);
                        return (
                            <button
                                key={v}
                                onClick={() => toggleValue(v)}
                                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                                style={{
                                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: isSelected ? 'white' : 'var(--color-text-muted)',
                                    border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                                }}
                            >
                                {v}
                            </button>
                        );
                    })}
                </div>

                {selectedValues.length > 0 && (
                    <div className="rounded-2xl p-5 border mb-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <PenLine size={16} style={{ color: 'var(--color-primary)' }} />
                            <label className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Reflection</label>
                        </div>
                        <textarea
                            value={valuesReflection}
                            onChange={e => setValuesReflection(e.target.value)}
                            placeholder="How aligned is your current life with these values? What could you change?"
                            rows={4}
                            className="w-full text-sm resize-none rounded-xl"
                        />
                    </div>
                )}

                <button
                    onClick={() => saveModule('values', { values: selectedValues, reflection: valuesReflection })}
                    disabled={saving || selectedValues.length === 0}
                    className="px-8 py-3 rounded-full text-white font-bold text-sm transition-all disabled:opacity-50"
                    style={{ background: 'var(--color-primary)' }}
                >
                    {saving ? 'Saving...' : 'Save Values'}
                </button>
            </div>
        );
    }

    // Goals Module
    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <button onClick={() => setActiveModule(null)} className="text-sm font-medium mb-6 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                ← Back to modules
            </button>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>SMART Goal Builder</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                Build a goal that is Specific, Measurable, Achievable, Relevant, and Time-bound.
            </p>

            <div className="space-y-4">
                {[
                    { key: 'specific', label: 'Specific', prompt: 'What exactly do you want to accomplish?', color: '#2D6A4F' },
                    { key: 'measurable', label: 'Measurable', prompt: 'How will you know when you\'ve achieved it?', color: '#0891B2' },
                    { key: 'achievable', label: 'Achievable', prompt: 'What steps will you take? Is this realistic?', color: '#7C3AED' },
                    { key: 'relevant', label: 'Relevant', prompt: 'Why does this goal matter to you right now?', color: '#D97706' },
                    { key: 'timeBound', label: 'Time-bound', prompt: 'By when will you achieve this?', color: '#E63946' },
                ].map(field => (
                    <div key={field.key} className="rounded-2xl p-5 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: field.color }} />
                            <label className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{field.label}</label>
                        </div>
                        <input
                            value={(goalData as any)[field.key]}
                            onChange={e => setGoalData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.prompt}
                            className="w-full text-sm rounded-xl"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={() => saveModule('goals', goalData)}
                disabled={saving || !goalData.specific.trim()}
                className="mt-6 px-8 py-3 rounded-full text-white font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
            >
                {saving ? 'Saving...' : 'Save Goal'}
            </button>
        </div>
    );
}
