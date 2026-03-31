import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle, AlertCircle, FileSearch } from 'lucide-react';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#38A169',
};

export default function ValidationPage() {
    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {/* Header */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${C.border}`,
                }}
                className="px-6 pt-8 pb-16"
            >
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/doctor/dashboard"
                            className="p-2 rounded-xl transition-all duration-200"
                            style={{ color: C.textMuted }}
                        >
                            <ArrowLeft size={20} strokeWidth={1.5} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>Clinical Validation</h1>
                            <p className="text-sm mt-1 font-medium" style={{ color: C.textMuted }}>Verify AI insights and documentation accuracy</p>
                        </div>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <CheckCircle size={16} strokeWidth={1.5} style={{ color: C.accent }} />
                            <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                Validated Today: <span className="font-bold" style={{ color: C.textPrimary }}>12</span>
                            </span>
                        </div>
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <AlertCircle size={16} strokeWidth={1.5} style={{ color: C.primary }} />
                            <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                Review Required: <span className="font-bold" style={{ color: C.textPrimary }}>0</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 -mt-8">
                <div
                    className="p-12 text-center rounded-2xl"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                    <FileSearch size={40} strokeWidth={1.5} style={{ color: C.textMuted }} className="mx-auto mb-4" />
                    <h2 className="font-semibold text-base mb-2" style={{ color: C.textPrimary }}>Document Review Engine</h2>
                    <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: C.textMuted }}>
                        Your AI-generated clinical notes are cross-referenced with DSM-5 guidelines and practice standards.
                        Validated documents appear in patient history once approved.
                    </p>
                    <div className="mt-8 flex justify-center gap-3">
                        <div className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest" style={{ background: C.primaryLight, color: C.primary }}>
                            HIPAA Verified
                        </div>
                        <div className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest" style={{ background: '#F0FFF4', color: '#276749' }}>
                            Encrypted Storage
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
