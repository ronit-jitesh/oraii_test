'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users,
    Calendar,
    Search,
    UserPlus,
    Mic,
    ArrowRight,
    Loader2,
    CheckCircle2,
    User,
    RefreshCw,
    AlertTriangle,
    Receipt,
    ChevronRight,
    ChevronDown,
    Clock,
    Activity,
    Eye,
    EyeOff,
} from 'lucide-react';
import { createPatient, getPatients } from '@/app/actions';

/* ── Types ── */

interface Appointment {
    id: string;
    requested_time: string;
    patients?: { name: string } | null;
    reason?: string | null;
    status: string;
}
interface Patient {
    id: string;
    name: string;
    age?: number;
    primary_complaint?: string;
    status?: string | null;
    lastSessionDate?: string | null;
    lastAssessment?: string | null;
}

interface DashboardProps {
    initialPatients: Patient[];
    stats: {
        totalPatients: number;
        sessionsToday: number;
        pendingSuperbills?: number;
        upcomingAppointments?: Appointment[];
        recentRiskAlerts?: number;
    };
}

/* ──/* -- ORAII Palette -- */
const COLORS = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    borderSubtle: '#F0EDE6',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    primaryMuted: '#52B788',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#52B788',
    accentLight: '#D8EDDF',
    warning: '#D4A017',
    danger: '#C0392B',
    dangerLight: '#FEF2F2',
};

/* ── Component ── */
export default function Dashboard({ initialPatients, stats }: DashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'returning' | 'new'>('new');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [showDischarged, setShowDischarged] = useState(false);

    const [newName, setNewName] = useState('');
    const [newAge, setNewAge] = useState('');
    const [newComplaint, setNewComplaint] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [showExtended, setShowExtended] = useState(false);

    // IPS extended intake fields
    const [newGender, setNewGender] = useState('');
    const [newInformantName, setNewInformantName] = useState('');
    const [newInformantRelationship, setNewInformantRelationship] = useState('');
    const [newFamilyType, setNewFamilyType] = useState('');
    const [newReligion, setNewReligion] = useState('');
    const [newEducation, setNewEducation] = useState('');
    const [newOccupation, setNewOccupation] = useState('');
    const [newIncomeBracket, setNewIncomeBracket] = useState('');
    const [newReferralSource, setNewReferralSource] = useState('');
    const [newLanguageUsed, setNewLanguageUsed] = useState('');
    const [newTranslator, setNewTranslator] = useState(false);
    const [newConsanguinity, setNewConsanguinity] = useState(false);

    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreatePatient = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        startTransition(async () => {
            const result = await createPatient({
                name: newName,
                age: newAge ? parseInt(newAge) : undefined,
                primaryComplaint: newComplaint,
                gender: newGender || undefined,
                informantName: newInformantName || undefined,
                informantRelationship: newInformantRelationship || undefined,
                familyType: newFamilyType || undefined,
                religion: newReligion || undefined,
                educationLevel: newEducation || undefined,
                occupation: newOccupation || undefined,
                incomeBracket: newIncomeBracket || undefined,
                referralSource: newReferralSource || undefined,
                languageUsed: newLanguageUsed || undefined,
                translatorInvolved: newTranslator,
                consanguinity: newConsanguinity,
            });
            if (result.success && result.patient) {
                const newPatient: Patient = {
                    id: result.patient.id,
                    name: result.patient.name,
                    age: result.patient.age,
                    primary_complaint: result.patient.primary_complaint,
                    lastSessionDate: null,
                    lastAssessment: null,
                };
                setPatients([newPatient, ...patients]);
                setSelectedPatient(newPatient);
                setNewName('');
                setNewAge('');
                setNewComplaint('');
                setShowExtended(false);
                setNewGender(''); setNewInformantName(''); setNewInformantRelationship('');
                setNewFamilyType(''); setNewReligion(''); setNewEducation('');
                setNewOccupation(''); setNewIncomeBracket(''); setNewReferralSource('');
                setNewLanguageUsed(''); setNewTranslator(false); setNewConsanguinity(false);
                setActiveTab('returning');
                router.refresh();
            } else {
                setFormError(result.error || 'Unknown error creating patient');
            }
        });
    };

    const handleStartSession = () => {
        if (selectedPatient) {
            router.push(`/session/${selectedPatient.id}`);
        }
    };

    /* ── Avatar colors (deterministic by name) ── */
    const avatarColors = [
        { bg: '#D8EDDF', text: '#2D6A4F' },
        { bg: '#EBF8FF', text: '#2B6CB0' },
        { bg: '#FAF5FF', text: '#6B46C1' },
        { bg: '#FFF5F7', text: '#B83280' },
        { bg: '#FFFFF0', text: '#975A16' },
        { bg: '#F0FFF4', text: '#276749' },
    ];
    const getAvatarColor = (name: string) => {
        const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return avatarColors[hash % avatarColors.length];
    };

    /* ───────────── Render ───────────── */
    return (
        <div style={{ minHeight: '100vh', background: COLORS.bg }}>
            {/* ── Welcome Banner ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${COLORS.border}`,
                }}
                className="px-6 pt-8 pb-24"
            >
                <div className="max-w-6xl mx-auto">
                    <p style={{ color: COLORS.textMuted }} className="text-sm mb-6 font-medium">
                        Select or onboard a patient to begin a session
                    </p>

                    {/* Stat Pills */}
                    <div className="flex gap-4 flex-wrap">
                        <StatPill
                            icon={<Calendar size={18} strokeWidth={1.5} />}
                            value={stats.sessionsToday}
                            label="Sessions Today"
                        />
                        <StatPill
                            icon={<Users size={18} strokeWidth={1.5} />}
                            value={stats.totalPatients}
                            label="Total Patients"
                        />
                        {(stats.recentRiskAlerts ?? 0) > 0 && (
                            <StatPill
                                icon={<AlertTriangle size={18} strokeWidth={1.5} />}
                                value={stats.recentRiskAlerts ?? 0}
                                label="Risk Alerts"
                                variant="warning"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-6xl mx-auto px-6 -mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ──── Patient Roster (Left) ──── */}
                    <div
                        className="lg:col-span-3 flex flex-col overflow-hidden"
                        style={{
                            background: COLORS.card,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 16,
                            minHeight: 460,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                        >
                            <div className="flex items-center gap-2.5">
                                <Users size={16} strokeWidth={1.5} style={{ color: COLORS.textMuted }} />
                                <span className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
                                    Patient Roster
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const next = !showDischarged;
                                        setShowDischarged(next);
                                        startTransition(async () => {
                                            const result = await getPatients(next);
                                            if (result.success && result.patients) {
                                                setPatients(result.patients);
                                            }
                                        });
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200"
                                    style={{
                                        color: showDischarged ? COLORS.primary : COLORS.textMuted,
                                        background: showDischarged ? COLORS.primaryLight : 'transparent',
                                        border: `1px solid ${showDischarged ? COLORS.primary + '30' : 'transparent'}`,
                                    }}
                                    title={showDischarged ? 'Hide discharged patients' : 'Show discharged patients'}
                                >
                                    {showDischarged ? <Eye size={11} /> : <EyeOff size={11} />}
                                    {showDischarged ? 'All' : 'Active'}
                                </button>
                                <span
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                    style={{ color: COLORS.primary, background: COLORS.primaryLight }}
                                >
                                    {patients.length} patient{patients.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {patients.length > 0 && (
                            <div className="px-5 pt-4 pb-2">
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                        size={14}
                                        strokeWidth={1.5}
                                        style={{ color: COLORS.textMuted }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full text-[13px] font-medium outline-none transition-all duration-200 border border-[#F0EDE6] focus:border-[#2D6A4F] bg-[#F7F5F0] rounded-xl px-3 py-2.5 pl-9"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Patient List */}
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {patients.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ background: COLORS.bg }}
                                    >
                                        <UserPlus size={26} strokeWidth={1.5} style={{ color: COLORS.textMuted }} />
                                    </div>
                                    <p className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
                                        No patients yet
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                                        Create your first patient using the intake form
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 pt-1">
                                    {filteredPatients.map((patient) => {
                                        const isSelected = selectedPatient?.id === patient.id;
                                        const colors = getAvatarColor(patient.name);
                                        return (
                                            <button
                                                key={patient.id}
                                                onClick={() => { setSelectedPatient(patient); setActiveTab('returning'); }}
                                                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border ${isSelected ? 'bg-[#D8EDDF] border-[#2D6A4F30]' : 'bg-transparent border-transparent hover:bg-[#F0EDE6]'}`}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200"
                                                    style={{
                                                        background: isSelected ? COLORS.primary : colors.bg,
                                                        color: isSelected ? '#fff' : colors.text,
                                                    }}
                                                >
                                                    {patient.name[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/patients/${patient.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="font-semibold text-sm truncate block transition-colors duration-200 text-[#1A1A1A] hover:text-[#2D6A4F]"
                                                        >
                                                            {patient.name}
                                                        </Link>
                                                        {patient.status === 'discharged' && (
                                                            <span
                                                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                                style={{ color: '#975A16', background: '#FEFCBF' }}
                                                            >
                                                                DISCHARGED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
                                                        {patient.primary_complaint || 'No complaint recorded'}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 size={16} style={{ color: COLORS.primary }} className="shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ──── Right Column ──── */}
                    <div className="lg:col-span-2 flex flex-col gap-5">

                        {/* Intake / Returning Switcher */}
                        <div
                            className="flex flex-col overflow-hidden"
                            style={{
                                background: COLORS.card,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 16,
                                minHeight: 360,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            {/* Tabs */}
                            <div className="flex" style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}>
                                <button
                                    onClick={() => setActiveTab('returning')}
                                    className="flex-1 relative py-3.5 text-center transition-all duration-200"
                                    style={{
                                        color: activeTab === 'returning' ? COLORS.primary : COLORS.textMuted,
                                        fontWeight: 600,
                                        fontSize: 12,
                                        letterSpacing: '0.03em',
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <RefreshCw size={13} strokeWidth={2} />
                                        Returning Patient
                                    </div>
                                    {activeTab === 'returning' && (
                                        <div
                                            className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
                                            style={{ background: COLORS.primary }}
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className="flex-1 relative py-3.5 text-center transition-all duration-200"
                                    style={{
                                        color: activeTab === 'new' ? COLORS.primary : COLORS.textMuted,
                                        fontWeight: 600,
                                        fontSize: 12,
                                        letterSpacing: '0.03em',
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <UserPlus size={13} strokeWidth={2} />
                                        New Intake
                                    </div>
                                    {activeTab === 'new' && (
                                        <div
                                            className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
                                            style={{ background: COLORS.primary }}
                                        />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                {activeTab === 'returning' ? (
                                    <div className="space-y-4 flex-1 flex flex-col">
                                        {selectedPatient ? (
                                            <div
                                                className="rounded-xl p-6 text-center space-y-3"
                                                style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}30` }}
                                            >
                                                <div
                                                    className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center"
                                                    style={{ background: COLORS.card }}
                                                >
                                                    <User style={{ color: COLORS.primary }} size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base" style={{ color: COLORS.textPrimary }}>
                                                        {selectedPatient.name}
                                                    </p>
                                                    <p
                                                        className="text-xs font-medium mt-0.5"
                                                        style={{ color: COLORS.primary }}
                                                    >
                                                        Ready for session
                                                    </p>
                                                </div>
                                                {selectedPatient.primary_complaint && (
                                                    <p className="text-xs italic" style={{ color: COLORS.textSecondary }}>
                                                        &ldquo;{selectedPatient.primary_complaint}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center px-6">
                                                <div className="text-center">
                                                    <div
                                                        className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                                                        style={{ background: COLORS.bg }}
                                                    >
                                                        <User size={20} strokeWidth={1.5} style={{ color: COLORS.textMuted }} />
                                                    </div>
                                                    <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
                                                        Select a patient from the roster to begin their session
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── New Intake Form ── */
                                    <form onSubmit={handleCreatePatient} className="space-y-4 flex-1 flex flex-col">
                                        {formError && (
                                            <div
                                                className="rounded-lg p-3 text-sm font-medium"
                                                style={{
                                                    background: COLORS.dangerLight,
                                                    border: '1px solid #FED7D7',
                                                    color: COLORS.danger,
                                                }}
                                            >
                                                {formError}
                                            </div>
                                        )}
                                        <div>
                                            <label
                                                className="block mb-1.5"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: COLORS.textSecondary,
                                                    textTransform: 'uppercase' as const,
                                                    letterSpacing: '0.06em',
                                                }}
                                            >
                                                Patient Name *
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Full name"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full text-[13px] font-medium outline-none transition-all duration-200"
                                                style={{
                                                    padding: '10px 12px',
                                                    border: `1px solid ${COLORS.borderSubtle}`,
                                                    borderRadius: 10,
                                                    color: COLORS.textPrimary,
                                                    background: COLORS.bg,
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = COLORS.primary;
                                                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primaryLight}`;
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = COLORS.borderSubtle;
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block mb-1.5"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: COLORS.textSecondary,
                                                    textTransform: 'uppercase' as const,
                                                    letterSpacing: '0.06em',
                                                }}
                                            >
                                                Age
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Age"
                                                value={newAge}
                                                onChange={(e) => setNewAge(e.target.value)}
                                                className="w-full text-[13px] font-medium outline-none transition-all duration-200"
                                                style={{
                                                    padding: '10px 12px',
                                                    border: `1px solid ${COLORS.borderSubtle}`,
                                                    borderRadius: 10,
                                                    color: COLORS.textPrimary,
                                                    background: COLORS.bg,
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = COLORS.primary;
                                                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primaryLight}`;
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = COLORS.borderSubtle;
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block mb-1.5"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: COLORS.textSecondary,
                                                    textTransform: 'uppercase' as const,
                                                    letterSpacing: '0.06em',
                                                }}
                                            >
                                                Primary Complaint
                                            </label>
                                            <textarea
                                                placeholder="Describe the primary complaint..."
                                                value={newComplaint}
                                                onChange={(e) => setNewComplaint(e.target.value)}
                                                rows={3}
                                                className="w-full text-[13px] font-medium outline-none transition-all duration-200"
                                                style={{
                                                    padding: '10px 12px',
                                                    border: `1px solid ${COLORS.borderSubtle}`,
                                                    borderRadius: 10,
                                                    color: COLORS.textPrimary,
                                                    background: COLORS.bg,
                                                    resize: 'none' as const,
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = COLORS.primary;
                                                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primaryLight}`;
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = COLORS.borderSubtle;
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>

                                        {/* Extended Intake Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setShowExtended(!showExtended)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                                            style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderSubtle}` }}
                                        >
                                            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Extended Intake (IPS)
                                            </span>
                                            <ChevronDown size={14} style={{ color: COLORS.textMuted, transform: showExtended ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </button>

                                        {showExtended && (
                                            <div className="space-y-3 p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderSubtle}` }}>
                                                {/* Gender */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gender</label>
                                                        <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }}>
                                                            <option value="">—</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Family Type</label>
                                                        <select value={newFamilyType} onChange={(e) => setNewFamilyType(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }}>
                                                            <option value="">—</option>
                                                            <option value="nuclear">Nuclear</option>
                                                            <option value="joint">Joint</option>
                                                            <option value="extended">Extended</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Informant */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Informant Name</label>
                                                        <input type="text" placeholder="Informant" value={newInformantName} onChange={(e) => setNewInformantName(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Relationship</label>
                                                        <input type="text" placeholder="e.g. Mother" value={newInformantRelationship} onChange={(e) => setNewInformantRelationship(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                </div>

                                                {/* Religion, Education */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Religion</label>
                                                        <input type="text" placeholder="Religion" value={newReligion} onChange={(e) => setNewReligion(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Education</label>
                                                        <input type="text" placeholder="Education level" value={newEducation} onChange={(e) => setNewEducation(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                </div>

                                                {/* Occupation, Income */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Occupation</label>
                                                        <input type="text" placeholder="Occupation" value={newOccupation} onChange={(e) => setNewOccupation(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income Bracket</label>
                                                        <select value={newIncomeBracket} onChange={(e) => setNewIncomeBracket(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }}>
                                                            <option value="">—</option>
                                                            <option value="below_1L">Below ₹1L/year</option>
                                                            <option value="1L_3L">₹1L – ₹3L</option>
                                                            <option value="3L_5L">₹3L – ₹5L</option>
                                                            <option value="5L_10L">₹5L – ₹10L</option>
                                                            <option value="above_10L">Above ₹10L</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Referral, Language */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Referral Source</label>
                                                        <input type="text" placeholder="e.g. Dr. Sharma" value={newReferralSource} onChange={(e) => setNewReferralSource(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1" style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session Language</label>
                                                        <input type="text" placeholder="e.g. Hindi, English" value={newLanguageUsed} onChange={(e) => setNewLanguageUsed(e.target.value)} className="w-full text-xs font-medium outline-none px-2.5 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.borderSubtle}`, background: COLORS.card, color: COLORS.textPrimary }} />
                                                    </div>
                                                </div>

                                                {/* Checkboxes */}
                                                <div className="flex gap-6">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={newTranslator} onChange={(e) => setNewTranslator(e.target.checked)} className="rounded" />
                                                        <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Translator Needed</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={newConsanguinity} onChange={(e) => setNewConsanguinity(e.target.checked)} className="rounded" />
                                                        <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Consanguinity</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isPending || !newName}
                                            className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200"
                                            style={{
                                                background: isPending || !newName ? '#CBD5E1' : COLORS.primary,
                                                cursor: isPending || !newName ? 'not-allowed' : 'pointer',
                                                opacity: isPending || !newName ? 0.5 : 1,
                                            }}
                                        >
                                            {isPending ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <UserPlus size={16} strokeWidth={1.5} />
                                            )}
                                            {isPending ? 'Creating...' : 'Create Patient'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* ── Start Session Button ── */}
                        <button
                            onClick={handleStartSession}
                            disabled={!selectedPatient}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[15px] font-semibold transition-all duration-300"
                            style={{
                                background: selectedPatient ? COLORS.primary : COLORS.bg,
                                color: selectedPatient ? '#fff' : '#CBD5E1',
                                cursor: selectedPatient ? 'pointer' : 'not-allowed',
                                border: selectedPatient ? 'none' : `1px solid ${COLORS.border}`,
                                boxShadow: selectedPatient ? '0 4px 12px rgba(45,106,79,0.25)' : 'none',
                            }}
                        >
                            <Mic size={18} strokeWidth={1.5} />
                            Start Session
                            <ArrowRight size={16} strokeWidth={1.5} />
                        </button>
                        <p
                            className="text-center -mt-3"
                            style={{ fontSize: 11, color: COLORS.textMuted }}
                        >
                            {selectedPatient
                                ? `Session for ${selectedPatient.name}`
                                : 'Select or create a patient first'}
                        </p>

                        {/* ── Action Center ── */}
                        <div
                            className="overflow-hidden"
                            style={{
                                background: COLORS.card,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 16,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div
                                className="px-5 py-3.5 flex items-center gap-2.5"
                                style={{ borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.bg }}
                            >
                                <Activity size={14} strokeWidth={1.8} style={{ color: COLORS.primary }} />
                                <span
                                    className="font-semibold text-[11px] uppercase tracking-wider"
                                    style={{ color: COLORS.textSecondary }}
                                >
                                    Action Center
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Risk Status */}
                                {stats.recentRiskAlerts && stats.recentRiskAlerts > 0 ? (
                                    <div
                                        className="p-3.5 rounded-xl flex items-center gap-3"
                                        style={{ background: COLORS.dangerLight, border: '1px solid #FED7D7' }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: '#FED7D7' }}
                                        >
                                            <AlertTriangle size={15} style={{ color: COLORS.danger }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-semibold uppercase" style={{ color: COLORS.danger }}>
                                                Risk Alerts
                                            </p>
                                            <p className="text-xs font-medium" style={{ color: '#9B2C2C' }}>
                                                {stats.recentRiskAlerts} case{stats.recentRiskAlerts > 1 ? 's' : ''} flagged
                                            </p>
                                        </div>
                                        <Link
                                            href="/sessions"
                                            className="text-[10px] font-bold px-2 py-1 rounded-md transition-colors duration-200"
                                            style={{ color: COLORS.danger, background: '#FED7D7' }}
                                        >
                                            VIEW
                                        </Link>
                                    </div>
                                ) : (
                                    <div
                                        className="p-3.5 rounded-xl flex items-center gap-3"
                                        style={{
                                            background: COLORS.bg,
                                            border: `1px solid ${COLORS.borderSubtle}`,
                                        }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: COLORS.accentLight }}
                                        >
                                            <CheckCircle2 size={15} style={{ color: COLORS.accent }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-semibold" style={{ color: COLORS.accent }}>
                                                All Clear
                                            </p>
                                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                                No acute risks detected this week
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Pending Bills */}
                                <div
                                    className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 hover:bg-[#F0EDE6] border border-[#E2DDD5]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Receipt size={15} strokeWidth={1.5} style={{ color: COLORS.textMuted }} />
                                        <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
                                            Pending Superbills
                                        </span>
                                    </div>
                                    <Link href="/doctor/dashboard/billing" className="flex items-center gap-1.5">
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ color: COLORS.primary, background: COLORS.primaryLight }}
                                        >
                                            {stats.pendingSuperbills || 0}
                                        </span>
                                        <ChevronRight size={14} style={{ color: COLORS.textMuted }} />
                                    </Link>
                                </div>

                                {/* Today's Schedule */}
                                <div className="pt-1">
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                                        style={{ color: COLORS.textMuted }}
                                    >
                                        <Clock size={11} strokeWidth={1.8} />
                                        Today&apos;s Schedule
                                    </p>
                                    <div className="space-y-2">
                                        {stats.upcomingAppointments && stats.upcomingAppointments.length > 0
                                            ? stats.upcomingAppointments.map((apt: Appointment) => (
                                                <div
                                                    key={apt.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                                                    style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderSubtle}` }}
                                                >
                                                    <div
                                                        className="text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap"
                                                        style={{ color: COLORS.primary, background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                                                    >
                                                        {new Date(apt.requested_time).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                                                            {apt.patients?.name || 'Unknown Patient'}
                                                        </p>
                                                        <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                                                            {apt.reason || 'General Session'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                            : (
                                                <div
                                                    className="py-5 text-center rounded-xl"
                                                    style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}` }}
                                                >
                                                    <Calendar size={20} strokeWidth={1.5} style={{ color: COLORS.textMuted }} className="mx-auto mb-2" />
                                                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                                        No appointments scheduled today
                                                    </p>
                                                </div>
                                            )}
                                        <Link
                                            href="/appointments"
                                            className="flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2.5 rounded-xl transition-all duration-200"
                                            style={{
                                                color: COLORS.primary,
                                                background: COLORS.primaryLight,
                                                border: `1px solid ${COLORS.primary}30`,
                                            }}
                                        >
                                            <Calendar size={13} strokeWidth={1.8} />
                                            Open Appointment Manager
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-12" />
        </div>
    );
}

/* ── Stat Pill Sub-Component ── */
function StatPill({
    icon,
    value,
    label,
    variant = 'default',
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    variant?: 'default' | 'warning';
}) {
    const bg = variant === 'warning' ? '#FFFAF0' : COLORS.card;
    const borderColor = variant === 'warning' ? '#FEEBC8' : COLORS.border;
    const valueColor = variant === 'warning' ? COLORS.warning : COLORS.textPrimary;
    const iconColor = variant === 'warning' ? COLORS.warning : COLORS.primary;

    return (
        <div
            className="flex items-center gap-3.5 px-5 py-3.5 rounded-xl"
            style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
        >
            <div style={{ color: iconColor }}>{icon}</div>
            <div>
                <span
                    className="text-2xl font-bold leading-none block"
                    style={{ color: valueColor }}
                >
                    {value}
                </span>
                <span
                    className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: COLORS.textMuted }}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}

