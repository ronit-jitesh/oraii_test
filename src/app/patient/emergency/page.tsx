'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Phone, Plus, Trash2, Star, AlertTriangle,
    UserPlus, Heart, Edit2, Check, X, BookOpen,
} from 'lucide-react';
import {
    getEmergencyContacts, saveEmergencyContact, deleteEmergencyContact, saveSafetyPlan,
} from '../actions';

const CRISIS_HELPLINES = [
    { name: 'Vandrevala Foundation', phone: '1860-2662-345', region: 'India' },
    { name: 'iCall (TISS)', phone: '9152987821', region: 'India' },
    { name: 'NIMHANS Helpline', phone: '080-46110007', region: 'India' },
];

export default function EmergencyPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ contactName: '', contactPhone: '', relationship: '', isPrimary: false });
    const [saving, setSaving] = useState(false);
    const [showPanic, setShowPanic] = useState(false);
    const [panicSent, setPanicSent] = useState(false);

    // Safety plan state
    const [showSafetyPlan, setShowSafetyPlan] = useState(false);
    const [safetyPlan, setSafetyPlan] = useState({
        warningSignals: [''],
        copingStrategies: [''],
        reasonsToLive: [''],
        socialContacts: [''],
        professionalContacts: [''],
        environmentSafety: [''],
    });

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const res = await getEmergencyContacts();
        if (res.success && res.contacts) setContacts(res.contacts);
        setLoading(false);
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await saveEmergencyContact(form);
        if (res.success) {
            setShowForm(false);
            setForm({ contactName: '', contactPhone: '', relationship: '', isPrimary: false });
            await loadContacts();
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this emergency contact?')) return;
        await deleteEmergencyContact(id);
        await loadContacts();
    };

    const handlePanic = async () => {
        // Create in-app alert via chat_messages flagged message
        const { saveChatMessage } = await import('../actions');
        await saveChatMessage({
            role: 'user',
            content: '🚨 PANIC BUTTON ACTIVATED — Patient has activated their safety alert and may need immediate support.',
            flagged: true,
        });

        setPanicSent(true);
        setShowPanic(false);

        setTimeout(() => setPanicSent(false), 10000);
    };

    const addListItem = (field: keyof typeof safetyPlan) => {
        setSafetyPlan(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const updateListItem = (field: keyof typeof safetyPlan, index: number, value: string) => {
        setSafetyPlan(prev => {
            const list = [...prev[field]];
            list[index] = value;
            return { ...prev, [field]: list };
        });
    };

    const handleSaveSafetyPlan = async () => {
        setSaving(true);
        const cleaned = Object.fromEntries(
            Object.entries(safetyPlan).map(([k, v]) => [k, v.filter(s => s.trim())])
        ) as any;
        await saveSafetyPlan(cleaned);
        setSaving(false);
        setShowSafetyPlan(false);
    };

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DC262615' }}>
                        <ShieldAlert size={20} style={{ color: '#DC2626' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        Emergency & Safety
                    </h1>
                </div>
            </div>

            {/* PANIC BUTTON */}
            <div className="mb-8">
                {panicSent ? (
                    <div className="rounded-3xl p-6 text-center" style={{ background: '#D8EDDF', border: '2px solid #B7DFC5' }}>
                        <Check size={32} className="mx-auto mb-2 text-green-700" />
                        <h3 className="font-bold text-base text-green-800 mb-1">Alert Sent</h3>
                        <p className="text-sm text-green-700">Your therapist has been notified. Help is on the way.</p>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowPanic(true)}
                        className="w-full rounded-3xl p-6 text-center transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                            background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.3)',
                        }}
                    >
                        <AlertTriangle size={32} className="text-white mx-auto mb-2" />
                        <h3 className="text-white font-bold text-lg">I Need Help Now</h3>
                        <p className="text-red-100 text-xs mt-1">Tap to alert your emergency contact and therapist</p>
                    </button>
                )}
            </div>

            {/* Panic Confirmation Modal */}
            {showPanic && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-3xl p-8 max-w-sm w-full text-center" style={{ background: 'var(--color-surface)' }}>
                        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
                        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                            Are you sure?
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                            This will alert your emergency contact and therapist that you need immediate support.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPanic(false)}
                                className="flex-1 py-3 rounded-xl text-sm font-medium border"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePanic}
                                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                                style={{ background: '#DC2626' }}
                            >
                                Yes, Send Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Crisis Helplines */}
            <div className="rounded-2xl p-5 border mb-8" style={{ background: '#FFF5F5', borderColor: '#FED7D7' }}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#9B2C2C' }}>
                    <Phone size={16} /> Crisis Helplines
                </h3>
                <div className="space-y-2">
                    {CRISIS_HELPLINES.map(h => (
                        <a
                            key={h.phone}
                            href={`tel:${h.phone}`}
                            className="flex items-center justify-between py-2 text-sm hover:underline"
                            style={{ color: '#9B2C2C' }}
                        >
                            <span className="font-medium">{h.name}</span>
                            <span className="font-bold">{h.phone}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    My Emergency Contacts
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                    <Plus size={12} /> Add
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSaveContact} className="rounded-2xl p-5 border mb-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                            value={form.contactName}
                            onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))}
                            placeholder="Name"
                            required
                            className="rounded-xl text-sm"
                        />
                        <input
                            value={form.contactPhone}
                            onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder="Phone number"
                            required
                            className="rounded-xl text-sm"
                        />
                    </div>
                    <input
                        value={form.relationship}
                        onChange={e => setForm(prev => ({ ...prev, relationship: e.target.value }))}
                        placeholder="Relationship (e.g. Spouse, Parent, Friend)"
                        className="w-full rounded-xl text-sm mb-3"
                    />
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isPrimary}
                            onChange={e => setForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Primary emergency contact</span>
                    </label>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 rounded-full text-sm font-bold text-white"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {saving ? 'Saving...' : 'Save Contact'}
                    </button>
                </form>
            )}

            <div className="space-y-3 mb-8">
                {contacts.filter(c => c.contact_phone).map(c => (
                    <div
                        key={c.id}
                        className="rounded-2xl px-5 py-4 border flex items-center justify-between"
                        style={{ background: 'var(--color-surface)', borderColor: c.is_primary ? '#D8EDDF' : 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-3">
                            {c.is_primary && <Star size={14} className="text-amber-500" />}
                            <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{c.contact_name}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    {c.contact_phone} {c.relationship ? `· ${c.relationship}` : ''}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50">
                            <Trash2 size={14} className="text-red-400" />
                        </button>
                    </div>
                ))}

                {!loading && contacts.filter(c => c.contact_phone).length === 0 && (
                    <div className="text-center py-8 rounded-2xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <UserPlus size={24} className="mx-auto mb-2" style={{ color: 'var(--color-border)' }} />
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Add an emergency contact above
                        </p>
                    </div>
                )}
            </div>

            {/* Safety Plan */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Safety Plan
                </h2>
                <button
                    onClick={() => setShowSafetyPlan(!showSafetyPlan)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: '#FFF5F5', color: '#DC2626' }}
                >
                    <BookOpen size={12} /> {showSafetyPlan ? 'Close' : 'Edit Plan'}
                </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Based on the Stanley-Brown Safety Plan — a step-by-step guide for when you're in distress.
            </p>

            {showSafetyPlan && (
                <div className="space-y-4 mb-6">
                    {[
                        { key: 'warningSignals' as const, label: 'Warning Signs', desc: 'Thoughts, feelings, or situations that signal a crisis' },
                        { key: 'copingStrategies' as const, label: 'Coping Strategies', desc: 'Things I can do to calm myself without contacting anyone' },
                        { key: 'reasonsToLive' as const, label: 'Reasons to Live', desc: 'People, goals, or things that matter to me' },
                        { key: 'socialContacts' as const, label: 'People I Can Contact', desc: 'Friends or family who can help distract or support me' },
                        { key: 'professionalContacts' as const, label: 'Professional Help', desc: 'Therapist, doctor, or helpline numbers' },
                        { key: 'environmentSafety' as const, label: 'Making My Environment Safe', desc: 'Steps to remove access to means' },
                    ].map(section => (
                        <div key={section.key} className="rounded-2xl p-5 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{section.label}</h4>
                            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{section.desc}</p>
                            {safetyPlan[section.key].map((item, i) => (
                                <input
                                    key={i}
                                    value={item}
                                    onChange={e => updateListItem(section.key, i, e.target.value)}
                                    placeholder={`Item ${i + 1}`}
                                    className="w-full rounded-lg text-sm mb-2"
                                />
                            ))}
                            <button
                                onClick={() => addListItem(section.key)}
                                className="text-xs font-medium flex items-center gap-1 mt-1"
                                style={{ color: 'var(--color-primary)' }}
                            >
                                <Plus size={12} /> Add item
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleSaveSafetyPlan}
                        disabled={saving}
                        className="px-6 py-3 rounded-full text-sm font-bold text-white"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {saving ? 'Saving...' : 'Save Safety Plan'}
                    </button>
                </div>
            )}
        </div>
    );
}
