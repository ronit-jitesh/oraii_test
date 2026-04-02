// MindOS — Brainwave Gamification Page
// ORAII Patient Portal: /patient/mind-os
// v3 — BUG FIXES:
//   1. Check-in state persisted via DailyState (resets at LOCAL midnight, not page reload)
//   2. Journal now actually calls saveJournalEntry() — previously only awarded XP
//   3. XP state update now always fires (removed broken p.added guard)
//   4. Daily reset uses local timezone, not UTC

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SessionModal from "@/components/mindos/SessionModal";
import ConsistencyEngine from "@/components/mindos/ConsistencyEngine";
import {
  loadProgress,
  addXP,
  loadDailyState,
  saveDailyState,
  saveJournalEntry,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/mindos-data";

// ─── DATA ───────────────────────────────────────────────────────────────────

interface Wave {
  id: string;
  name: string;
  hz: string;
  emoji: string;
  color: string;
  light: string;
  tag: string;
  desc: string;
  locked: boolean;
  xp: number;
}

interface Level {
  id: number;
  name: string;
  minXP: number;
  color: string;
}

interface Session {
  id: string;
  wave: string;
  title: string;
  duration: string;
  desc: string;
  xp: number;
  type: string;
  locked?: boolean;
}

const WAVES: Wave[] = [
  {
    id: "delta",
    name: "Delta",
    hz: "0.5–4 Hz",
    emoji: "🌑",
    color: "#1e3a5f",
    light: "#dbeafe",
    tag: "Deep sleep · Restoration",
    desc: "Your body repairs itself. Growth hormone peaks. Memory consolidates.",
    locked: false,
    xp: 0,
  },
  {
    id: "theta",
    name: "Theta",
    hz: "4–7 Hz",
    emoji: "🌒",
    color: "#2D6A4F",
    light: "#d1fae5",
    tag: "Creativity · Intuition",
    desc: "The gateway state. Visualisation, subconscious reprogramming, deep meditation.",
    locked: false,
    xp: 150,
  },
  {
    id: "alpha",
    name: "Alpha",
    hz: "8–12 Hz",
    emoji: "🌓",
    color: "#5b21b6",
    light: "#ede9fe",
    tag: "Calm focus · Flow entry",
    desc: "Relaxed awareness. The bridge between conscious and subconscious mind.",
    locked: false,
    xp: 300,
  },
  {
    id: "beta",
    name: "Beta",
    hz: "13–30 Hz",
    emoji: "🌔",
    color: "#b45309",
    light: "#fef3c7",
    tag: "Active thinking · Problem solving",
    desc: "Sharp, analytical mind. Peak for learning, decisions, and execution.",
    locked: true,
    xp: 600,
  },
  {
    id: "gamma",
    name: "Gamma",
    hz: "30–100 Hz",
    emoji: "🌕",
    color: "#be185d",
    light: "#fce7f3",
    tag: "Peak cognition · Insight",
    desc: "The Limitless state. Experienced meditators, peak performers, flow states.",
    locked: true,
    xp: 1200,
  },
];

const LEVELS: Level[] = [
  { id: 1, name: "Static", minXP: 0, color: "#6b7280" },
  { id: 2, name: "Wandering", minXP: 100, color: "#2D6A4F" },
  { id: 3, name: "Aware", minXP: 300, color: "#5b21b6" },
  { id: 4, name: "Focused", minXP: 600, color: "#1d4ed8" },
  { id: 5, name: "In Flow", minXP: 1000, color: "#be185d" },
  { id: 6, name: "Limitless", minXP: 1500, color: "#b45309" },
];

const SESSIONS: Session[] = [
  {
    id: "morning-boot",
    wave: "alpha",
    title: "Morning Brain Boot",
    duration: "5 min",
    desc: "Alpha binaural beats + MOVERS breathwork to shift from delta to alpha",
    xp: 25,
    type: "binaural",
  },
  {
    id: "theta-dream",
    wave: "theta",
    title: "Theta Dream Gate",
    duration: "10 min",
    desc: "Drop into theta for creative visualisation and subconscious reprogramming",
    xp: 40,
    type: "meditation",
  },
  {
    id: "beta-laser",
    wave: "beta",
    title: "Beta Laser Focus",
    duration: "25 min",
    desc: "Mid-beta binaural beats for deep work. Pomodoro-compatible.",
    xp: 50,
    type: "binaural",
    locked: true,
  },
  {
    id: "tratak",
    wave: "gamma",
    title: "Tratak Gamma Surge",
    duration: "5 min",
    desc: "Candle/yantra gazing — Dr. Adatia's technique for gamma induction",
    xp: 60,
    type: "exercise",
    locked: true,
  },
  {
    id: "brahmari",
    wave: "gamma",
    title: "Brahmari Resonance",
    duration: "3 min",
    desc: "Humming bee breathwork — produces paroxysmal gamma according to research",
    xp: 35,
    type: "breathwork",
  },
  {
    id: "theta-journal",
    wave: "theta",
    title: "Subconscious Journal",
    duration: "7 min",
    desc: "Theta-state journaling using guided prompts to access deep insight",
    xp: 30,
    type: "journal",
  },
];

const CHECKIN_QUESTIONS = [
  {
    id: "energy",
    q: "How is your mental energy right now?",
    options: ["Foggy 😶‍🌫️", "Low 😴", "OK 😐", "Sharp ⚡", "Wired 🔥"],
  },
  {
    id: "state",
    q: "Which brainwave feels dominant?",
    options: ["Deep/dreamy", "Creative/calm", "Relaxed/open", "Alert/thinking", "Racing/anxious"],
  },
  {
    id: "intention",
    q: "What does your brain need today?",
    options: ["Rest", "Creativity", "Focus", "Calm", "Energy"],
  },
];

const JOURNAL_PROMPTS = [
  "What did your brain do differently today that you want to remember?",
  "If your mind were a landscape right now, what would it look like?",
  "One belief you want to rewrite in your subconscious:",
  "The best version of your brain does what in the morning?",
  "What would you create if you had unlimited mental clarity?",
  "A pattern you noticed in your thoughts today:",
  "Your brain's superpower that you haven't fully used yet:",
];

// ─── ANIMATED ORBS ────────────────────────────────────────────────────────

function BrainOrb({ wave, size = 120, animate = true, onClick }: { wave: string; size?: number; animate?: boolean; onClick?: () => void }) {
  const colors: Record<string, string[]> = {
    delta: ["#1e3a5f", "#2563eb", "#1e40af"],
    theta: ["#065f46", "#2D6A4F", "#059669"],
    alpha: ["#4c1d95", "#5b21b6", "#7c3aed"],
    beta: ["#78350f", "#b45309", "#d97706"],
    gamma: ["#831843", "#be185d", "#ec4899"],
  };
  const c = colors[wave] || colors.alpha;

  return (
    <div onClick={onClick} className="relative cursor-pointer" style={{ width: size, height: size }}>
      {animate && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: c[0], opacity: 0.2 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {animate && (
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ background: c[1], opacity: 0.3 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      )}
      <motion.div
        className="absolute inset-4 rounded-full flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 35% 35%, ${c[2]}, ${c[0]})` }}
        animate={animate ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-white text-xs font-semibold text-center leading-tight px-1">
          {WAVES.find((w) => w.id === wave)?.name}
        </div>
      </motion.div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120" style={{ opacity: 0.4 }}>
        {[20, 30, 40].map((r, i) => (
          <motion.circle
            key={i} cx="60" cy="60" r={r} fill="none" stroke="white" strokeWidth="0.5"
            animate={{ opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── XP BAR ──────────────────────────────────────────────────────────────

function XPBar({ xp }: { xp: number }) {
  const nextLevel = LEVELS.find((l) => l.minXP > xp);
  const currentLevel = LEVELS.filter((l) => l.minXP <= xp).pop();
  const progress = nextLevel && currentLevel
    ? ((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold" style={{ color: currentLevel?.color }}>
          {currentLevel?.name}
        </span>
        <span className="text-xs text-gray-500">
          {xp} / {nextLevel?.minXP ?? "MAX"} XP
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: currentLevel?.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── STREAK BADGE ─────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  return (
    <motion.div
      className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ background: "#fef3c7", color: "#b45309" }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
        🔥
      </motion.span>
      {streak} day streak
    </motion.div>
  );
}

// ─── SESSION CARD ─────────────────────────────────────────────────────────

function SessionCard({ session, onStart }: { session: Session; onStart: (s: Session) => void }) {
  const wave = WAVES.find((w) => w.id === session.wave) || WAVES[2];
  return (
    <motion.div
      whileHover={session.locked ? {} : { y: -3, scale: 1.01 }}
      whileTap={session.locked ? {} : { scale: 0.98 }}
      className="relative rounded-2xl p-4 cursor-pointer overflow-hidden"
      style={{
        background: session.locked ? "#f9fafb" : wave.light,
        border: `1px solid ${session.locked ? "#e5e7eb" : wave.color + "40"}`,
        opacity: session.locked ? 0.7 : 1,
      }}
      onClick={() => !session.locked && onStart(session)}
    >
      {session.locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs text-gray-500 font-medium">
              Reach {WAVES.find((w) => w.id === session.wave)?.name} level to unlock
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: wave.color + "20", color: wave.color }}>
          {session.type}
        </div>
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: wave.color }}>
          +{session.xp} XP
        </div>
      </div>
      <div className="font-semibold text-gray-900 text-sm mb-1">{session.title}</div>
      <div className="text-xs text-gray-500 mb-3 leading-relaxed">{session.desc}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">⏱ {session.duration}</span>
        <div className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: wave.color, color: "white" }}>
          Start →
        </div>
      </div>
    </motion.div>
  );
}

// ─── JOURNAL PANEL (inline on Today tab) ─────────────────────────────────
// BUG FIX 3: Now calls saveJournalEntry() from persistence layer.
// Previously this only called onSave (which just awarded XP) — nothing was saved.

function JournalPanel({ onSave }: { onSave: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setText(draft);
  }, []);

  // Auto-save draft as user types
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveDraft(text), 800);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [text]);

  const handleSave = async () => {
    if (!text.trim() || saveState === "saving") return;
    setSaveState("saving");
    try {
      await onSave(text);
      clearDraft();
      setText("");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#ede9fe" }}>
        <span className="text-purple-600 mt-0.5">💡</span>
        <div>
          <div className="text-xs font-semibold text-purple-700 mb-0.5">Today&apos;s theta prompt</div>
          <div className="text-xs text-purple-600 italic">&quot;{prompt}&quot;</div>
        </div>
      </div>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write freely. No rules. Your subconscious is talking..."
          className="w-full h-28 p-3 text-sm rounded-xl border border-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
          style={{ background: "#fafaf9", fontFamily: "inherit" }}
        />
        {text.length > 10 && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-300">draft saved</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)])}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          New prompt
        </button>
        <div className="flex-1" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!text.trim() || saveState === "saving"}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
          style={{
            background: saveState === "saved" ? "#2D6A4F"
              : saveState === "error" ? "#be185d"
              : "#5b21b6",
          }}
        >
          {saveState === "saving" ? "Saving..." :
           saveState === "saved" ? "✓ Saved! +15 XP" :
           saveState === "error" ? "Failed — try again" :
           "Save entry →"}
        </motion.button>
      </div>
    </div>
  );
}

// ─── CHECK-IN PANEL ───────────────────────────────────────────────────────

function CheckInPanel({ onComplete }: { onComplete: (answers: Record<string, string>) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (qid: string, answer: string) => {
    const next = { ...answers, [qid]: answer };
    setAnswers(next);
    if (step < CHECKIN_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(next);
    }
  };

  const q = CHECKIN_QUESTIONS[step];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 mb-2">
        {CHECKIN_QUESTIONS.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= step ? "#5b21b6" : "#e5e7eb" }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
        >
          <div className="text-sm font-semibold text-gray-800 mb-3">{q.q}</div>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <motion.button
                key={opt}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(q.id, opt)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────

export default function MindOSPage() {
  const [tab, setTab] = useState("today");
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedWave, setSelectedWave] = useState("alpha");
  const [notification, setNotification] = useState<string | null>(null);
  const [dailyXP, setDailyXP] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // BUG FIX 1: daily state persisted — survives refresh, resets at local midnight
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinAnswers, setCheckinAnswers] = useState<Record<string, string> | null>(null);
  const [journalDone, setJournalDone] = useState(false);

  // Load XP + daily state on mount
  useEffect(() => {
    // Load XP/streak from persistence
    loadProgress().then((p) => {
      setXP(p.xp);
      setStreak(p.streak);
      setDailyXP(p.daily_xp_today);
      setLoadingProgress(false);
    });

    // BUG FIX 1: Load daily state (resets if new local day)
    const daily = loadDailyState();
    setCheckedIn(daily.checkedIn);
    setCheckinAnswers(daily.checkinAnswers);
    setJournalDone(daily.journalDone);
  }, []);

  const currentLevel = LEVELS.filter((l) => l.minXP <= xp).pop();

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // BUG FIX 2: XP update no longer gated on p.added being truthy
  // We always update local UI state with the returned values
  const applyXPResult = (p: Awaited<ReturnType<typeof addXP>>) => {
    setXP(p.xp);
    setStreak(p.streak);
    setDailyXP(p.daily_xp_today);
  };

  const handleCheckinComplete = async (answers: Record<string, string>) => {
    // BUG FIX 1: persist check-in state so it survives refresh
    setCheckedIn(true);
    setCheckinAnswers(answers);
    saveDailyState({ checkedIn: true, checkinAnswers: answers });

    const p = await addXP(10);
    applyXPResult(p);
    showNotif(p.added > 0 ? "+10 XP — Brain check-in complete! 🧠" : "Daily XP cap reached 🧠");
  };

  const handleSessionComplete = async (xpEarned: number) => {
    const s = activeSession;
    if (!s) return;
    const p = await addXP(xpEarned);
    applyXPResult(p);
    setActiveSession(null);
    showNotif(`+${p.added} XP — "${s.title}" complete! ✨`);
  };

  // BUG FIX 3: Journal now saves to persistence, not just awards XP
  const handleJournalSave = async (text: string) => {
    const result = await saveJournalEntry({
      content: text,
      prompt: undefined,
      wave: "alpha",
      moodState: checkinAnswers?.state || null,
    });

    if (!result.ok) throw new Error(result.error || "Save failed");

    // Award XP
    const p = await addXP(15);
    applyXPResult(p);

    // Mark journal done for today (persists across refreshes)
    setJournalDone(true);
    saveDailyState({ journalDone: true });

    showNotif(p.added > 0 ? `+${p.added} XP — Journal saved! 📓` : "Journal saved! 📓");
  };

  const tabs = [
    { id: "today", label: "Today" },
    { id: "sessions", label: "Sessions" },
    { id: "waves", label: "Brain Waves" },
    { id: "journal", label: "Journal" },
    { id: "progress", label: "Progress" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white"
            style={{ background: "#2D6A4F" }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session modal */}
      <AnimatePresence>
        {activeSession && (
          <SessionModal
            session={activeSession}
            currentDailyXP={dailyXP}
            onComplete={handleSessionComplete}
            onClose={() => setActiveSession(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: "white", borderBottom: "1px solid #f0f0f0" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">MindOS</div>
              <div className="text-lg font-bold text-gray-900">Unlock Your Brain</div>
            </div>
            <div className="flex items-center gap-3">
              <StreakBadge streak={streak} />
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold" style={{ background: "#ede9fe", color: "#5b21b6" }}>
                <span>⚡</span> {xp}
              </div>
            </div>
          </div>
          <XPBar xp={xp} />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4">
        <div className="max-w-lg mx-auto flex gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap relative"
              style={{ color: tab === t.id ? "#5b21b6" : "#9ca3af" }}
            >
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "#5b21b6" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <AnimatePresence mode="wait">

          {/* ── TODAY TAB ── */}
          {tab === "today" && (
            <motion.div key="today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

              {/* Brain orb hero */}
              <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)" }}>
                <div className="flex justify-center mb-3">
                  <BrainOrb wave={selectedWave} size={140} animate />
                </div>
                <div className="text-white font-bold text-lg mb-1">
                  {WAVES.find((w) => w.id === selectedWave)?.name} State
                </div>
                <div className="text-purple-200 text-sm mb-1">
                  {WAVES.find((w) => w.id === selectedWave)?.hz}
                </div>
                <div className="text-purple-300 text-xs">
                  {WAVES.find((w) => w.id === selectedWave)?.tag}
                </div>
              </div>

              {/* Daily checklist — shows real persisted state, NOT re-fillable */}
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <div className="text-sm font-bold text-gray-800 mb-1">Today&apos;s brain practice</div>
                <div className="text-xs text-gray-400 mb-3">Resets at midnight · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
                <div className="space-y-2">
                  {[
                    { label: "Brain check-in", xp: 10, done: checkedIn, emoji: "🧠" },
                    { label: "Guided session", xp: 25, done: false, emoji: "🎧" },
                    { label: "Brain journal", xp: 15, done: journalDone, emoji: "📓" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-2 rounded-xl"
                      style={{ background: item.done ? "#f0fdf4" : "#fafaf9" }}
                    >
                      <div className="text-lg">{item.done ? "✅" : item.emoji}</div>
                      <div className="flex-1">
                        {item.label === "Brain journal" ? (
                          <Link href="/patient/mind-os/journal" className="text-sm font-medium text-gray-700 underline hover:text-purple-600 block">
                            {item.label}
                          </Link>
                        ) : (
                          <div className="text-sm font-medium text-gray-700">{item.label}</div>
                        )}
                      </div>
                      <div className="text-xs font-bold" style={{ color: item.done ? "#2D6A4F" : "#9ca3af" }}>
                        {item.done ? "done" : `+${item.xp} XP`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consistency engine */}
              {!loadingProgress && (
                <ConsistencyEngine
                  streak={streak}
                  currentDay={1}
                  completedDays={[]}
                  daysMissed={0}
                  freezesLeft={3}
                  onMicroComplete={() => handleSessionComplete(10)}
                />
              )}

              {/* Check-in or AI recommendation */}
              {!checkedIn ? (
                <div className="rounded-2xl bg-white p-4 border border-gray-100">
                  <div className="text-sm font-bold text-gray-800 mb-3">Daily brain check-in</div>
                  <CheckInPanel onComplete={handleCheckinComplete} />
                </div>
              ) : (
                <div className="rounded-2xl p-4" style={{ background: "#ede9fe", border: "1px solid #c4b5fd" }}>
                  <div className="text-xs font-semibold text-purple-700 mb-1">Your AI brain coach says:</div>
                  <div className="text-sm text-purple-800">
                    Based on your check-in, your brain is in a <strong>{checkinAnswers?.state || "transitional"}</strong> state.
                    Best session for you right now: <strong>Morning Brain Boot</strong> to enter alpha flow.
                  </div>
                </div>
              )}

              {/* Quick session */}
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <div className="text-sm font-bold text-gray-800 mb-3">Quick session</div>
                <SessionCard session={SESSIONS[0]} onStart={setActiveSession} />
              </div>
            </motion.div>
          )}

          {/* ── SESSIONS TAB ── */}
          {tab === "sessions" && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="text-xs text-gray-400 pt-2">All brain sessions — unlock more as you level up</div>
              {SESSIONS.map((s) => (
                <SessionCard key={s.id} session={s} onStart={setActiveSession} />
              ))}
            </motion.div>
          )}

          {/* ── WAVES TAB ── */}
          {tab === "waves" && (
            <motion.div key="waves" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="text-xs text-gray-400 pt-2">Tap a wave to learn and practice</div>
              {WAVES.map((wave) => {
                const isLocked = wave.locked && xp < wave.xp;
                return (
                  <motion.div
                    key={wave.id}
                    whileHover={isLocked ? {} : { scale: 1.01 }}
                    onClick={() => !isLocked && setSelectedWave(wave.id)}
                    className="rounded-2xl p-4 cursor-pointer"
                    style={{
                      background: isLocked ? "#f9fafb" : wave.light,
                      border: `1px solid ${isLocked ? "#e5e7eb" : wave.color + "50"}`,
                      opacity: isLocked ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <BrainOrb wave={wave.id} size={64} animate={!isLocked} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-gray-900">{wave.name}</div>
                          <div className="text-xs font-mono text-gray-400">{wave.hz}</div>
                          {isLocked && <span className="text-xs">🔒</span>}
                        </div>
                        <div className="text-xs font-semibold mb-1 px-2 py-0.5 rounded-full inline-block" style={{ background: wave.color + "20", color: wave.color }}>
                          {wave.tag}
                        </div>
                        <div className="text-xs text-gray-500 leading-relaxed">{wave.desc}</div>
                        {isLocked && (
                          <div className="text-xs text-gray-400 mt-1">Unlock at {wave.xp} XP (you have {xp})</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── JOURNAL TAB ── */}
          {tab === "journal" && (
            <motion.div key="journal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pt-2">
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📓</span>
                  <div>
                    <div className="text-sm font-bold text-gray-800">Brain Journal</div>
                    <div className="text-xs text-gray-400">Write in theta state for deepest insight</div>
                  </div>
                </div>
                <JournalPanel onSave={handleJournalSave} />
              </div>

              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="text-xs font-semibold text-green-700 mb-2">Why journal in theta state?</div>
                <div className="text-xs text-green-800 leading-relaxed">
                  The first 10 minutes after waking (and after meditation) your brain is in theta —
                  the subconscious is most accessible. Writing in this state can surface beliefs,
                  patterns, and insights you can&apos;t access during alert beta. Dr. Adatia calls this
                  &quot;conscious rewiring.&quot;
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <div className="text-sm font-bold text-gray-800 mb-3">Past entries</div>
                {journalDone ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50">
                    <span className="text-green-600">✓</span>
                    <div className="text-xs text-green-700 font-medium">Today&apos;s entry saved</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No entries yet. Complete your first journal above.</div>
                )}
                <div className="mt-3">
                  <Link href="/patient/mind-os/journal" className="text-xs text-purple-600 hover:text-purple-800 underline">
                    View all past entries →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PROGRESS TAB ── */}
          {tab === "progress" && (
            <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pt-2">
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <div className="text-sm font-bold text-gray-800 mb-4">Brain level progression</div>
                <div className="space-y-3">
                  {LEVELS.map((level) => {
                    const isReached = xp >= level.minXP;
                    const isCurrent = currentLevel?.id === level.id;
                    return (
                      <div key={level.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: isReached ? level.color : "#f3f4f6", color: isReached ? "white" : "#9ca3af" }}
                        >
                          {isReached ? "✓" : level.id}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: isReached ? level.color : "#d1d5db" }}>
                              {level.name}
                            </span>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: level.color + "20", color: level.color }}>
                                current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{level.minXP} XP required</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total XP", value: xp, icon: "⚡" },
                  { label: "Streak", value: `${streak}d`, icon: "🔥" },
                  { label: "Daily XP", value: `${dailyXP}/150`, icon: "📊" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ background: "white", border: "1px solid #f0f0f0" }}>
                    <div className="text-lg mb-1">{stat.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-4" style={{ background: "#1a1a2e", color: "white" }}>
                <div className="text-xs font-semibold text-purple-300 mb-2">AI Brain Report — Week 1</div>
                <div className="text-sm leading-relaxed text-gray-300">
                  You spent most time in <strong className="text-white">alpha</strong> state this week.
                  Your theta sessions are getting longer — a sign your mind is opening.
                  Next goal: achieve one <strong className="text-white">30-minute theta session</strong> to unlock the Aware badge.
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#2D6A4F" }}>Alpha explorer 🌿</div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#2d1b69" }}>7-day warrior 🔥</div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-center">
        <div className="text-xs text-gray-400">MindOS · part of ORAII patient portal</div>
      </div>
    </div>
  );
}
