'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Hash } from 'lucide-react';
import Recorder from './Recorder';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
};

interface SessionInterfaceProps {
    patientId: string;
    patientName: string;
    sessionNumber: number;
}

export default function SessionInterface({ patientId, patientName, sessionNumber }: SessionInterfaceProps) {
    const router = useRouter();

    return (
        <main style={{ minHeight: '100vh', background: C.bg }} className="flex flex-col">
            {/* Patient Context Banner */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #F7F5F0 0%, #F0EDE6 50%, #D8EDDF 100%)',
                    borderBottom: `1px solid ${C.border}`,
                }}
                className="px-6 py-3"
            >
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/doctor/dashboard')}
                            className="flex items-center gap-1.5 transition-colors duration-200 text-sm font-medium"
                            style={{ color: C.textMuted }}
                        >
                            <ArrowLeft size={16} strokeWidth={1.5} />
                            Dashboard
                        </button>
                        <div className="w-px h-6" style={{ background: C.border }} />
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: C.primaryLight }}
                            >
                                <User size={16} style={{ color: C.primary }} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: C.textPrimary }}>{patientName}</p>
                                <p className="text-xs flex items-center gap-1" style={{ color: C.textMuted }}>
                                    <Hash size={10} />
                                    Session {sessionNumber}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ color: C.primary, background: C.primaryLight }}
                        >
                            Active Session
                        </span>
                    </div>
                </div>
            </div>

            {/* Recorder */}
            <div className="flex-1 p-6">
                <Recorder patientId={patientId} patientName={patientName} sessionNumber={sessionNumber} />
            </div>
        </main>
    );
}


