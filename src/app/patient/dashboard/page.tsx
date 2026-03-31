'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    MessageCircle,
    Gamepad2,
    Compass,
    ClipboardCheck,
    FileText,
    Calendar,
    ShieldAlert,
    TrendingUp,
    ArrowRight,
    Flame,
    Sun,
    Cloud,
    CloudRain,
    Smile,
    Meh,
    Frown,
    Heart,
    Sparkles,
    Clock,
    Brain,
} from 'lucide-react';
import { getPatientProfile, saveMoodLog, getTodayMood } from '../actions';

const MOOD_EMOJIS = [
    { score: 1, label: 'Terrible', icon: Frown, color: '#C0392B' },
    { score: 2, label: 'Bad', icon: Frown, color: '#E74C3C' },
    { score: 3, label: 'Poor', icon: CloudRain, color: '#D4A017' },
    { score: 4, label: 'Low', icon: Cloud, color: '#F0A500' },
    { score: 5, label: 'Okay', icon: Meh, color: '#9CA3AF' },
    { score: 6, label: 'Fine', icon: Meh, color: '#52B788' },
    { score: 7, label: 'Good', icon: Smile, color: '#40916C' },
    { score: 8, label: 'Great', icon: Sun, color: '#2D6A4F' },
    { score: 9, label: 'Wonderful', icon: Heart, color: '#2D6A4F' },
    { score: 10, label: 'Amazing', icon: Sparkles, color: '#1B4D38' },
];

const FEATURES = [
    { href: '/patient/mind-os', label: 'MindOS', desc: 'Brainwave gamification', icon: Brain, color: '#5B21B6' },
    { href: '/patient/chat', label: 'ORAII Chat', desc: 'Talk to your AI companion', icon: MessageCircle, color: '#2563EB' },
    { href: '/patient/games', label: 'Get Distracted', desc: 'Breathing, art & games', icon: Gamepad2, color: '#7C3AED' },
    { href: '/patient/purpose', label: 'Finding Purpose', desc: 'Ikigai & values exploration', icon: Compass, color: '#059669' },
    { href: '/patient/screening', label: 'Screening', desc: 'PHQ-9, GAD-7 self-check', icon: ClipboardCheck, color: '#D97706' },
    { href: '/patient/notes', label: 'Session Notes', desc: 'Your notes in plain language', icon: FileText, color: '#2D6A4F' },
    { href: '/patient/book', label: 'Book Session', desc: 'Schedule a video call', icon: Calendar, color: '#0891B2' },
    { href: '/patient/emergency', label: 'Emergency', desc: 'Contacts & safety plan', icon: ShieldAlert, color: '#DC2626' },
    { href: '/patient/journey', label: 'My Journey', desc: 'Mood trends & progress', icon: TrendingUp, color: '#52B788' },
];

export default function PatientDashboardPage() {
    const [profile, setProfile] = useState<{
        user: { name: string; id: string };
        nextAppointment: any;
        moodStreak: number;
    } | null>(null);
    const [todayMood, setTodayMood] = useState<number | null>(null);
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [moodSaved, setMoodSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await getPatientProfile();
            if (res.success) setProfile(res as any);

            const moodRes = await getTodayMood();
            if (moodRes.success && moodRes.todayMood) {
                setTodayMood(moodRes.todayMood.mood_score);
                setMoodSaved(true);
            }
        })();
    }, []);

    const handleMoodSubmit = useCallback(async () => {
        if (!selectedMood) return;
        setSaving(true);
        const res = await saveMoodLog({ moodScore: selectedMood });
        if (res.success) {
            setTodayMood(selectedMood);
            setMoodSaved(true);
        }
        setSaving(false);
    }, [selectedMood]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const name = profile?.user?.name || 'there';

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            {/* Hero Greeting */}
            <div
                className="rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)',
                    boxShadow: '0 8px 32px rgba(45, 106, 79, 0.25)',
                }}
            >
                <div className="relative z-10">
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {greeting()}, {name}!
                    </h1>
                    <p className="text-white/80 text-lg mb-6">
                        {moodSaved
                            ? `You've checked in today. Keep it up! 🌿`
                            : `How are you feeling today? Take a moment to check in.`}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4">
                        {profile?.moodStreak && profile.moodStreak > 0 && (
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                                <Flame size={16} className="text-amber-300" />
                                <span className="text-white text-sm font-semibold">
                                    {profile.moodStreak}-day streak
                                </span>
                            </div>
                        )}
                        {profile?.nextAppointment && (
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                                <Clock size={16} className="text-blue-200" />
                                <span className="text-white text-sm font-semibold">
                                    Next: {new Date(profile.nextAppointment.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 blur-3xl" />
            </div>

            {/* Mood Check-in */}
            {!moodSaved && (
                <div
                    className="rounded-3xl p-6 md:p-8 mb-8 border"
                    style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        boxShadow: 'var(--shadow-card)',
                    }}
                >
                    <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        How are you feeling right now?
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {MOOD_EMOJIS.map(mood => {
                            const Icon = mood.icon;
                            const isSelected = selectedMood === mood.score;
                            return (
                                <button
                                    key={mood.score}
                                    onClick={() => setSelectedMood(mood.score)}
                                    className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all duration-200"
                                    style={{
                                        background: isSelected ? `${mood.color}15` : 'transparent',
                                        border: isSelected ? `2px solid ${mood.color}` : '2px solid transparent',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                    title={mood.label}
                                >
                                    <Icon size={22} style={{ color: mood.color }} />
                                    <span className="text-[10px] font-semibold" style={{ color: isSelected ? mood.color : '#9CA3AF' }}>
                                        {mood.score}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedMood && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                {MOOD_EMOJIS.find(m => m.score === selectedMood)?.label}
                            </span>
                            <button
                                onClick={handleMoodSubmit}
                                disabled={saving}
                                className="px-6 py-2 rounded-full text-sm font-bold text-white transition-all"
                                style={{
                                    background: 'var(--color-primary)',
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : 'Check In'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mood saved confirmation */}
            {moodSaved && todayMood && (
                <div
                    className="rounded-3xl p-5 mb-8 border flex items-center gap-4"
                    style={{
                        background: 'var(--color-primary-light)',
                        borderColor: '#B7DFC5',
                    }}
                >
                    {React.createElement(MOOD_EMOJIS.find(m => m.score === todayMood)?.icon || Smile, {
                        size: 28,
                        style: { color: 'var(--color-primary)' },
                    })}
                    <div>
                        <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                            Today's check-in: {MOOD_EMOJIS.find(m => m.score === todayMood)?.label} ({todayMood}/10)
                        </span>
                        <p className="text-xs" style={{ color: '#40916C' }}>
                            Great job checking in! Consistency builds awareness. 🌿
                        </p>
                    </div>
                </div>
            )}

            {/* Feature Grid */}
            <h2
                className="text-lg font-bold mb-5"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}
            >
                Your Wellness Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {FEATURES.map(feature => {
                    const Icon = feature.icon;
                    return (
                        <Link
                            key={feature.href}
                            href={feature.href}
                            className="group rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                style={{ background: `${feature.color}12` }}
                            >
                                <Icon size={20} style={{ color: feature.color }} />
                            </div>
                            <h3 className="font-bold text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>
                                {feature.label}
                            </h3>
                            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                {feature.desc}
                            </p>
                            <div className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: feature.color }}>
                                <span>Open</span>
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
