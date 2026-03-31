'use client';

import React from 'react';
import { DollarSign, Cpu, Mic, TrendingDown } from 'lucide-react';

export interface SessionCostData {
    asrCost: number;
    llmCost: number;
    totalCost: number;
    breakdown: string;
    model?: string;
    durationMinutes?: number;
}

interface CostTrackerProps {
    sessionCost?: SessionCostData;
    monthlySessions?: number; // For projection
}

export default function CostTracker({ sessionCost, monthlySessions = 80 }: CostTrackerProps) {
    if (!sessionCost) return null;

    const monthlyProjection = sessionCost.totalCost * monthlySessions;

    // Cost category colors
    const asrPercent = sessionCost.totalCost > 0
        ? Math.round((sessionCost.asrCost / sessionCost.totalCost) * 100)
        : 0;
    const llmPercent = 100 - asrPercent;

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white/80">Session Cost</span>
                </div>
                <span className="text-sm font-bold text-emerald-300">
                    ${sessionCost.totalCost.toFixed(4)}
                </span>
            </div>

            {/* Cost Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-cyan-400/60 transition-all duration-500"
                    style={{ width: `${asrPercent}%` }}
                    title={`ASR: $${sessionCost.asrCost.toFixed(4)}`}
                />
                <div
                    className="h-full bg-violet-400/60 transition-all duration-500"
                    style={{ width: `${llmPercent}%` }}
                    title={`LLM: $${sessionCost.llmCost.toFixed(4)}`}
                />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
                    <Mic size={10} />
                    <span>ASR: ${sessionCost.asrCost.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <div className="w-2 h-2 rounded-full bg-violet-400/60" />
                    <Cpu size={10} />
                    <span>LLM: ${sessionCost.llmCost.toFixed(4)} ({sessionCost.model || 'gpt-4o-mini'})</span>
                </div>
            </div>

            {/* Monthly Projection */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <TrendingDown size={10} />
                    <span>Monthly est. ({monthlySessions} sessions)</span>
                </div>
                <span className="text-[10px] font-bold text-white/50">
                    ${monthlyProjection.toFixed(2)}/mo
                </span>
            </div>

            {/* Strategic tip */}
            {sessionCost.model === 'gpt-4o-mini' && (
                <div className="text-[9px] text-emerald-400/50 flex items-center gap-1">
                    <TrendingDown size={8} />
                    Using GPT-4o Mini â€” 17Ã— cheaper than GPT-4o for note generation
                </div>
            )}
        </div>
    );
}
