import Link from 'next/link';
import { ArrowLeft, DollarSign, Receipt, TrendingUp, CreditCard, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { getAllSuperbills, getDashboardStats } from '@/app/actions';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#52B788',
    accentLight: '#D8EDDF',
    warning: '#D4A017',
    warningLight: '#FDF6E3',
    danger: '#C0392B',
    dangerLight: '#FEF2F2',
};

export default async function BillingPage() {
    const [superbillsResult, statsResult] = await Promise.all([
        getAllSuperbills(),
        getDashboardStats()
    ]);

    const superbills = superbillsResult.success ? superbillsResult.superbills || [] : [];
    const stats = statsResult.success ? statsResult : { totalPatients: 0, sessionsToday: 0, pendingSuperbills: 0 };

    // Calculate Paid Revenue
    const totalRevenue = superbills
        .filter(s => s.status === 'paid')
        .reduce((sum, s) => sum + (Number(s.total_fee) || 0), 0);

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
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/doctor/dashboard"
                            className="p-2 rounded-xl transition-all duration-200 hover:bg-white/50"
                            style={{ color: C.textMuted }}
                        >
                            <ArrowLeft size={20} strokeWidth={1.5} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>Billing & Superbills</h1>
                            <p className="text-sm mt-1 font-medium" style={{ color: C.textMuted }}>Financial automation and claim management</p>
                        </div>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <div
                            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.accentLight }}>
                                <DollarSign size={20} strokeWidth={1.5} style={{ color: C.accent }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Total Revenue (Paid)</p>
                                <p className="text-xl font-bold" style={{ color: C.textPrimary }}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div
                            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.primaryLight }}>
                                <Receipt size={20} strokeWidth={1.5} style={{ color: C.primary }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Pending Claims</p>
                                <p className="text-xl font-bold" style={{ color: C.textPrimary }}>{stats.pendingSuperbills}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 -mt-8">
                <div className="grid grid-cols-1 gap-6 pb-12">

                    {/* Superbill List */}
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="font-semibold text-sm" style={{ color: C.textPrimary }}>Recent Transactions</h2>
                            <button className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>Export CSV</button>
                        </div>

                        <div className="overflow-x-auto">
                            {superbills.length === 0 ? (
                                <div className="p-20 text-center">
                                    <Clock size={40} style={{ color: C.textMuted }} className="mx-auto mb-4" strokeWidth={1} />
                                    <p className="text-sm font-medium" style={{ color: C.textSecondary }}>No billing records found</p>
                                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>Superbills are automatically generated after clinical sessions.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: C.bg }}>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Patient</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Date</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Service</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Status</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: C.textMuted }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {superbills.map((bill) => {
                                            const statusConfig = getStatusStyle(bill.status);
                                            return (
                                                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: C.primaryLight, color: C.primary }}>
                                                                {bill.patients?.name?.[0] || 'P'}
                                                            </div>
                                                            <span className="text-sm font-semibold" style={{ color: C.textPrimary }}>{bill.patients?.name || 'Unknown Patient'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-medium" style={{ color: C.textSecondary }}>
                                                            {new Date(bill.service_date).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {(bill.cpt_codes || []).map((c: any, i: number) => (
                                                                <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-500">
                                                                    {c.code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                                                            style={{ background: statusConfig.bg, color: statusConfig.text }}
                                                        >
                                                            {bill.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold" style={{ color: C.textPrimary }}>
                                                            ${(Number(bill.total_fee) || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl flex items-start gap-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                            <TrendingUp className="mt-1" size={20} style={{ color: C.primary }} />
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: C.textPrimary }}>Revenue Optimization</h3>
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: C.textMuted }}>Your average claim value is projected to increase by 12% with AI-assisted CPT coding verification.</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl flex items-start gap-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                            <CreditCard className="mt-1" size={20} style={{ color: C.primary }} />
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: C.textPrimary }}>Payout Schedule</h3>
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: C.textMuted }}>Net-30 processing is active. Your next automated deposit will be triggered when balance exceeds $500.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusStyle(status: string) {
    switch (status.toLowerCase()) {
        case 'paid':
            return { bg: '#D8EDDF', text: '#2D6A4F' };
        case 'finalized':
        case 'ready_for_payer':
            return { bg: '#F0EDE6', text: '#2D6A4F' };
        case 'draft':
            return { bg: '#FFFFFF', text: '#6B7280' };
        case 'denied':
            return { bg: '#FEF2F2', text: '#C0392B' };
        default:
            return { bg: '#FDF6E3', text: '#D4A017' };
    }
}

