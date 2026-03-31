'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { bookAppointment, getPatientAppointments, cancelAppointment } from '../actions';

export default function BookPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        const res = await getPatientAppointments();
        if (res.success && res.appointments) setAppointments(res.appointments);
        setLoading(false);
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !time) return;
        setSaving(true);

        const requestedTime = new Date(`${date}T${time}`).toISOString();
        const res = await bookAppointment({ requestedTime, reason });

        if (res.success) {
            setSuccessMsg('Appointment request sent! Your therapist will confirm.');
            setShowForm(false);
            setDate('');
            setTime('');
            setReason('');
            await loadAppointments();
            setTimeout(() => setSuccessMsg(''), 4000);
        }
        setSaving(false);
    };

    const handleCancel = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
        if (!confirmed) return;
        await cancelAppointment(id);
        await loadAppointments();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: '#D8EDDF', color: '#2D6A4F', label: 'Confirmed' };
            case 'pending': return { bg: '#FEF3C7', color: '#92400E', label: 'Pending' };
            case 'cancelled': return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' };
            default: return { bg: '#F3F4F6', color: '#6B7280', label: status };
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0891B215' }}>
                            <Calendar size={20} style={{ color: '#0891B2' }} />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                            Book a Session
                        </h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Schedule a video therapy session with your provider.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-5 py-2.5 rounded-full text-sm font-bold text-white"
                    style={{ background: 'var(--color-primary)' }}
                >
                    {showForm ? 'Cancel' : '+ New Booking'}
                </button>
            </div>

            {/* Success */}
            {successMsg && (
                <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3" style={{ background: '#D8EDDF', border: '1px solid #B7DFC5' }}>
                    <CheckCircle2 size={18} style={{ color: '#2D6A4F' }} />
                    <span className="text-sm font-medium" style={{ color: '#2D6A4F' }}>{successMsg}</span>
                </div>
            )}

            {/* Booking Form */}
            {showForm && (
                <form onSubmit={handleBook} className="rounded-3xl p-6 border mb-8" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                    <h2 className="font-bold text-base mb-5" style={{ color: 'var(--color-text)' }}>Request an Appointment</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="w-full rounded-xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                                className="w-full rounded-xl text-sm"
                            />
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Reason (optional)</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Briefly describe what you'd like to discuss..."
                            rows={3}
                            className="w-full rounded-xl text-sm resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={saving || !date || !time}
                        className="px-6 py-3 rounded-full text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {saving ? 'Requesting...' : 'Request Appointment'}
                    </button>
                </form>
            )}

            {/* Appointments List */}
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                Your Appointments
            </h2>

            {loading && (
                <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                </div>
            )}

            {!loading && appointments.length === 0 && (
                <div className="text-center py-12 rounded-3xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <Calendar size={40} className="mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No appointments yet. Book your first session above.</p>
                </div>
            )}

            <div className="space-y-3">
                {appointments.map(appt => {
                    const status = getStatusStyle(appt.status);
                    const dateObj = new Date(appt.requested_time);
                    const isPast = dateObj < new Date();

                    return (
                        <div
                            key={appt.id}
                            className="rounded-2xl px-5 py-4 border flex items-center justify-between"
                            style={{
                                background: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                opacity: isPast ? 0.6 : 1,
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                                    <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                                        {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                                        {dateObj.getDate()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                                        {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        {appt.reason && (
                                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                · {appt.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                    style={{ background: status.bg, color: status.color }}
                                >
                                    {status.label}
                                </span>
                                {appt.status === 'pending' && !isPast && (
                                    <button
                                        onClick={() => handleCancel(appt.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Cancel"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
