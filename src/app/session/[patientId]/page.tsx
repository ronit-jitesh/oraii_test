import { getPatientById } from '@/app/actions';
import Recorder from '@/components/Recorder';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SessionPageProps {
    params: Promise<{ patientId: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
    const { patientId } = await params;
    const result = await getPatientById(patientId);

    if (!result.success || !result.patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-800">Patient not found</h2>
                    <p className="text-sm mt-1 text-slate-400">The patient ID is invalid or has been removed.</p>
                    <Link href="/doctor/dashboard" className="inline-block mt-4 text-sm font-semibold text-[#2D6A4F] hover:text-[#1B4D38]">
                        ← Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const patient = result.patient;

    return (
        <div className="h-screen flex flex-col bg-[#F7F5F0] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            {/* Breadcrumb Bar */}
            <div className="h-[45px] shrink-0 bg-[#F7F5F0] border-b border-[#E2DDD5] flex items-center px-8 text-[0.875rem]">
                <div className="flex items-center gap-2">
                    <Link href="/doctor/dashboard" className="text-[#6B7280] hover:text-[#2D6A4F] transition-colors">
                        Dashboard
                    </Link>
                    <span className="text-[#9CA3AF]">/</span>
                    <span className="text-[#1A1A1A] font-semibold">{patient.name}</span>
                    {patient.primary_complaint && (
                        <>
                            <span className="text-[#9CA3AF]">/</span>
                            <span className="text-[#6B7280]">{patient.primary_complaint}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Recorder fills remaining height with proper column proportions */}
            <main className="flex-1 overflow-hidden">
                <Recorder patientId={patientId} patientName={patient.name} />
            </main>
        </div>
    );
}
