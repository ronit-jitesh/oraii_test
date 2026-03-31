import { getPatientById, getPatientSessions, getPatientStats, getPatientAssessments } from '@/app/actions';
import ProgressChart from '@/components/ProgressChart';
import OutcomeTracker from '@/components/OutcomeTracker';
import SuperbillGenerator, { STATUS_CONFIG } from '@/components/SuperbillGenerator';
import PatientActions from '@/components/PatientActions';
import ClinicalAnalysisPanel from '@/components/ClinicalAnalysisPanel';
import Link from 'next/link';
import { ArrowLeft, User, Mic, Calendar, FileText, ChevronRight, Clock, DollarSign } from 'lucide-react';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    borderSubtle: '#F0EDE6',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
};

interface PatientPageProps {
    params: Promise<{ patientId: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
    const { patientId } = await params;

    const [patientResult, sessionsResult, statsResult, assessmentsResult] = await Promise.all([
        getPatientById(patientId),
        getPatientSessions(patientId),
        getPatientStats(patientId),
        getPatientAssessments(patientId),
    ]);

    if (!patientResult.success || !patientResult.patient) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
                <div className="text-center">
                    <h2 className="text-xl font-bold" style={{ color: C.textPrimary }}>Patient not found</h2>
                    <p className="text-sm mt-2" style={{ color: C.textMuted }}>This patient may have been removed.</p>
                    <Link href="/doctor/dashboard" className="inline-block mt-6 text-sm font-semibold" style={{ color: C.primary }}>
                        ← Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const patient = patientResult.patient;
    const sessions = sessionsResult.success ? sessionsResult.sessions || [] : [];
    const sessionCount = statsResult.success ? statsResult.sessionCount || 0 : 0;
    const isDischarged = patient.status === 'discharged';

    // Build assessment scores map for Clinical Analysis
    const assessments = assessmentsResult.success ? assessmentsResult.assessments || [] : [];
    const latestScoresByInstrument: Record<string, { score: number; severity: string }> = {};
    for (const a of assessments) {
        if (!latestScoresByInstrument[a.instrument]) {
            latestScoresByInstrument[a.instrument] = {
                score: a.total_score,
                severity: a.severity_label,
            };
        }
    }

    // Latest transcript for analysis context
    const latestTranscript = sessions[0]?.soap_note
        ? `${sessions[0].soap_note.subjective || ''}\n${sessions[0].soap_note.assessment || ''}`
        : undefined;

    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {/* ── Patient Header ── */}
            <div style={{ background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)', borderBottom: `1px solid ${C.border}` }} className="px-6 pt-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    <Link href="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-200" style={{ color: C.textMuted }}>
                        <ArrowLeft size={14} strokeWidth={2} />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold" style={{ background: C.primaryLight, color: C.primary }}>
                                {patient.name[0]}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>
                                    {patient.name}
                                    {patient.age && <span className="font-normal ml-2" style={{ color: C.textMuted }}>({patient.age})</span>}
                                </h1>
                                {patient.primary_complaint && (
                                    <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
                                        Primary Complaint: <span className="font-medium" style={{ color: C.textSecondary }}>{patient.primary_complaint}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {!isDischarged && (
                            <Link href={`/session/${patientId}`} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200" style={{ background: C.primary, boxShadow: '0 2px 8px rgba(45,106,79,0.2)' }}>
                                <Mic size={18} strokeWidth={1.5} />
                                Start New Session
                            </Link>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4 mt-5 flex-wrap">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <FileText size={16} strokeWidth={1.5} style={{ color: C.primary }} />
                            <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                <span className="font-bold" style={{ color: C.textPrimary }}>{sessionCount}</span> Session{sessionCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {sessions[0]?.created_at && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <Clock size={16} strokeWidth={1.5} style={{ color: C.primary }} />
                                <span className="text-sm font-medium" style={{ color: C.textSecondary }}>
                                    Last: {new Date(sessions[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                        {Object.keys(latestScoresByInstrument).length > 0 && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>
                                    Assessments: <span className="font-bold" style={{ color: C.textPrimary }}>{Object.keys(latestScoresByInstrument).join(', ')}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Patient Actions ── */}
            <div className="max-w-6xl mx-auto px-6 pt-6">
                <PatientActions patientId={patientId} patientName={patient.name} status={patient.status} />
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-3 space-y-6">
                        <ProgressChart sessions={sessions} patientName={patient.name} />
                        <OutcomeTracker patientId={patientId} patientName={patient.name} />

                        {/* ── Clinical Analysis Panel ── */}
                        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <ClinicalAnalysisPanel
                                patientId={patientId}
                                patientName={patient.name}
                                patientAge={patient.age || undefined}
                                patientGender={patient.gender || undefined}
                                sessionCount={sessionCount}
                                latestTranscript={latestTranscript}
                                latestNotes={sessions[0]?.soap_note ? JSON.stringify(sessions[0].soap_note).slice(0, 2000) : undefined}
                                assessmentScores={Object.keys(latestScoresByInstrument).length > 0 ? latestScoresByInstrument : undefined}
                            />
                        </div>

                        <SuperbillGenerator
                            patientId={patientId}
                            patientName={patient.name}
                            extractedSymptoms={sessions[0]?.entities?.symptoms}
                            extractedDiagnoses={sessions[0]?.entities?.diagnoses}
                        />
                    </div>

                    {/* Right column — Session Timeline */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.borderSubtle}`, background: C.bg }}>
                                <Calendar size={15} strokeWidth={1.5} style={{ color: C.primary }} />
                                <span className="font-semibold text-sm" style={{ color: C.textPrimary }}>Session Timeline</span>
                            </div>

                            <div className="max-h-[480px] overflow-y-auto">
                                {sessions.length === 0 ? (
                                    <div className="py-12 px-6 text-center">
                                        <FileText size={28} className="mx-auto mb-3" strokeWidth={1.5} style={{ color: C.textMuted }} />
                                        <p className="text-sm font-medium" style={{ color: C.textMuted }}>No sessions recorded yet</p>
                                        <Link href={`/session/${patientId}`} className="inline-block mt-3 text-xs font-semibold" style={{ color: C.primary }}>
                                            Start the first session →
                                        </Link>
                                    </div>
                                ) : (
                                    <div>
                                        {sessions.map((session: any, index: number) => {
                                            const date = new Date(session.created_at);
                                            const sessionNumber = sessions.length - index;
                                            const summary = session.soap_note?.assessment?.slice(0, 100) || session.soap_note?.subjective?.slice(0, 100) || 'Session recorded';
                                            const billing = session.billing;
                                            const billingConfig = billing ? STATUS_CONFIG[billing.status] : null;

                                            return (
                                                <Link key={session.id} href={`/history/${session.id}`} className="block p-4 transition-all duration-200 group" style={{ borderBottom: `1px solid ${C.borderSubtle}` }}
                                                    onMouseEnter={(e: any) => e.currentTarget.style.background = C.bg}
                                                    onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: C.primary, background: C.primaryLight }}>
                                                                    #{sessionNumber}
                                                                </span>
                                                                <span className="text-xs" style={{ color: C.textMuted }}>
                                                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                {billingConfig && (
                                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded ml-auto flex items-center gap-1"
                                                                        style={{ backgroundColor: billingConfig.bg, color: billingConfig.text, border: `1px solid ${billingConfig.text}20` }}>
                                                                        <DollarSign size={8} />
                                                                        {billingConfig.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm leading-relaxed truncate" style={{ color: C.textSecondary }}>{summary}</p>
                                                        </div>
                                                        <ChevronRight size={16} className="mt-1 shrink-0" style={{ color: C.textMuted }} />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
