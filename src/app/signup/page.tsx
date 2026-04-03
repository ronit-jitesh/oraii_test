'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { UserPlus, Mail, Lock, CheckCircle, ShieldCheck, Stethoscope, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    primaryHover: '#1B4D38',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    danger: '#C0392B',
    dangerLight: '#FEF2F2',
};

function SignupForm() {
    const searchParams = useSearchParams();
    const roleFromQuery = searchParams.get('role') as 'doctor' | 'patient' | null;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [npiNumber, setNpiNumber] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (roleFromQuery === 'doctor' && npiNumber.length !== 10) {
            setError('Please enter a valid 10-digit NPI number');
            return;
        }

        setLoading(true);

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    role: roleFromQuery || 'doctor',
                    npi_number: roleFromQuery === 'doctor' ? npiNumber : undefined,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
                <div
                    className="w-full max-w-md p-8 text-center"
                    style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: C.primaryLight }}
                    >
                        <CheckCircle style={{ color: C.primary }} size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: C.textPrimary, fontFamily: 'var(--font-lora), Lora, Georgia, serif' }}>Account Created!</h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: C.textMuted }}>
                        Check your email for a confirmation link, then sign in.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-7 py-3 text-white text-sm font-semibold transition-all duration-200"
                        style={{ background: C.primary, borderRadius: 9999 }}
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
            <div className="w-full max-w-md">
                <div
                    className="p-8"
                    style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}
                >
                    <div className="text-center mb-8">
                        <img
                            src="/logo.png"
                            alt="ORAII"
                            style={{ height: '52px', width: 'auto', objectFit: 'contain', margin: '0 auto 8px' }}
                        />
                        <p style={{ fontFamily: 'Lora, Georgia, serif', fontStyle: 'italic', color: '#6B7280', fontSize: '0.95rem', textAlign: 'center' }}>
                            Think freely, document effortlessly.
                        </p>
                        <h1 className="text-xl font-bold mt-4" style={{ color: C.textPrimary, fontFamily: 'var(--font-lora), Lora, Georgia, serif' }}>Create your account</h1>
                        <p className="text-sm mt-1" style={{ color: C.textMuted }}>Join ORAII</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textSecondary }}>Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11 }}
                                    placeholder="you@clinic.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textSecondary }}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11 }}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textSecondary }}>Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11 }}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {roleFromQuery === 'doctor' && (
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textSecondary }}>
                                    <ShieldCheck size={12} style={{ color: C.primary, display: 'inline', marginRight: 4 }} />
                                    NPI Number (10 digits)
                                </label>
                                <div className="relative">
                                    <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: C.textMuted }} />
                                    <input
                                        type="text"
                                        value={npiNumber}
                                        onChange={(e) => setNpiNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11 }}
                                        placeholder="1234567890"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] mt-1 font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Required for provider verification</p>
                            </div>
                        )}

                        {error && (
                            <div
                                className="px-4 py-3 text-sm font-medium"
                                style={{ background: C.dangerLight, color: C.danger, borderRadius: 12, border: '1px solid #FECACA' }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                            style={{ background: C.primary, borderRadius: 9999 }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = C.primaryHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = C.primary; }}
                        >
                            <UserPlus size={16} strokeWidth={1.5} />
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm" style={{ color: C.textMuted }}>
                        Already have an account?{' '}
                        <Link href="/" className="font-semibold" style={{ color: C.primary }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
                <Loader2 className="animate-spin" size={24} style={{ color: C.primary }} />
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
