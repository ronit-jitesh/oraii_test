'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock } from 'lucide-react';

const REMEMBER_KEY = 'patient_remembered_email';

export default function PatientLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
            setEmail(saved);
            setRememberMe(true);
        }
    }, [REMEMBER_KEY]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Save or clear email based on Remember Me
        if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError((error instanceof Error ? error.message : String(error)));
            setLoading(false);
        } else {
            router.push('/patient/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F5F0' }}>
            <div className="w-full max-w-md">
                <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2DDD5', boxShadow: '0 2px 12px rgba(45,106,79,0.08)', padding: 32 }}>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <img
                            src="/logo.png"
                            alt="ORAII"
                            style={{ height: '52px', width: 'auto', objectFit: 'contain', margin: '0 auto 8px' }}
                        />
                        <p style={{ fontFamily: 'Lora, Georgia, serif', fontStyle: 'italic', color: '#6B7280', fontSize: '0.95rem', textAlign: 'center' }}>
                            Think freely, document effortlessly.
                        </p>
                        <h1 className="text-2xl font-bold mt-4 tracking-tight" style={{ color: '#1A1A1A', fontFamily: 'var(--font-lora), Lora, Georgia, serif' }}>Patient Portal</h1>
                        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Access your therapy records securely</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold mb-2 ml-1 uppercase tracking-widest" style={{ color: '#6B7280' }}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#9CA3AF' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 font-medium"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-2 ml-1 uppercase tracking-widest" style={{ color: '#6B7280' }}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#9CA3AF' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded cursor-pointer"
                                    style={{ accentColor: '#2D6A4F' }}
                                />
                                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                                    Remember me
                                </span>
                            </label>
                        </div>

                        {error && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#C0392B', padding: '12px 16px', borderRadius: 12, fontSize: '0.875rem', fontWeight: 500 }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 text-white font-semibold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                            style={{
                                background: '#2D6A4F',
                                borderRadius: 9999,
                                border: 'none',
                                cursor: loading ? 'wait' : 'pointer',
                                boxShadow: '0 2px 12px rgba(45,106,79,0.2)',
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1B4D38'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#2D6A4F'; }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Authenticating...
                                </span>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <p className="text-center mt-8 font-medium" style={{ color: '#6B7280' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup?role=patient" className="font-bold" style={{ color: '#2D6A4F' }}>
                            Create Account
                        </Link>
                    </p>

                    {/* Back to landing */}
                    <p className="text-center mt-4">
                        <Link href="/" className="text-sm font-medium transition-colors" style={{ color: '#9CA3AF' }}>
                            ← Back to Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
