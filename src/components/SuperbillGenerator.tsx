'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    FileText,
    Plus,
    X,
    Save,
    CheckCircle,
    Search,
    Receipt,
    Clock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { saveSuperbill, getPatientSuperbills } from '@/app/actions';
import { CPT_DATABASE, ICD10_DATABASE, searchICD10, suggestCPTCodes, mapSymptomsToICD10, type CPTCode, type ICD10Code } from '@/lib/cptCodes';

interface SuperbillGeneratorProps {
    patientId: string;
    patientName: string;
    extractedSymptoms?: string[];
    extractedDiagnoses?: string[];
}

interface BillCPT {
    code: string;
    description: string;
    fee: number;
}

interface BillICD10 {
    code: string;
    description: string;
}

interface HistoryItem {
    id: string;
    service_date: string;
    cpt_codes: BillCPT[];
    icd_10_codes: BillICD10[];
    total_fee: number;
    status: string;
    created_at: string;
}

export const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#F1F5F9', text: '#475569', label: 'Draft' },
    ready_for_payer: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Ready for Payer' },
    submitted: { bg: '#FEF3C7', text: '#92400E', label: 'Submitted' },
    paid: { bg: '#D1FAE5', text: '#065F46', label: 'Paid' },
    denied: { bg: '#FEE2E2', text: '#991B1B', label: 'Denied' },
    appealed: { bg: '#E0E7FF', text: '#3730A3', label: 'Appealed' },
};

export default function SuperbillGenerator({
    patientId,
    patientName,
    extractedSymptoms,
    extractedDiagnoses
}: SuperbillGeneratorProps) {
    // Form state
    const [cptCodes, setCptCodes] = useState<BillCPT[]>([]);
    const [icd10Codes, setIcd10Codes] = useState<BillICD10[]>([]);
    const [providerName, setProviderName] = useState('');
    const [providerNpi, setProviderNpi] = useState('');
    const [sessionDuration, setSessionDuration] = useState(45);
    const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // UI state
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [icd10Search, setIcd10Search] = useState('');
    const [showIcd10Picker, setShowIcd10Picker] = useState(false);
    const [showCptPicker, setShowCptPicker] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-load provider settings from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('clinical-copilot-provider-settings');
            if (stored) {
                const s = JSON.parse(stored);
                if (s.providerName && !providerName) setProviderName(s.providerName);
                if (s.providerNpi && !providerNpi) setProviderNpi(s.providerNpi);
                if (s.defaultDuration) setSessionDuration(s.defaultDuration);
            }
        } catch { /* ignore */ }

        // Invisible Billing: Auto-map symptoms to ICD-10
        if (extractedSymptoms || extractedDiagnoses) {
            const mapped = mapSymptomsToICD10(extractedSymptoms || [], extractedDiagnoses || []);
            if (mapped.length > 0) {
                setIcd10Codes(prev => {
                    const existingCodes = new Set(prev.map(p => p.code));
                    const newCodes = mapped
                        .filter((m: ICD10Code) => !existingCodes.has(m.code))
                        .map((m: ICD10Code) => ({ code: m.code, description: m.description }));
                    return [...prev, ...newCodes];
                });
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load history
    useEffect(() => {
        if (!patientId) return;
        getPatientSuperbills(patientId).then((res) => {
            if (res.success && res.superbills) {
                setHistory(res.superbills as HistoryItem[]);
            }
        });
    }, [patientId]);

    // Auto-suggest CPT based on duration
    useEffect(() => {
        if (cptCodes.length === 0 && sessionDuration > 0) {
            const suggestions = suggestCPTCodes(sessionDuration, '');
            setCptCodes(suggestions.map((s) => ({ code: s.code, description: s.description, fee: s.fee })));
        }
    }, [sessionDuration]); // eslint-disable-line react-hooks/exhaustive-deps

    const totalFee = cptCodes.reduce((sum, c) => sum + c.fee, 0);

    const addCpt = (cpt: CPTCode) => {
        if (!cptCodes.find((c) => c.code === cpt.code)) {
            setCptCodes([...cptCodes, { code: cpt.code, description: cpt.description, fee: cpt.typicalFee }]);
        }
        setShowCptPicker(false);
    };

    const removeCpt = (code: string) => {
        setCptCodes(cptCodes.filter((c) => c.code !== code));
    };

    const updateCptFee = (code: string, fee: number) => {
        setCptCodes(cptCodes.map((c) => (c.code === code ? { ...c, fee } : c)));
    };

    const addIcd10 = (icd: ICD10Code) => {
        if (!icd10Codes.find((c) => c.code === icd.code)) {
            setIcd10Codes([...icd10Codes, { code: icd.code, description: icd.description }]);
        }
        setShowIcd10Picker(false);
        setIcd10Search('');
    };

    const removeIcd10 = (code: string) => {
        setIcd10Codes(icd10Codes.filter((c) => c.code !== code));
    };

    const handleSave = async (status: string) => {
        setSaving(true);
        setError(null);
        try {
            const result = await saveSuperbill({
                patientId,
                cptCodes,
                icd10Codes,
                providerName: providerName || undefined,
                providerNpi: providerNpi || undefined,
                sessionDurationMinutes: sessionDuration,
                totalFee,
                status,
                serviceDate,
                notes: notes || undefined,
            });

            if (result.error) {
                setError(result.error);
            } else {
                setSaved(true);
                // Refresh history
                const res = await getPatientSuperbills(patientId);
                if (res.success && res.superbills) {
                    setHistory(res.superbills as HistoryItem[]);
                }
            }
        } catch {
            setError('Failed to save superbill.');
        } finally {
            setSaving(false);
        }
    };

    const filteredIcd10 = icd10Search.length >= 2 ? searchICD10(icd10Search) : [];

    return (
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #E2DDD5', borderRadius: 12 }}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                style={{ borderBottom: isExpanded ? '1px solid #F1F5F9' : undefined }}
            >
                <div className="p-2 rounded-lg" style={{ background: '#ECFDF5' }}>
                    <Receipt size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                    <span className="font-semibold text-sm text-[#334155]">Superbill Generator</span>
                    <p className="text-[11px] text-[#94A3B8]">Auto-generate insurance claims from session data</p>
                </div>
                {history.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                        {history.length} bills
                    </span>
                )}
                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="p-5 space-y-5">
                    {saved ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <CheckCircle size={48} className="text-emerald-500" />
                            <p className="font-semibold text-emerald-700">Superbill Saved!</p>
                            <button
                                onClick={() => { setSaved(false); setCptCodes([]); setIcd10Codes([]); setNotes(''); }}
                                className="text-sm text-[#2D6A4F] hover:underline"
                            >
                                Create Another
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Session Info Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Service Date</label>
                                    <input
                                        type="date"
                                        value={serviceDate}
                                        onChange={(e) => setServiceDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2D6A4F]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Duration (min)</label>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <input
                                            type="number"
                                            value={sessionDuration}
                                            onChange={(e) => setSessionDuration(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2D6A4F]"
                                            min={1}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CPT Codes */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">CPT Codes</label>
                                    <button
                                        onClick={() => setShowCptPicker(!showCptPicker)}
                                        className="text-xs text-[#2D6A4F] hover:text-[#2D6A4F] flex items-center gap-1 font-medium"
                                    >
                                        <Plus size={12} /> Add Code
                                    </button>
                                </div>

                                {showCptPicker && (
                                    <div className="mb-3 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50">
                                        {CPT_DATABASE.filter((c) => !cptCodes.find((cc) => cc.code === c.code)).map((cpt) => (
                                            <button
                                                key={cpt.code}
                                                onClick={() => addCpt(cpt)}
                                                className="w-full text-left px-3 py-2 hover:bg-[#D8EDDF] transition-colors flex items-center gap-3 text-xs"
                                                style={{ borderBottom: '1px solid #F1F5F9' }}
                                            >
                                                <span className="font-mono font-bold text-[#2D6A4F] shrink-0">{cpt.code}</span>
                                                <span className="flex-1 text-gray-600">{cpt.description}</span>
                                                <span className="text-emerald-600 font-semibold">£{cpt.typicalFee}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {cptCodes.map((cpt) => (
                                        <div key={cpt.code} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#F7F5F0', border: '1px solid #E2DDD5' }}>
                                            <span className="font-mono font-bold text-sm text-[#2D6A4F] shrink-0">{cpt.code}</span>
                                            <span className="flex-1 text-xs text-gray-600 truncate">{cpt.description}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-xs text-gray-400">£</span>
                                                <input
                                                    type="number"
                                                    value={cpt.fee}
                                                    onChange={(e) => updateCptFee(cpt.code, Number(e.target.value))}
                                                    className="w-16 px-2 py-1 rounded border border-gray-200 text-xs text-right font-semibold text-emerald-700 focus:outline-none focus:border-[#2D6A4F]"
                                                    min={0}
                                                />
                                            </div>
                                            <button onClick={() => removeCpt(cpt.code)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {cptCodes.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-3">No CPT codes added. Adjust session duration to auto-suggest.</p>
                                    )}
                                </div>
                            </div>

                            {/* ICD-10 Codes */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">ICD-10 Diagnosis Codes</label>
                                    <button
                                        onClick={() => setShowIcd10Picker(!showIcd10Picker)}
                                        className="text-xs text-[#2D6A4F] hover:text-[#2D6A4F] flex items-center gap-1 font-medium"
                                    >
                                        <Plus size={12} /> Add Diagnosis
                                    </button>
                                </div>

                                {showIcd10Picker && (
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 mb-2">
                                            <Search size={14} className="text-gray-400" />
                                            <input
                                                type="text"
                                                value={icd10Search}
                                                onChange={(e) => setIcd10Search(e.target.value)}
                                                placeholder="Search diagnoses (e.g. anxiety, F41...)"
                                                className="w-full text-xs bg-transparent focus:outline-none text-gray-700"
                                                autoFocus
                                            />
                                        </div>
                                        {filteredIcd10.length > 0 && (
                                            <div className="max-h-[160px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50">
                                                {filteredIcd10.map((icd) => (
                                                    <button
                                                        key={icd.code}
                                                        onClick={() => addIcd10(icd)}
                                                        className="w-full text-left px-3 py-2 hover:bg-[#D8EDDF] transition-colors flex items-center gap-3 text-xs"
                                                        style={{ borderBottom: '1px solid #F1F5F9' }}
                                                    >
                                                        <span className="font-mono font-bold text-purple-700 shrink-0">{icd.code}</span>
                                                        <span className="flex-1 text-gray-600">{icd.description}</span>
                                                        <span className="text-[10px] text-gray-400">{icd.category}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {icd10Codes.map((icd) => (
                                        <span key={icd.code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#F3E8FF', color: '#6B21A8', border: '1px solid #DDD6FE' }}>
                                            <span className="font-mono font-bold">{icd.code}</span>
                                            <span className="text-purple-600">{icd.description}</span>
                                            <button onClick={() => removeIcd10(icd.code)} className="text-purple-400 hover:text-red-500 ml-1">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {icd10Codes.length === 0 && (
                                        <p className="text-xs text-gray-400 py-1">No diagnosis codes added.</p>
                                    )}
                                </div>
                            </div>

                            {/* Provider Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Provider Name</label>
                                    <input
                                        type="text"
                                        value={providerName}
                                        onChange={(e) => setProviderName(e.target.value)}
                                        placeholder="Dr. Jane Smith"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2D6A4F]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">NPI Number</label>
                                    <input
                                        type="text"
                                        value={providerNpi}
                                        onChange={(e) => setProviderNpi(e.target.value)}
                                        placeholder="1234567890"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2D6A4F]"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional notes for this claim..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 h-16 resize-none focus:outline-none focus:border-[#2D6A4F]"
                                />
                            </div>

                            {/* Total & Actions */}
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Total Fee</p>
                                    <p className="text-2xl font-bold text-emerald-800">£{totalFee.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSave('draft')}
                                        disabled={saving || cptCodes.length === 0}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={() => handleSave('ready_for_payer')}
                                        disabled={saving || cptCodes.length === 0 || icd10Codes.length === 0}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        <DollarSign size={14} />
                                        {saving ? 'Saving...' : 'Ready for Payer'}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                        </>
                    )}

                    {/* Billing History */}
                    {history.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full flex items-center justify-between text-left py-2"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                                    Billing History ({history.length})
                                </span>
                                {showHistory ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            </button>

                            {showHistory && (
                                <div className="space-y-2 mt-1">
                                    {history.map((bill) => {
                                        const statusCfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.draft;
                                        return (
                                            <div key={bill.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#FAFBFC', border: '1px solid #F1F5F9' }}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {new Date(bill.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span
                                                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                            style={{ background: statusCfg.bg, color: statusCfg.text }}
                                                        >
                                                            {statusCfg.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {bill.cpt_codes.map((c: BillCPT) => (
                                                            <span key={c.code} className="text-[10px] font-mono text-[#2D6A4F] bg-[#D8EDDF] px-1.5 py-0.5 rounded">
                                                                {c.code}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-700 shrink-0">£{Number(bill.total_fee).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


