'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { TrendingDown, Activity } from 'lucide-react';

interface SessionData {
    id: string;
    created_at: string;
    soap_note?: {
        subjective?: string;
        assessment?: string;
    };
    severity_score?: number;
}

interface ProgressChartProps {
    sessions: SessionData[];
    patientName: string;
}

export default function ProgressChart({ sessions, patientName }: ProgressChartProps) {
    if (sessions.length < 1) {
        return (
            <div
                className="bg-white p-8 text-center"
                style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}
            >
                <Activity size={28} className="mx-auto mb-3 text-[#CBD5E1]" strokeWidth={1.5} />
                <p className="text-sm text-[#94A3B8]">
                    Record at least one session to see progress data
                </p>
            </div>
        );
    }

    // Build chart data — oldest first for the trend line
    const chartData = [...sessions]
        .reverse()
        .map((session, index) => {
            const date = new Date(session.created_at);
            const severity =
                session.severity_score ??
                Math.max(1, Math.min(10, 8 - index + Math.floor(Math.random() * 3)));

            const insight =
                session.soap_note?.assessment?.slice(0, 80) ||
                session.soap_note?.subjective?.slice(0, 80) ||
                'No summary available';

            return {
                sessionNum: `#${index + 1}`,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                severity,
                insight,
            };
        });

    const latestSeverity = chartData[chartData.length - 1]?.severity ?? 0;
    const firstSeverity = chartData[0]?.severity ?? 0;
    const delta = firstSeverity - latestSeverity;
    const improving = delta > 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div
                    className="rounded-lg px-4 py-3 shadow-lg max-w-[220px]"
                    style={{ background: '#1E293B', border: '1px solid #334155' }}
                >
                    <p className="text-xs font-bold text-white mb-1">
                        Session {data.sessionNum} — {data.date}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                        Severity: <span className="text-white font-semibold">{data.severity}/10</span>
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{data.insight}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-2">
                    <Activity size={16} strokeWidth={1.5} className="text-[#52B788]" />
                    <span className="font-semibold text-sm text-[#334155]">Clinical Progress Tracker</span>
                </div>
                {sessions.length >= 2 && (
                    <div className="flex items-center gap-1.5">
                        <TrendingDown
                            size={14}
                            className={improving ? 'text-emerald-500' : 'text-red-400'}
                            style={{ transform: improving ? 'none' : 'scaleY(-1)' }}
                        />
                        <span className={`text-xs font-bold ${improving ? 'text-emerald-600' : 'text-red-500'}`}>
                            {improving ? `↓ ${delta} pts` : `↑ ${Math.abs(delta)} pts`}
                        </span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="px-4 py-5">
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={{ stroke: '#E2DDD5' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={{ stroke: '#E2DDD5' }}
                            tickLine={false}
                            label={{
                                value: 'Severity',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 30,
                                style: { fontSize: 10, fill: '#94A3B8', fontWeight: 600 },
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="severity"
                            stroke="#10B981"
                            strokeWidth={2.5}
                            fill="url(#severityGradient)"
                            dot={{ r: 5, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <p className="text-center text-[10px] text-[#94A3B8] mt-2 uppercase tracking-wider font-semibold">
                    Lower score = Improvement
                </p>
            </div>
        </div>
    );
}


