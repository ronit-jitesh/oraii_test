import Link from 'next/link';
import { ArrowLeft, Settings, Shield, Bell, User, Lock } from 'lucide-react';

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

export default function SettingsPage() {
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
                            <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>Practice Settings</h1>
                            <p className="text-sm mt-1 font-medium" style={{ color: C.textMuted }}>Customize your clinical environment and profile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    {/* Security */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Lock size={18} style={{ color: C.primary }} />
                            <h2 className="font-semibold text-sm" style={{ color: C.textPrimary }}>Account Security</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>Two-Factor Authentication</span>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">Active</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>Change Password</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Edit</span>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Bell size={18} style={{ color: C.primary }} />
                            <h2 className="font-semibold text-sm" style={{ color: C.textPrimary }}>Practice Preferences</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>Email Notifications</span>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600">Daily Digest</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>Note Template</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">DAP Default</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

