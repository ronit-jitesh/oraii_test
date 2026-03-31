'use client';

import React, { useState } from 'react';
import { Receipt, IndianRupee, CreditCard, Banknote, Smartphone, Check, Download, Printer } from 'lucide-react';

interface SessionReceiptGeneratorProps {
    patientId: string;
    patientName: string;
    sessionId?: string;
    sessionDate?: string;
    durationMinutes?: number;
    onSave?: (receipt: ReceiptData) => void;
}

interface ReceiptData {
    sessionDate: string;
    durationMinutes: number;
    feeAmount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    receiptNumber: string;
    therapistName: string;
    notes: string;
}

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Cash', icon: Banknote },
    { key: 'upi', label: 'UPI', icon: Smartphone },
    { key: 'card', label: 'Card', icon: CreditCard },
    { key: 'bank_transfer', label: 'Bank Transfer', icon: IndianRupee },
    { key: 'online', label: 'Online', icon: IndianRupee },
];

const COMMON_FEES = [500, 800, 1000, 1500, 2000, 2500, 3000, 5000];

export default function SessionReceiptGenerator({
    patientId,
    patientName,
    sessionId,
    sessionDate,
    durationMinutes = 45,
    onSave,
}: SessionReceiptGeneratorProps) {
    const [feeAmount, setFeeAmount] = useState<number>(1500);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const [duration, setDuration] = useState(durationMinutes);
    const [therapistName, setTherapistName] = useState('');
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const receiptNumber = `ORAII-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const receiptDate = sessionDate || new Date().toISOString().split('T')[0];

    const handleSave = async () => {
        setSaving(true);
        const receipt: ReceiptData = {
            sessionDate: receiptDate,
            durationMinutes: duration,
            feeAmount,
            currency: 'INR',
            paymentMethod,
            paymentStatus,
            receiptNumber,
            therapistName,
            notes,
        };
        if (onSave) {
            await onSave(receipt);
        }
        setSaved(true);
        setSaving(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)', borderBottom: '2px solid #FED7AA' }}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: '#EA580C20' }}>
                        <Receipt size={22} className="text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Session Receipt</h3>
                        <p className="text-xs text-gray-500">{patientName} â€” {receiptDate}</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: '#EA580C15', color: '#EA580C' }}>
                    â‚¹ INR
                </span>
            </div>

            <div className="p-6 space-y-5">
                {/* Fee Amount */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Session Fee (â‚¹)</label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">â‚¹</span>
                            <input
                                type="number"
                                value={feeAmount}
                                onChange={(e) => setFeeAmount(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {COMMON_FEES.map((fee) => (
                            <button
                                key={fee}
                                onClick={() => setFeeAmount(fee)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${feeAmount === fee ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
                            >
                                â‚¹{fee.toLocaleString('en-IN')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Duration (minutes)</label>
                    <div className="flex gap-2">
                        {[30, 45, 60, 90].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${duration === d ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
                            >
                                {d} min
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Payment Method</label>
                    <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isActive = paymentMethod === method.key;
                            return (
                                <button
                                    key={method.key}
                                    onClick={() => setPaymentMethod(method.key)}
                                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
                                >
                                    <Icon size={14} />
                                    {method.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Status */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Status</label>
                    <div className="flex gap-2">
                        {['paid', 'pending', 'waived'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setPaymentStatus(s)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${paymentStatus === s ? (s === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : s === 'waived' ? 'bg-gray-100 text-gray-600 border border-gray-300' : 'bg-amber-100 text-amber-700 border border-amber-300') : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none h-16"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    {saved ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                            <Check size={18} />
                            Receipt saved â€” #{receiptNumber}
                        </div>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving || feeAmount <= 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                            <Receipt size={16} />
                            {saving ? 'Saving...' : 'Save Receipt'}
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 transition-all"
                    >
                        <Printer size={14} />
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}
