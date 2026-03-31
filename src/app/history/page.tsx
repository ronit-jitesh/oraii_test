import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Calendar, Clock, User, Search } from 'lucide-react';

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
};

export default async function HistoryPage() {
    const supabase = await createClient();

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*, patients(name)')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-8 text-center" style={{ color: '#E53E3E' }}>
                Failed to load sessions: {(error instanceof Error ? error.message : String(error))}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {/* â”€â”€ Page Header â”€â”€ */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${C.border}`,
                }}
                className="px-6 pt-8 pb-14"
            >
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>Session History</h1>
                    <p className="text-sm mt-1 font-medium" style={{ color: C.textMuted }}>
                        Review past sessions, clinical notes, and transcripts
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-6">
                {sessions?.length === 0 ? (
                    <div
                        className="text-center py-16 rounded-2xl"
                        style={{ background: C.card, border: `1px dashed ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <FileText className="mx-auto mb-4" size={40} strokeWidth={1.5} style={{ color: C.textMuted }} />
                        <p className="font-semibold text-base" style={{ color: C.textPrimary }}>No sessions recorded yet</p>
                        <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                            Complete your first session to see it here
                        </p>
                        <Link
                            href="/doctor/dashboard"
                            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200"
                            style={{ background: C.primary }}
                        >
                            Start New Session
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3 pb-12">
                        {sessions?.map((session) => {
                            const date = new Date(session.created_at);
                            const soapNote = session.soap_note;
                            const snippet = session.transcript?.slice(0, 150) + '...';

                            return (
                                <Link
                                    key={session.id}
                                    href={`/history/${session.id}`}
                                    className="block rounded-2xl p-5 transition-all duration-300 group hover:shadow-md hover:border-[#B2DFDB]"
                                    style={{
                                        background: C.card,
                                        border: `1px solid ${C.border}`,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            {(session as any).patients?.name && (
                                                <p className="font-semibold text-sm mb-1.5 flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                                                    <User size={14} style={{ color: C.primary }} />
                                                    {(session as any).patients.name}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs mb-2" style={{ color: C.textMuted }}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {date.toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm line-clamp-2" style={{ color: C.textSecondary }}>{snippet}</p>
                                            {soapNote?.assessment && (
                                                <p className="mt-2 text-xs font-medium" style={{ color: C.primary }}>
                                                    Assessment: {soapNote.assessment.slice(0, 80)}...
                                                </p>
                                            )}
                                        </div>
                                        <FileText size={20} strokeWidth={1.5} style={{ color: C.textMuted }} className="shrink-0 mt-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
