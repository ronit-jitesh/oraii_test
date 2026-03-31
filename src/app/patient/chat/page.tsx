'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, AlertTriangle, Phone, Sparkles, Mic } from 'lucide-react';
import { getChatHistory, saveChatMessage } from '../actions';
import { useVoiceAssistant, VoiceMessage } from '@/hooks/useVoiceAssistant';
import { ORAIIVoiceOrb } from '@/components/ORAIIVoiceOrb';

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    flagged?: boolean;
    created_at?: string;
}

const SUGGESTIONS = [
    "I'm feeling anxious today",
    "Help me relax",
    "I want to talk about my goals",
    "I had a tough day",
    "Can you help me with a breathing exercise?",
];

const CRISIS_RESOURCES = [
    { name: 'Vandrevala Foundation', phone: '1860-2662-345' },
    { name: 'iCall (TISS)', phone: '9152987821' },
    { name: 'NIMHANS Helpline', phone: '080-46110007' },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showCrisis, setShowCrisis] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { voiceState, liveTranscript, toggle, stopListening, stopSpeaking, audioRef } = useVoiceAssistant();

    useEffect(() => {
        (async () => {
            const res = await getChatHistory();
            if (res.success && res.messages) {
                setMessages(res.messages.map((m: any) => ({
                    id: m.id, role: m.role, content: m.content,
                    flagged: m.flagged, created_at: m.created_at,
                })));
            }
            setInitialLoad(false);
        })();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);
        await saveChatMessage({ role: 'user', content: msg });
        try {
            const res = await fetch('/api/patient-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history: messages.slice(-20) }),
            });
            const data = await res.json();
            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble right now. Please try again." }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply, flagged: data.flagged }]);
                await saveChatMessage({ role: 'assistant', content: data.reply, flagged: data.flagged });
                if (data.flagged) setShowCrisis(true);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Couldn't connect. Please try again." }]);
        }
        setLoading(false);
    }, [input, loading, messages]);

    const handleVoiceMessage = useCallback((msg: VoiceMessage) => {
        setMessages(prev => [...prev, { role: msg.role, content: msg.content }]);
        saveChatMessage({ role: msg.role, content: msg.content });
    }, []);

    const handleVoiceFlagged = useCallback(() => setShowCrisis(true), []);

    const handleVoiceToggle = useCallback(() => {
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        toggle(history, handleVoiceMessage, handleVoiceFlagged);
    }, [messages, toggle, handleVoiceMessage, handleVoiceFlagged]);

    const handleOpenVoiceMode = () => setVoiceMode(true);
    const handleCloseVoiceMode = () => {
        setVoiceMode(false);
        stopListening();
        stopSpeaking();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">

            {/* ── ORAII Voice Orb Overlay ── */}
            {voiceMode && (
                <ORAIIVoiceOrb
                    voiceState={voiceState}
                    liveTranscript={liveTranscript}
                    onToggle={handleVoiceToggle}
                    onClose={handleCloseVoiceMode}
                    audioElement={audioRef?.current}
                />
            )}

            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center gap-3"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}>
                    <Bot size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="font-bold text-base flex items-center gap-2"
                        style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                        ORAII
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                            o·rah·eee
                        </span>
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Your empathetic AI mental health companion
                    </p>
                </div>
                {/* Voice mode button in header */}
                <button
                    onClick={handleOpenVoiceMode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                    title="Talk to ORAII"
                >
                    <Mic size={14} />
                    Talk
                </button>
            </div>

            {/* Crisis Banner */}
            {showCrisis && (
                <div className="px-4 py-3 flex items-start gap-3"
                    style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-red-700 mb-1">If you're in crisis, please reach out:</p>
                        <div className="flex flex-wrap gap-3">
                            {CRISIS_RESOURCES.map(r => (
                                <a key={r.phone} href={`tel:${r.phone}`}
                                    className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                                    <Phone size={10} /> {r.name}: {r.phone}
                                </a>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setShowCrisis(false)} className="text-red-400 text-xs font-bold">×</button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
                style={{ background: 'var(--color-bg)' }}>
                {initialLoad && (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                    </div>
                )}

                {!initialLoad && messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'var(--color-primary-light)' }}>
                            <Sparkles size={32} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h2 className="font-bold text-xl mb-1"
                            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                            Hi, I'm ORAII
                        </h2>
                        <p className="text-xs mb-1" style={{ color: 'var(--color-primary)' }}>
                            pronounced o·rah·eee
                        </p>
                        <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--color-text-muted)' }}>
                            I'm here to listen and support you. Type below or tap <strong>Talk</strong> to speak with me.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {SUGGESTIONS.map(s => (
                                <button key={s} onClick={() => sendMessage(s)}
                                    className="px-4 py-2 rounded-full text-xs font-medium border transition-all hover:-translate-y-0.5"
                                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
                                style={{ background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-primary-light)' }}>
                                {msg.role === 'user'
                                    ? <User size={14} className="text-white" />
                                    : <Bot size={14} style={{ color: 'var(--color-primary)' }} />
                                }
                            </div>
                            <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                                style={{
                                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                }}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--color-primary-light)' }}>
                                <Bot size={14} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div className="px-4 py-3 rounded-2xl border"
                                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm"
                        style={{
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            maxHeight: '120px',
                        }}
                    />
                    {/* Mic button */}
                    <button
                        onClick={handleOpenVoiceMode}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: 'var(--color-primary)' }}
                        title="Talk to ORAII"
                    >
                        <Mic size={16} className="text-white" />
                    </button>
                    {/* Send button */}
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{
                            background: input.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                            cursor: input.trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <Send size={16} className="text-white" />
                    </button>
                </div>
                <p className="text-center text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    ORAII is an AI companion, not a therapist. In crisis, call Vandrevala Foundation: 1860-2662-345
                </p>
            </div>
        </div>
    );
}
