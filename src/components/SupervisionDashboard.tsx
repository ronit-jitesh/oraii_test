'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Award, MessageSquare, HelpCircle, Heart, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { SupervisionAnalysis, MicroSkillMetrics } from '@/lib/microSkillsAnalyzer';

interface SupervisionDashboardProps {
  analysis: SupervisionAnalysis;
}

type Rating = 'excellent' | 'good' | 'needs_improvement' | 'concern';

const RATING_CONFIG: Record<Rating, { color: string; bg: string; border: string; label: string }> = {
  excellent: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent' },
  good: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Good' },
  needs_improvement: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Needs Work' },
  concern: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Concern' },
};

function MetricGauge({ value, max, label, rating, benchmark, icon }: {
  value: number; max: number; label: string; rating: Rating; benchmark: string; icon: React.ReactNode;
}) {
  const config = RATING_CONFIG[rating];
  const percent = Math.min(100, (value / max) * 100);

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={config.color}>{icon}</span>
          <span className="text-xs font-bold text-[#1A1A1A]">{label}</span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
          {config.label}
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            rating === 'excellent' ? 'bg-emerald-500' :
            rating === 'good' ? 'bg-blue-500' :
            rating === 'needs_improvement' ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${config.color}`}>{value}{max === 100 ? '%' : `/${max}`}</span>
        <span className="text-[9px] text-[#9CA3AF]">{benchmark}</span>
      </div>
    </div>
  );
}

function FidelityRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#059669' : score >= 50 ? '#2563EB' : score >= 30 ? '#D97706' : '#DC2626';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] text-[#9CA3AF] uppercase tracking-wider font-bold">MI Score</span>
      </div>
    </div>
  );
}

export default function SupervisionDashboard({ analysis }: SupervisionDashboardProps) {
  const [expanded, setExpanded] = useState(false);
  const { metrics, summary } = analysis;

  return (
    <div className="rounded-xl border-2 border-violet-200 bg-violet-50/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 border-b border-violet-200 hover:bg-violet-50 transition-colors cursor-pointer"
      >
        <div className="p-1.5 rounded-lg bg-violet-100">
          <BarChart3 size={18} className="text-violet-700" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-bold text-[#1A1A1A]">
            AI Supervision Dashboard
          </span>
          <p className="text-[10px] text-[#6B7280]">
            Post-session analysis • MI Fidelity Score: {metrics.miFidelityScore.overall}/100
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            metrics.miFidelityScore.overall >= 70 ? 'bg-emerald-100 text-emerald-700' :
            metrics.miFidelityScore.overall >= 50 ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {metrics.miFidelityScore.overall >= 70 ? 'Strong' :
             metrics.miFidelityScore.overall >= 50 ? 'Adequate' : 'Developing'}
          </span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Top Row: Fidelity Ring + Summary */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <FidelityRing score={metrics.miFidelityScore.overall} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-[#374151] leading-relaxed">{summary.overallAssessment}</p>
              {/* Passing / Failing benchmarks */}
              <div className="flex flex-wrap gap-1.5">
                {metrics.miFidelityScore.passingBenchmarks.map((b, i) => (
                  <span key={i} className="text-[9px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp size={8} /> {b}
                  </span>
                ))}
                {metrics.miFidelityScore.failingBenchmarks.map((b, i) => (
                  <span key={i} className="text-[9px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingDown size={8} /> {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricGauge
              value={metrics.talkToListenRatio.clientPercentage}
              max={100}
              label="Client Speech"
              rating={metrics.talkToListenRatio.rating}
              benchmark="Target: 60-70%"
              icon={<MessageSquare size={14} />}
            />
            <MetricGauge
              value={metrics.openEndedQuestions.percentage}
              max={10}
              label="Open Questions"
              rating={metrics.openEndedQuestions.rating}
              benchmark="Target: ~3.3%"
              icon={<HelpCircle size={14} />}
            />
            <MetricGauge
              value={metrics.reflections.percentage}
              max={25}
              label="Reflections"
              rating={metrics.reflections.rating}
              benchmark="Target: ~12.9%"
              icon={<Heart size={14} />}
            />
            <MetricGauge
              value={metrics.empathyScore.score}
              max={5}
              label="Empathy"
              rating={metrics.empathyScore.rating}
              benchmark="Target: 3.8/5"
              icon={<Award size={14} />}
            />
          </div>

          {/* Detailed Stats */}
          <div className="bg-white/60 rounded-lg p-3 border border-violet-100">
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Session Details</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.reflections.count}</p>
                <p className="text-[9px] text-[#9CA3AF]">Reflections</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.reflections.complexReflections}</p>
                <p className="text-[9px] text-[#9CA3AF]">Complex</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.openEndedQuestions.count}/{metrics.openEndedQuestions.totalQuestions}</p>
                <p className="text-[9px] text-[#9CA3AF]">Open/Total Q</p>
              </div>
            </div>
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-2 gap-2">
            {summary.strengths.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <TrendingUp size={10} /> Strengths
                </p>
                <ul className="space-y-1">
                  {summary.strengths.map((s, i) => (
                    <li key={i} className="text-[10px] text-emerald-800 leading-relaxed">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.areasForImprovement.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <TrendingDown size={10} /> Growth Areas
                </p>
                <ul className="space-y-1">
                  {summary.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-[10px] text-amber-800 leading-relaxed">• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Items */}
          {summary.actionItems.length > 0 && (
            <div className="bg-white/60 rounded-lg p-2.5 border border-violet-100">
              <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider mb-1.5">Professional Development Actions</p>
              <ol className="space-y-1">
                {summary.actionItems.map((a, i) => (
                  <li key={i} className="text-[10px] text-[#374151] leading-relaxed flex gap-1.5">
                    <span className="font-bold text-violet-600 shrink-0">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
