'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, User, Brain, Zap, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import type { MHCAAlert, ComplianceCheckResult } from '@/lib/mhcaCompliance';
import type { CulturalMapping } from '@/lib/hinglishTaxonomy';

interface MHCAAlertPanelProps {
  compliance: ComplianceCheckResult;
  culturalIdioms?: CulturalMapping[];
  onDismiss?: (alertId: string) => void;
}

const SEVERITY_CONFIG = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconBg: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconBg: 'bg-amber-100',
    badge: 'bg-amber-100 text-amber-700',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconBg: 'bg-red-100',
    badge: 'bg-red-100 text-red-700',
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  '📋': <FileText size={16} />,
  '👤': <User size={16} />,
  '🧠': <Brain size={16} />,
  '⚡': <Zap size={16} />,
};

export default function MHCAAlertPanel({ compliance, culturalIdioms, onDismiss }: MHCAAlertPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [showCulturalIdioms, setShowCulturalIdioms] = useState(false);

  const visibleAlerts = compliance.alerts.filter(a => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0 && (!culturalIdioms || culturalIdioms.length === 0)) {
    return null;
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const overallBg = compliance.overallCompliance === 'urgent'
    ? 'border-red-300 bg-red-50/50'
    : compliance.overallCompliance === 'action_needed'
    ? 'border-amber-300 bg-amber-50/50'
    : 'border-green-300 bg-green-50/50';

  return (
    <div className={`rounded-xl border-2 ${overallBg} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-inherit">
        <div className="p-1.5 rounded-lg bg-indigo-100">
          <Shield size={18} className="text-indigo-700" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold text-[#1A1A1A]">
            MHCA 2017 Compliance Monitor
          </span>
          <p className="text-[10px] text-[#6B7280]">
            {compliance.checksPerformed.length} checks performed • {visibleAlerts.length} alert{visibleAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          compliance.overallCompliance === 'urgent' ? 'bg-red-100 text-red-700' :
          compliance.overallCompliance === 'action_needed' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {compliance.overallCompliance === 'urgent' ? 'Urgent Action' :
           compliance.overallCompliance === 'action_needed' ? 'Action Needed' :
           'Compliant'}
        </span>
      </div>

      {/* Alerts */}
      <div className="divide-y divide-gray-100">
        {visibleAlerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const isExpanded = expandedAlerts.has(alert.id);

          return (
            <div key={alert.id} className={`${config.bg} px-4 py-3`}>
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded-md ${config.iconBg} mt-0.5`}>
                  {ICON_MAP[alert.icon] || <AlertTriangle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${config.text}`}>{alert.title}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.badge}`}>
                      {alert.provision}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] leading-relaxed">{alert.description}</p>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-white/70 rounded-lg p-2.5 border border-gray-200">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Legal Requirement</p>
                        <p className="text-[11px] text-[#374151]">{alert.legalRequirement}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2.5 border border-gray-200">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Suggested Action</p>
                        <p className="text-[11px] text-[#374151]">{alert.suggestedAction}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cultural Idioms Section */}
      {culturalIdioms && culturalIdioms.length > 0 && (
        <div className="border-t border-inherit">
          <button
            onClick={() => setShowCulturalIdioms(!showCulturalIdioms)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/30 transition-colors"
          >
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-2">
              🌍 Cultural Idioms Detected ({culturalIdioms.length})
            </span>
            {showCulturalIdioms ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>

          {showCulturalIdioms && (
            <div className="px-4 pb-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {culturalIdioms.map((idiom, i) => (
                <div key={i} className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-700">{idiom.idiomDetected}</span>
                    <span className="text-[9px] font-medium text-gray-500">→</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{idiom.clinicalMapping}</span>
                  </div>
                  {idiom.somaticPresentation && (
                    <p className="text-[10px] text-[#6B7280] mb-1">
                      <strong>Somatic:</strong> {idiom.somaticPresentation}
                    </p>
                  )}
                  <p className="text-[10px] text-[#6B7280]">
                    <strong>Context:</strong> {idiom.culturalContext}
                  </p>
                  <p className="text-[10px] text-indigo-600 mt-1 italic">{idiom.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
