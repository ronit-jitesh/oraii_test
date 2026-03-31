'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heart,
    Stethoscope,
    User,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function RoleSelectionPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient' | null>(null);

    const handleProceed = () => {
        if (selectedRole) {
            router.push(`/login?role=${selectedRole}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="max-w-4xl w-full flex flex-col items-center">

                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <Heart className="text-white fill-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-[#2D3E50] tracking-tight">Therapy Platform</h1>
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-[#1A2B3C] mb-3">Welcome!</h2>
                    <p className="text-[#5A6B7C] text-lg">Are you logging in as a . . .</p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-12">

                    {/* Doctor Card */}
                    <div
                        onClick={() => setSelectedRole('doctor')}
                        className={`relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-2 ${selectedRole === 'doctor'
                                ? 'ring-4 ring-indigo-500 ring-offset-4 scale-[1.02]'
                                : 'hover:shadow-2xl'
                            }`}
                    >
                        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-white">
                            <div className="aspect-[4/5] relative bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-8">
                                {/* Doctor Illustration Placeholder */}
                                <div className="w-full h-full rounded-full bg-blue-100/50 flex items-center justify-center">
                                    <div className="relative">
                                        <Stethoscope size={120} className="text-[#52B788] opacity-20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                                                <User size={64} className="text-[#2D6A4F]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedRole === 'doctor' && (
                                    <div className="absolute bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-in zoom-in duration-300">
                                        <CheckCircle2 size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="p-8 text-center bg-white">
                                <h3 className="text-2xl font-bold text-[#1A2B3C] mb-2">Doctor</h3>
                                <p className="text-[#5A6B7C] mb-6">Manage your patients</p>
                                <button className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selectedRole === 'doctor'
                                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-200 shadow-xl'
                                        : 'bg-[#D8EDDF] text-[#2D6A4F] group-hover:bg-[#D8EDDF]'
                                    }`}>
                                    Doctor
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Patient Card */}
                    <div
                        onClick={() => setSelectedRole('patient')}
                        className={`relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-2 ${selectedRole === 'patient'
                                ? 'ring-4 ring-emerald-500 ring-offset-4 scale-[1.02]'
                                : 'hover:shadow-2xl'
                            }`}
                    >
                        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-white">
                            <div className="aspect-[4/5] relative bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-8">
                                {/* Patient Illustration Placeholder */}
                                <div className="w-full h-full rounded-full bg-emerald-100/50 flex items-center justify-center">
                                    <div className="relative">
                                        <Heart size={120} className="text-emerald-400 opacity-20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                                                <User size={64} className="text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedRole === 'patient' && (
                                    <div className="absolute bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-in zoom-in duration-300">
                                        <CheckCircle2 size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="p-8 text-center bg-white">
                                <h3 className="text-2xl font-bold text-[#1A2B3C] mb-2">Patient</h3>
                                <p className="text-[#5A6B7C] mb-6">Access your therapy</p>
                                <button className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selectedRole === 'patient'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200 shadow-xl'
                                        : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                                    }`}>
                                    Patient
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Section */}
                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={handleProceed}
                        disabled={!selectedRole}
                        className={`px-12 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all ${selectedRole
                                ? 'bg-[#1A2B3C] text-white hover:bg-black shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Continue to Login
                        <ArrowRight size={20} />
                    </button>

                    <p className="text-[#5A6B7C] font-medium">
                        Don't have an account? {' '}
                        <button
                            onClick={() => router.push(`/signup${selectedRole ? `?role=${selectedRole}` : ''}`)}
                            className="text-[#2D6A4F] hover:text-[#1B4D38] font-bold hover:underline"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}

