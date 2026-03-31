'use client';

import React from 'react';
import Link from 'next/link';
import { Wind, Palette, Gamepad2, ArrowRight, Sparkles } from 'lucide-react';

const GAMES = [
    {
        href: '/patient/games/breathing',
        title: '4-7-8 Breathing',
        desc: 'Guided deep breathing — inhale, hold, exhale. Calms your nervous system in under 3 minutes.',
        icon: Wind,
        color: '#0891B2',
        gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
    },
    {
        href: '/patient/games/art',
        title: 'Creative Canvas',
        desc: 'Free-form art therapy. Draw, paint, and express yourself with calming colors.',
        icon: Palette,
        color: '#7C3AED',
        gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
    },
    {
        href: '/patient/games/tetris',
        title: 'Mindful Blocks',
        desc: 'A soothing version of Tetris. Focus your mind and find flow state.',
        icon: Gamepad2,
        color: '#059669',
        gradient: 'linear-gradient(135deg, #059669, #34D399)',
    },
];

export default function GamesHubPage() {
    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED15' }}>
                        <Sparkles size={20} style={{ color: '#7C3AED' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        Get Distracted
                    </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Therapeutic activities designed to calm your mind and redirect anxious energy. Pick one that feels right.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {GAMES.map(game => {
                    const Icon = game.icon;
                    return (
                        <Link
                            key={game.href}
                            href={game.href}
                            className="group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 border"
                            style={{
                                background: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            {/* Color Top */}
                            <div
                                className="h-32 flex items-center justify-center"
                                style={{ background: game.gradient }}
                            >
                                <Icon size={48} className="text-white/90" />
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-base mb-1.5" style={{ color: 'var(--color-text)' }}>
                                    {game.title}
                                </h3>
                                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>
                                    {game.desc}
                                </p>
                                <div className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2" style={{ color: game.color }}>
                                    <span>Start</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
