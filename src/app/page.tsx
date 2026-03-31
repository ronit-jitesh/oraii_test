'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Heart, User, Shield, ArrowRight, Clock, Users, CheckCircle2 } from 'lucide-react';

/* ── ORAII Palette ── */
const COLORS = {
  bg: '#F7F5F0',
  card: '#FFFFFF',
  border: '#E2DDD5',
  primary: '#2D6A4F',
  primaryLight: '#D8EDDF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#52B788',
  accentWarm: '#B7935A',
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── Minimal Navigation ── */}
      <nav className="w-full px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="ORAII"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Solutions</a>
          <a href="#" className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Security</a>
          <a href="#" className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Contact</a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-8">
        <div className="max-w-4xl w-full flex flex-col items-center">

          {/* Trust Pill */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full mb-10 transition-transform hover:scale-105 duration-300"
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 2px 12px rgba(45,106,79,0.08)'
            }}
          >
            <Shield size={14} style={{ color: COLORS.primary }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: COLORS.textMuted }}>
              HIPAA Compliant &bull; End-to-End Encrypted
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-6xl text-center leading-[1.15] mb-6 tracking-tight"
            style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-lora), Lora, Georgia, serif', fontWeight: 600 }}
          >
            The Operating System for<br />
            <span style={{ color: COLORS.primary }}>Mindful Practice</span>
          </h1>
          <p
            className="text-lg text-center max-w-xl mb-14 leading-relaxed font-medium"
            style={{ color: COLORS.textSecondary }}
          >
            Ambient intelligence for therapy notes, longitudinal outcomes, and practice automation. Built for the modern clinician.
          </p>

          {/* ── Role Selection Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">

            {/* Doctor Card */}
            <button
              onClick={() => router.push('/doctor/login')}
              className="group relative p-8 transition-all duration-300 text-left cursor-pointer hover:-translate-y-1.5"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                boxShadow: '0 2px 12px rgba(45,106,79,0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(45,106,79,0.14)';
                e.currentTarget.style.borderColor = COLORS.primaryLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(45,106,79,0.08)';
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors"
                style={{ background: COLORS.primaryLight }}
              >
                <Stethoscope size={28} style={{ color: COLORS.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-lora), Lora, Georgia, serif' }}>Provider Portal</h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: COLORS.textMuted }}>
                Ambient listening, SOAP generation, and automated clinical outcomes.
              </p>
              <div
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all"
                style={{ color: COLORS.primary }}
              >
                <span>Continue</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

            {/* Patient Card */}
            <button
              onClick={() => router.push('/patient/login')}
              className="group relative p-8 transition-all duration-300 text-left cursor-pointer hover:-translate-y-1.5"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                boxShadow: '0 2px 12px rgba(45,106,79,0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(82,183,136,0.12)';
                e.currentTarget.style.borderColor = '#D8EDDF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(45,106,79,0.08)';
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors"
                style={{ background: '#E8F5E9' }}
              >
                <User size={28} style={{ color: COLORS.accent }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-lora), Lora, Georgia, serif' }}>Patient Portal</h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: COLORS.textMuted }}>
                View your progress charts, session history, and practice assignments.
              </p>
              <div
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all"
                style={{ color: COLORS.accent }}
              >
                <span>Access</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-10 mt-20">
            <TrustBadge icon={<Shield size={16} />} text="HIPAA Cloud" />
            <TrustBadge icon={<CheckCircle2 size={16} />} text="ISO Certified" />
            <TrustBadge icon={<Users size={16} />} text="500+ Clinicians" />
          </div>

          {/* Footer */}
          <p className="mt-16 text-xs" style={{ color: COLORS.textMuted }}>
            © 2025 ORAII · Bengaluru, India
          </p>
        </div>
      </main>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: COLORS.textMuted }}>
      <div style={{ color: COLORS.primary }}>{icon}</div>
      <span className="text-xs font-bold uppercase tracking-widest">{text}</span>
    </div>
  );
}
