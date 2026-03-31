'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, BarChart3, Calendar, Target, Flame } from 'lucide-react';
import { getJourneyData, getMoodHistory } from '../actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function JourneyPage() {
    const [data, setData] = useState<{
        moods: any[];
        screenings: any[];
        sessionCount: number;
        purposeCount: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await getJourneyData();
            if (res.success) {
                setData({
                    moods: res.moods || [],
                    screenings: res.screenings || [],
                    sessionCount: res.sessionCount || 0,
                    purposeCount: res.purposeCount || 0,
                });
            }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
            </div>
        );
    }

    const moodChartData = (data?.moods || []).map(m => ({
        date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: m.mood_score,
    }));

    const screeningChartData = (data?.screenings || []).map(s => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: s.total_score,
        instrument: s.instrument,
        severity: s.severity_label,
    }));

    const avgMood = moodChartData.length > 0
        ? (moodChartData.reduce((sum, d) => sum + d.mood, 0) / moodChartData.length).toFixed(1)
        : '-';

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#52B78815' }}>
                        <TrendingUp size={20} style={{ color: '#52B788' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        My Journey
                    </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Track your mental health trends and celebrate your progress.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Avg Mood', value: avgMood, icon: Activity, color: '#2D6A4F', suffix: '/10' },
                    { label: 'Check-ins', value: data?.moods.length || 0, icon: Flame, color: '#D97706', suffix: '' },
                    { label: 'Sessions', value: data?.sessionCount || 0, icon: Calendar, color: '#0891B2', suffix: '' },
                    { label: 'Reflections', value: data?.purposeCount || 0, icon: Target, color: '#7C3AED', suffix: '' },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl p-5 border"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
                        >
                            <Icon size={18} style={{ color: stat.color }} className="mb-2" />
                            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                                {stat.value}{stat.suffix}
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Mood Trend Chart */}
            <div className="rounded-3xl p-6 border mb-8" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <h2 className="font-bold text-base mb-1" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Mood Trend
                </h2>
                <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>Last 30 days</p>

                {moodChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={moodChartData}>
                            <defs>
                                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E2DDD5',
                                    borderRadius: 12,
                                    fontSize: 12,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="mood"
                                stroke="#2D6A4F"
                                strokeWidth={2.5}
                                fill="url(#moodGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-48 flex items-center justify-center rounded-2xl" style={{ background: 'var(--color-bg)' }}>
                        <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                            Log your mood for at least 2 days to see your trend chart.
                        </p>
                    </div>
                )}
            </div>

            {/* Screening History Chart */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                <h2 className="font-bold text-base mb-1" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Assessment Scores
                </h2>
                <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>PHQ-9 and GAD-7 trends over time</p>

                {screeningChartData.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={screeningChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#FFFFFF',
                                        border: '1px solid #E2DDD5',
                                        borderRadius: 12,
                                        fontSize: 12,
                                    }}
                                    formatter={(value: any, name: string) => [value, 'Score']}
                                    labelFormatter={(label: string) => `Date: ${label}`}
                                />
                                <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: '#7C3AED' }} />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Results list */}
                        <div className="mt-4 space-y-2">
                            {screeningChartData.map((s, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                                    <div className="flex items-center gap-3">
                                        <BarChart3 size={14} style={{ color: '#7C3AED' }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                            {s.instrument} · {s.date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{s.score}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                                            {s.severity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-48 flex items-center justify-center rounded-2xl" style={{ background: 'var(--color-bg)' }}>
                        <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                            Complete a screening assessment to see your score history.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
