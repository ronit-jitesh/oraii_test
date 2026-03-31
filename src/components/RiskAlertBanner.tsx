'use client';

import React, { useState } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    AlertCircle,
    X,
    ChevronDown,
    ChevronUp,
    Phone,
} from 'lucide-react';
import {
    RiskAlert,
    RiskLevel,
    getRiskLevelColor,
    getCSSRSColor,
    CRISIS_RESOURCES,
    getHighestCSSRSLevel,
} from '@/lib/riskDetection';

interface RiskAlertBannerProps {
    alerts: RiskAlert[];
    onDismiss: (alertId: string) => void;
}

export default function RiskAlertBanner({ alerts, onDismiss }: RiskAlertBannerProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showCrisisResources, setShowCrisisResources] = useState(false);

    const activeAlerts = alerts.filter((a) => !a.dismissed);
    if (activeAlerts.length === 0) return null;

    // Show highest-severity alert first
    const sorted = [...activeAlerts].sort((a, b) => {
        const order: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2 };
        return order[a.level] - order[b.level];
    });

    const highestCSSRS = getHighestCSSRSLevel(activeAlerts);

    const LevelIcon = ({ level }: { level: RiskLevel }) => {
        switch (level) {
            case 'CRITICAL': return <ShieldAlert size={18} />;
            case 'HIGH': return <AlertTriangle size={18} />;
            case 'MODERATE': return <AlertCircle size={18} />;
        }
    };

    return (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            {/* ── C-SSRS Summary Bar ── */}
            {highestCSSRS > 0 && (
                <div
                    className="flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold"
                    style={{
                        background: getCSSRSColor(highestCSSRS) + '15',
                        border: `1.5px solid ${getCSSRSColor(highestCSSRS)}40`,
                        color: getCSSRSColor(highestCSSRS),
                    }}
                >
                    <span>C-SSRS Level {highestCSSRS}: {sorted[0]?.cssrsLabel || ''}</span>
                    <button
                        onClick={() => setShowCrisisResources(!showCrisisResources)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-black/5"
                    >
                        <Phone size={12} />
                        Crisis Resources
                        {showCrisisResources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>
            )}

            {/* ── Crisis Resources Panel (India-first) ── */}
            {showCrisisResources && (
                <div
                    className="rounded-xl px-4 py-3 animate-in slide-in-from-top-1 duration-200"
                    style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5' }}
                >
                    <p className="text-xs font-bold text-red-800 mb-2">🇮🇳 India Crisis Helplines</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {CRISIS_RESOURCES.filter(r => r.region === 'India').map((r) => (
                            <div key={r.name} className="flex items-center gap-2 text-xs text-red-700">
                                <Phone size={10} className="shrink-0" />
                                <span><strong>{r.name}</strong>: {r.contact}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs font-bold text-red-800 mb-2">ðŸŒ International</p>
                    <div className="grid grid-cols-2 gap-2">
                        {CRISIS_RESOURCES.filter(r => r.region !== 'India').map((r) => (
                            <div key={r.name} className="flex items-center gap-2 text-xs text-red-700">
                                <Phone size={10} className="shrink-0" />
                                <span><strong>{r.name}</strong> ({r.region}): {r.contact}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sorted.map((alert) => {
                const colors = getRiskLevelColor(alert.level);
                const isExpanded = expandedId === alert.id;
                const isCritical = alert.level === 'CRITICAL';

                return (
                    <div
                        key={alert.id}
                        className="rounded-xl overflow-hidden transition-all"
                        style={{
                            background: colors.bg,
                            border: `2px solid ${colors.border}`,
                            boxShadow: isCritical ? `0 0 0 1px ${colors.border}, 0 4px 12px rgba(220, 38, 38, 0.15)` : undefined,
                        }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-start gap-3 px-4 py-3">
                            <div
                                className="p-1.5 rounded-lg mt-0.5 shrink-0"
                                style={{ background: colors.badge + '20', color: colors.badge }}
                            >
                                <LevelIcon level={alert.level} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{ background: colors.badge + '20', color: colors.badge }}
                                    >
                                        {alert.level}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: colors.text }}>
                                        {alert.category}
                                    </span>
                                    {/* HuggingFace Classifier Results */}
                                    {(alert as any).hfSuicidalityFlag && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                           🤗 HF: Suicidality Detected
                                        </span>
                                    )}
                                    {(alert as any).hfValidationWarning && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                            {(alert as any).hfValidationWarning}
                                        </span>
                                    )}
                                    {/* C-SSRS Badge */}
                                    {alert.cssrsLevel > 0 && (
                                        <span
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{
                                                background: getCSSRSColor(alert.cssrsLevel) + '20',
                                                color: getCSSRSColor(alert.cssrsLevel),
                                            }}
                                        >
                                            C-SSRS {alert.cssrsLevel}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: colors.text + 'CC' }}>
                                    Detected: <em>&quot;...{alert.matchedPhrase}...&quot;</em>
                                </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                    style={{ color: colors.text }}
                                    title={isExpanded ? 'Collapse protocol' : 'View safety protocol'}
                                >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {!isCritical && (
                                    <button
                                        onClick={() => onDismiss(alert.id)}
                                        className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                        style={{ color: colors.text + '80' }}
                                        title="Dismiss alert"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Expanded Protocol ── */}
                        {isExpanded && (
                            <div
                                className="px-4 pb-4 pt-1 animate-in slide-in-from-top-1 duration-200"
                                style={{ borderTop: `1px solid ${colors.border}` }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone size={12} style={{ color: colors.badge }} />
                                    <span className="text-xs font-bold" style={{ color: colors.text }}>
                                        {alert.protocol.name}
                                    </span>
                                </div>
                                <ol className="space-y-1.5">
                                    {alert.protocol.steps.map((step, i) => (
                                        <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: colors.text + 'DD' }}>
                                            <span className="font-bold shrink-0" style={{ color: colors.badge }}>
                                                {i + 1}.
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>

                                {isCritical && (
                                    <div
                                        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                        style={{ background: colors.badge + '15', color: colors.badge }}
                                    >
                                        <Phone size={14} />
                                        🇮🇳 Vandrevala: 1860-2662-345 | Kiran: 1800-599-0019 • 🇺🇸 988 Lifeline
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
