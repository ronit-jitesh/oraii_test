'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300); // wait for exit animation
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
        >
            <div className="flex items-center gap-3 bg-white border border-emerald-200 shadow-xl shadow-emerald-100/50 rounded-xl px-5 py-4 max-w-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <p className="text-sm text-gray-700 font-medium flex-1">{message}</p>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
