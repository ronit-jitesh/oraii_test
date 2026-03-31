'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Mic,
    Plus,
    Loader2,
    CalendarPlus,
    X,
} from 'lucide-react';
import { updateAppointmentStatus, createAppointment } from '@/app/actions';
import { useRouter } from 'next/navigation';

/* ── Design Tokens ── */
const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    borderSubtle: '#F1F4F7', // Kept as it was not explicitly removed
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#38A169',
    accentLight: '#F0FFF4',
    warning: '#D69E2E',
    warningLight: '#FFFAF0',
    warningBorder: '#FEEBC8',
    danger: '#E53E3E',
    dangerLight: '#FFF5F5',
};

interface Appointment {
    id: string;
    patient_name: string;
    patient_id?: string;
    requested_time: string;
    reason?: string;
    status: string;
}

interface AppointmentsClientProps {
    initialAppointments: Appointment[];
}

export default function AppointmentsClient({ initialAppointments }: AppointmentsClientProps) {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [isPending, startTransition] = useTransition();
    const [showNewForm, setShowNewForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formReason, setFormReason] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const pending = appointments.filter((a) => a.status === 'pending');
    const confirmed = appointments.filter((a) => a.status === 'confirmed');

    const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const handleAccept = (id: string) => {
        startTransition(async () => {
            const result = await updateAppointmentStatus(id, 'confirmed');
            if (result.success) {
                setAppointments(appointments.map((a) =>
                    a.id === id ? { ...a, status: 'confirmed' } : a
                ));
            }
        });
    };

    const handleCancel = (id: string) => {
        startTransition(async () => {
            const result = await updateAppointmentStatus(id, 'cancelled');
            if (result.success) {
                setAppointments(appointments.filter((a) => a.id !== id));
            }
        });
    };

    const handleCreateAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        startTransition(async () => {
            const result = await createAppointment({
                patientName: formName,
                requestedTime: new Date(formTime).toISOString(),
                reason: formReason,
            });
            if (result.success && result.appointment) {
                setAppointments([...appointments, result.appointment]);
                setFormName('');
                setFormTime('');
                setFormReason('');
                setShowNewForm(false);
            } else {
                setFormError(result.error || 'Failed to create appointment');
            }
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {/* ── Page Header ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${C.border}`,
                }}
                className="px-6 pt-8 pb-16"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>
                                Appointment Inbox
                            </h1>
                            <p className="text-sm mt-1 font-medium" style={{ color: C.textMuted }}>
                                Manage patient requests and upcoming schedule
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewForm(!showNewForm)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: C.primary,
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(44,122,123,0.2)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(44,122,123,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,122,123,0.2)'}
                        >
                            {showNewForm ? <X size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
                            {showNewForm ? 'Close' : 'New Appointment'}
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4 mt-5 flex-wrap">
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <AlertCircle size={16} style={{ color: C.warning }} />
                            <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                <span className="font-bold" style={{ color: C.textPrimary }}>{pending.length}</span> Pending
                            </span>
                        </div>
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-xl"
                            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        >
                            <CheckCircle2 size={16} style={{ color: C.accent }} />
                            <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                <span className="font-bold" style={{ color: C.textPrimary }}>{confirmed.length}</span> Confirmed
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-6xl mx-auto px-6 -mt-8">
                {/* New Appointment Form */}
                {showNewForm && (
                    <div
                        className="mb-6 p-6 overflow-hidden"
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <CalendarPlus size={16} strokeWidth={1.5} style={{ color: C.primary }} />
                            <span className="font-semibold text-sm" style={{ color: C.textPrimary }}>Schedule New Appointment</span>
                        </div>
                        {formError && (
                            <div
                                className="rounded-xl p-3 text-sm font-medium mb-4"
                                style={{ background: C.dangerLight, border: '1px solid #FED7D7', color: C.danger }}
                            >
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-1.5" style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Patient Name *
                                </label>
                                <input required type="text" placeholder="Full name" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                            </div>
                            <div>
                                <label className="block mb-1.5" style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Date & Time *
                                </label>
                                <input required type="datetime-local" value={formTime} onChange={(e) => setFormTime(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                            </div>
                            <div>
                                <label className="block mb-1.5" style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Reason
                                </label>
                                <input type="text" placeholder="Reason for visit" value={formReason} onChange={(e) => setFormReason(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                            </div>
                            <div className="sm:col-span-3 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowNewForm(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200"
                                    style={{ color: C.textMuted }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || !formName || !formTime}
                                    className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-40"
                                    style={{ background: C.primary }}
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                    {/* ── New Requests ── */}
                    <div
                        className="overflow-hidden"
                        style={{ background: C.card, border: `1px solid ${C.warningBorder}`, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div
                            className="px-5 py-4 flex items-center justify-between"
                            style={{ borderBottom: `1px solid ${C.warningBorder}`, background: C.warningLight }}
                        >
                            <div className="flex items-center gap-2.5">
                                <AlertCircle size={16} strokeWidth={1.5} style={{ color: C.warning }} />
                                <span className="font-semibold text-sm" style={{ color: '#744210' }}>New Requests</span>
                            </div>
                            <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ color: '#975A16', background: '#FEFCBF' }}
                            >
                                {pending.length} pending
                            </span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {pending.length === 0 ? (
                                <div className="py-12 px-6 text-center">
                                    <CheckCircle2 size={28} className="mx-auto mb-3" strokeWidth={1.5} style={{ color: C.accent }} />
                                    <p className="text-sm font-medium" style={{ color: C.textMuted }}>All caught up!</p>
                                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>No pending requests</p>
                                </div>
                            ) : (
                                pending.map((appt) => (
                                    <div
                                        key={appt.id}
                                        className="p-4 transition-all duration-200"
                                        style={{ borderBottom: `1px solid ${C.warningBorder}` }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = C.warningLight}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <User size={14} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                                    <span className="font-semibold text-sm" style={{ color: C.textPrimary }}>{appt.patient_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock size={12} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                                    <span className="text-xs" style={{ color: C.textSecondary }}>
                                                        {formatDate(appt.requested_time)} at {formatTime(appt.requested_time)}
                                                    </span>
                                                </div>
                                                {appt.reason && (
                                                    <p className="text-xs mt-1 italic" style={{ color: C.textMuted }}>&ldquo;{appt.reason}&rdquo;</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAccept(appt.id)}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-40"
                                                    style={{ background: C.accent }}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(appt.id)}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40"
                                                    style={{ color: C.danger, background: C.dangerLight, border: '1px solid #FED7D7' }}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Upcoming Schedule ── */}
                    <div
                        className="overflow-hidden"
                        style={{ background: C.card, border: `1px solid #C6F6D5`, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div
                            className="px-5 py-4 flex items-center justify-between"
                            style={{ borderBottom: '1px solid #C6F6D5', background: C.accentLight }}
                        >
                            <div className="flex items-center gap-2.5">
                                <Calendar size={16} strokeWidth={1.5} style={{ color: C.accent }} />
                                <span className="font-semibold text-sm" style={{ color: '#22543D' }}>Upcoming Schedule</span>
                            </div>
                            <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ color: '#276749', background: '#C6F6D5' }}
                            >
                                {confirmed.length} confirmed
                            </span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {confirmed.length === 0 ? (
                                <div className="py-12 px-6 text-center">
                                    <Calendar size={28} className="mx-auto mb-3" strokeWidth={1.5} style={{ color: C.textMuted }} />
                                    <p className="text-sm font-medium" style={{ color: C.textMuted }}>No confirmed appointments</p>
                                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>Accept requests to see them here</p>
                                </div>
                            ) : (
                                confirmed.map((appt) => {
                                    const todayAppt = isToday(appt.requested_time);
                                    return (
                                        <div
                                            key={appt.id}
                                            className="p-4 transition-all duration-200"
                                            style={{ borderBottom: '1px solid #C6F6D5' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = C.accentLight}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <User size={14} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                                        <span className="font-semibold text-sm" style={{ color: C.textPrimary }}>{appt.patient_name}</span>
                                                        {todayAppt && (
                                                            <span
                                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                                style={{ color: '#276749', background: '#C6F6D5' }}
                                                            >
                                                                Today
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock size={12} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                                        <span className="text-xs" style={{ color: C.textSecondary }}>
                                                            {formatDate(appt.requested_time)} at {formatTime(appt.requested_time)}
                                                        </span>
                                                    </div>
                                                    {appt.reason && (
                                                        <p className="text-xs mt-1 italic" style={{ color: C.textMuted }}>&ldquo;{appt.reason}&rdquo;</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {todayAppt && appt.patient_id && (
                                                        <Link
                                                            href={`/session/${appt.patient_id}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200"
                                                            style={{ background: C.primary }}
                                                        >
                                                            <Mic size={12} />
                                                            Start Session
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancel(appt.id)}
                                                        disabled={isPending}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40"
                                                        style={{ color: C.textMuted, background: C.bg, border: `1px solid ${C.border}` }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


