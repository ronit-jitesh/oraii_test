import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Activity, Pill, Stethoscope, TestTube, FileText, MessageSquare } from 'lucide-react';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    borderSubtle: '#F0EDE6',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    danger: '#E53E3E',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
                <div className="text-center">
                    <p className="font-semibold" style={{ color: C.danger }}>Session not found</p>
                    <Link href="/history" className="text-sm font-medium mt-3 inline-block" style={{ color: C.primary }}>
                        ← Back to History
                    </Link>
                </div>
            </div>
        );
    }

    const date = new Date(session.created_at);
    const soapNote = session.soap_note;
    const entities = session.entities;
    const roleAnalysis = session.role_analysis;
    const noteFormat = session.note_format || 'soap';

    const FORMAT_FIELDS: Record<string, { fields: string[]; title: string }> = {
        soap: { fields: ['subjective', 'objective', 'assessment', 'plan'], title: 'SOAP Note' },
        dap: { fields: ['data', 'assessment', 'plan'], title: 'Clinical DAP Note' },
        girp: { fields: ['goals', 'interventions', 'response', 'plan'], title: 'Clinical GIRP Note' },
    };

    const config = FORMAT_FIELDS[noteFormat as keyof typeof FORMAT_FIELDS] || FORMAT_FIELDS.soap;

    /* Entity color palette */
    const entityStyles: Record<string, { bg: string; text: string; label: string }> = {
        symptoms: { bg: '#FFF5F5', text: '#C53030', label: 'Symptoms' },
        medications: { bg: '#EBF8FF', text: '#2B6CB0', label: 'Medications' },
        diagnoses: { bg: '#FAF5FF', text: '#6B46C1', label: 'Diagnoses' },
        testsOrdered: { bg: '#FFFAF0', text: '#C05621', label: 'Tests Ordered' },
    };

    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {/* ── Header ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${C.border}`,
                }}
                className="px-6 pt-6 pb-6"
            >
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/history"
                            className="p-2 rounded-xl transition-all duration-200 text-[#8B99AB] hover:bg-white hover:shadow-sm"
                        >
                            <ArrowLeft size={20} strokeWidth={1.5} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: C.textPrimary }}>Session Details</h1>
                            <p className="text-sm flex items-center gap-2 mt-0.5" style={{ color: C.textMuted }}>
                                <Calendar size={13} strokeWidth={1.5} />
                                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">
                {/* Role Analysis */}
                {roleAnalysis && (
                    <div
                        className="p-5 rounded-2xl"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: C.textMuted }}>
                            <User size={14} strokeWidth={1.5} /> Identified Roles
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#EBF8FF', color: '#2B6CB0' }}>
                                Speaker 0: {roleAnalysis.speaker0Role}
                            </span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: C.primaryLight, color: C.primary }}>
                                Speaker 1: {roleAnalysis.speaker1Role}
                            </span>
                        </div>
                    </div>
                )}

                {/* Entities */}
                {entities && (
                    <div
                        className="p-5 rounded-2xl"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.textMuted }}>
                            <Activity size={14} strokeWidth={1.5} /> Clinical Entities
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                            {Object.entries(entityStyles).map(([key, style]) => (
                                <div key={key}>
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: style.text }}>
                                        {style.label}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(entities as any)[key]?.length > 0 ? (entities as any)[key].map((item: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: style.bg, color: style.text }}
                                            >
                                                {item}
                                            </span>
                                        )) : (
                                            <span className="text-xs" style={{ color: C.textMuted }}>None</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Clinical Note */}
                {soapNote && (
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div
                            className="px-5 py-3.5 flex items-center gap-2"
                            style={{ background: C.bg, borderBottom: `1px solid ${C.borderSubtle}` }}
                        >
                            <FileText size={15} strokeWidth={1.5} style={{ color: C.primary }} />
                            <h3 className="font-semibold text-sm" style={{ color: C.textPrimary }}>{config.title}</h3>
                        </div>
                        <div className="p-5 space-y-5">
                            {config.fields.map((section) => (
                                <div key={section}>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                                        {section}
                                    </label>
                                    <p className="mt-1.5 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSecondary }}>
                                        {soapNote[section] || 'None reported'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transcript */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                    <div
                        className="px-5 py-3.5 flex items-center gap-2"
                        style={{ background: C.bg, borderBottom: `1px solid ${C.borderSubtle}` }}
                    >
                        <MessageSquare size={15} strokeWidth={1.5} style={{ color: C.primary }} />
                        <h3 className="font-semibold text-sm" style={{ color: C.textPrimary }}>Full Transcript</h3>
                    </div>
                    <div className="p-5 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSecondary, fontFamily: 'inherit' }}>
                            {session.transcript}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
