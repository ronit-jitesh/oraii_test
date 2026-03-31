'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { dischargePatient, reactivatePatient, deleteAllPatientData } from '@/app/actions';
import ConfirmationModal from './ConfirmationModal';
import { UserX, UserCheck, Trash2, Loader2 } from 'lucide-react';

interface PatientActionsProps {
    patientId: string;
    patientName: string;
    status?: string | null;
}

const C = {
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    warning: '#D69E2E',
    warningLight: '#FFFFF0',
    danger: '#E53E3E',
    dangerLight: '#FFF5F5',
    textSecondary: '#5A6B7D',
    textMuted: '#8B99AB',
    border: '#E8ECF0',
};

export default function PatientActions({ patientId, patientName, status }: PatientActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeModal, setActiveModal] = useState<'discharge' | 'reactivate' | 'delete' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const isDischarged = status === 'discharged';

    const handleDischarge = () => {
        startTransition(async () => {
            const result = await dischargePatient(patientId);
            setActiveModal(null);
            if (result.success) {
                setFeedback({ type: 'success', message: (result instanceof Error ? result.message : String(result)) || 'Patient discharged.' });
                setTimeout(() => router.push('/doctor/dashboard'), 1500);
            } else {
                setFeedback({ type: 'error', message: result.error || 'Failed to discharge.' });
            }
        });
    };

    const handleReactivate = () => {
        startTransition(async () => {
            const result = await reactivatePatient(patientId);
            setActiveModal(null);
            if (result.success) {
                setFeedback({ type: 'success', message: (result instanceof Error ? result.message : String(result)) || 'Patient reactivated.' });
                setTimeout(() => router.refresh(), 1000);
            } else {
                setFeedback({ type: 'error', message: result.error || 'Failed to reactivate.' });
            }
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteAllPatientData(patientId);
            setActiveModal(null);
            if (result.success) {
                setFeedback({ type: 'success', message: (result instanceof Error ? result.message : String(result)) || 'All data deleted.' });
                setTimeout(() => router.push('/doctor/dashboard'), 1500);
            } else {
                setFeedback({ type: 'error', message: result.error || 'Failed to delete.' });
            }
        });
    };

    return (
        <>
            {/* Feedback Banner */}
            {feedback && (
                <div
                    className="mb-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                        background: feedback.type === 'success' ? '#F0FFF4' : C.dangerLight,
                        color: feedback.type === 'success' ? '#276749' : C.danger,
                        border: `1px solid ${feedback.type === 'success' ? '#C6F6D5' : '#FED7D7'}`,
                    }}
                >
                    {(feedback instanceof Error ? feedback.message : String(feedback))}
                </div>
            )}

            {/* Discharged Badge */}
            {isDischarged && (
                <div
                    className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: C.warningLight, border: '1px solid #FEFCBF' }}
                >
                    <span className="text-lg">📋</span>
                    <div>
                        <p className="text-xs font-semibold uppercase" style={{ color: C.warning }}>Discharged</p>
                        <p className="text-xs" style={{ color: C.textSecondary }}>
                            This patient has been discharged. Records are preserved for reference.
                        </p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
                {isDischarged ? (
                    <>
                        <button
                            onClick={() => setActiveModal('reactivate')}
                            disabled={isPending}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: C.primaryLight,
                                color: C.primary,
                                border: `1px solid ${C.primary}30`,
                            }}
                        >
                            <UserCheck size={16} strokeWidth={1.5} />
                            Reactivate Patient
                        </button>
                        <button
                            onClick={() => setActiveModal('delete')}
                            disabled={isPending}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: C.dangerLight,
                                color: C.danger,
                                border: `1px solid ${C.danger}30`,
                            }}
                        >
                            <Trash2 size={16} strokeWidth={1.5} />
                            Delete All Data
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setActiveModal('discharge')}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                            background: C.warningLight,
                            color: C.warning,
                            border: `1px solid ${C.warning}30`,
                        }}
                    >
                        <UserX size={16} strokeWidth={1.5} />
                        Discharge Patient
                    </button>
                )}
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={activeModal === 'discharge'}
                title="Discharge Patient"
                message={`Are you sure you want to discharge ${patientName}? They will be removed from your active roster, but all session notes, billing records, and history will be preserved.`}
                confirmLabel="Discharge"
                variant="warning"
                onConfirm={handleDischarge}
                onCancel={() => setActiveModal(null)}
                loading={isPending}
            />

            <ConfirmationModal
                isOpen={activeModal === 'reactivate'}
                title="Reactivate Patient"
                message={`Reactivate ${patientName}? They will reappear in your active patient roster.`}
                confirmLabel="Reactivate"
                variant="info"
                onConfirm={handleReactivate}
                onCancel={() => setActiveModal(null)}
                loading={isPending}
            />

            <ConfirmationModal
                isOpen={activeModal === 'delete'}
                title="Permanently Delete All Data"
                message={`This will permanently delete ALL data for ${patientName} — sessions, notes, assessments, billing, and the patient record. This action cannot be undone.`}
                confirmLabel="Delete Everything"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setActiveModal(null)}
                loading={isPending}
            />
        </>
    );
}


