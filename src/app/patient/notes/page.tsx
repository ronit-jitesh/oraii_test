'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Wand2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getSessionNotesForPatient, translateNoteToPlainLanguage } from '../actions';

export default function NotesPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [translating, setTranslating] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const res = await getSessionNotesForPatient();
            if (res.success && res.sessions) setSessions(res.sessions);
            setLoading(false);
        })();
    }, []);

    const translateNote = async (sessionId: string, soapNote: any) => {
        if (translations[sessionId]) return; // Already translated
        setTranslating(sessionId);

        const noteText = typeof soapNote === 'string'
            ? soapNote
            : `Subjective: ${soapNote.subjective || ''}\nObjective: ${soapNote.objective || ''}\nAssessment: ${soapNote.assessment || ''}\nPlan: ${soapNote.plan || ''}`;

        const res = await translateNoteToPlainLanguage(noteText);
        if (res.success && res.translation) {
            setTranslations(prev => ({ ...prev, [sessionId]: res.translation! }));
        }
        setTranslating(null);
    };

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2D6A4F15' }}>
                        <FileText size={20} style={{ color: '#2D6A4F' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        My Session Notes
                    </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    View your therapy session notes translated into easy-to-understand language.
                </p>
            </div>

            {loading && (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                </div>
            )}

            {!loading && sessions.length === 0 && (
                <div className="text-center py-16 rounded-3xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <FileText size={40} className="mx-auto mb-4" style={{ color: 'var(--color-border)' }} />
                    <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-text)' }}>No session notes yet</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        After your therapist completes a session, your notes will appear here.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {sessions.map(session => {
                    const isExpanded = expandedId === session.id;
                    const hasTranslation = !!translations[session.id];
                    const isTranslating = translating === session.id;

                    return (
                        <div
                            key={session.id}
                            className="rounded-2xl border overflow-hidden transition-all"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
                        >
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                                className="w-full text-left px-5 py-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                                        <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                                            Session — {new Date(session.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            {session.note_format?.toUpperCase() || 'SOAP'} Note
                                        </p>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
                            </button>

                            {isExpanded && (
                                <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    {/* Translate Button */}
                                    <button
                                        onClick={() => translateNote(session.id, session.soap_note)}
                                        disabled={isTranslating || hasTranslation}
                                        className="mt-4 mb-4 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all"
                                        style={{
                                            background: hasTranslation ? 'var(--color-primary-light)' : 'var(--color-primary)',
                                            color: hasTranslation ? 'var(--color-primary)' : 'white',
                                        }}
                                    >
                                        <Wand2 size={14} />
                                        {isTranslating ? 'Translating...' : hasTranslation ? '✓ Translated' : 'Translate to Plain Language'}
                                    </button>

                                    {/* Translation */}
                                    {hasTranslation && (
                                        <div className="rounded-2xl p-5 mb-4" style={{ background: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#2D6A4F' }}>
                                                📝 Your Notes (Plain Language)
                                            </p>
                                            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#1A1A1A' }}>
                                                {translations[session.id]}
                                            </div>
                                        </div>
                                    )}

                                    {/* Original Note Summary */}
                                    {session.soap_note && (
                                        <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg)' }}>
                                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                                Clinical Summary
                                            </p>
                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                {typeof session.soap_note === 'string'
                                                    ? session.soap_note.slice(0, 300) + '...'
                                                    : (session.soap_note.assessment || session.soap_note.subjective || 'No summary available').slice(0, 300)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
