'use client';

import React, { useState } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const VARIANT_STYLES = {
    danger: {
        icon: '⚠️',
        confirmBg: '#E53E3E',
        confirmHoverBg: '#C53030',
        accentLight: '#FFF5F5',
        accentBorder: '#FED7D7',
        accentText: '#E53E3E',
    },
    warning: {
        icon: '📋',
        confirmBg: '#D69E2E',
        confirmHoverBg: '#B7791F',
        accentLight: '#FFFFF0',
        accentBorder: '#FEFCBF',
        accentText: '#D69E2E',
    },
    info: {
        icon: 'ℹ️',
        confirmBg: '#2D6A4F',
        confirmHoverBg: '#234E52',
        accentLight: '#D8EDDF',
        accentBorder: '#B2DFDB',
        accentText: '#2D6A4F',
    },
};

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const styles = VARIANT_STYLES[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in"
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E8ECF0',
                }}
            >
                {/* Icon */}
                <div
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: styles.accentLight, border: `1px solid ${styles.accentBorder}` }}
                >
                    {styles.icon}
                </div>

                {/* Title */}
                <h3
                    className="text-center text-lg font-bold mb-2"
                    style={{ color: '#1A2332' }}
                >
                    {title}
                </h3>

                {/* Message */}
                <p
                    className="text-center text-sm leading-relaxed mb-6"
                    style={{ color: '#5A6B7D' }}
                >
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-slate-100"
                        style={{
                            background: '#F7F5F0',
                            color: '#5A6B7D',
                            border: '1px solid #E8ECF0',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                        style={{
                            background: loading ? '#CBD5E1' : styles.confirmBg,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading && (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}


