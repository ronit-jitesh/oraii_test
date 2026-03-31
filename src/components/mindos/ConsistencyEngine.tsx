/**
 * MindOS — Inconsistency Fix System
 * /components/mindos/ConsistencyEngine.tsx
 *
 * RESEARCH BASIS:
 *  - Habit takes ~66 days to form
 *  - Temporal consistency (same time each day) is the #1 predictor of long-term retention
 *  - Sharp drop-off between day 1 and day 10
 *  - 64 days of data predicts full-year retention
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── COMEBACK RITUAL ────────────────────────────────────────────────────────

type ComebackRitualProps = {
  daysMissed: number;
  onDismiss: () => void;
  onStartMicro: () => void;
};

export function ComebackRitual({ daysMissed, onDismiss, onStartMicro }: ComebackRitualProps) {
  const messages: Record<number | "default", { title: string; sub: string; emoji: string }> = {
    1: { title: "Welcome back", sub: "One day off is fine. Your brain remembered everything.", emoji: "🌱" },
    2: { title: "Good to see you", sub: "Two days rest is actually beneficial. Ready to continue?", emoji: "🌿" },
    3: { title: "Hey, you came back", sub: "3 days away. Your brain was consolidating. Let's restart gently.", emoji: "🌳" },
    7: { title: "A week off", sub: "Life happens. No guilt, no pressure. A 90-second session is enough.", emoji: "🏔️" },
    default: { title: "You're back", sub: "No judgement. Every session counts. Start wherever feels right.", emoji: "✨" },
  };

  const msg = messages[daysMissed] || messages.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-3xl p-6 text-center"
      style={{ background: "linear-gradient(135deg, #0f0c29, #302b63)", color: "#fff" }}
    >
      <div className="text-4xl mb-3">{msg.emoji}</div>
      <div className="text-lg font-bold mb-1">{msg.title}</div>
      <div className="text-sm text-purple-200 mb-5 leading-relaxed">{msg.sub}</div>

      <div className="space-y-2">
        <button
          onClick={onStartMicro}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: "#5b21b6", color: "#fff" }}
        >
          Start 90-second session →
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2 rounded-xl font-medium text-sm text-purple-300"
        >
          I'll do a full session today
        </button>
      </div>
    </motion.div>
  );
}

// ── MICRO SESSION ──────────────────────────────────────────────────────────

type MicroSessionProps = {
  onComplete: () => void;
  onSkip?: () => void;
};

export function MicroSession({ onComplete, onSkip }: MicroSessionProps) {
  const [phase, setPhase] = useState<"countdown" | "breathing" | "done">("countdown");
  const [secs, setSecs] = useState(90);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");

  useEffect(() => {
    if (phase !== "breathing") return;
    const timer = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(timer); setPhase("done"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "breathing") return;
    const cycle = setInterval(() => {
      setBreathPhase(p => p === "inhale" ? "exhale" : "inhale");
    }, 4000);
    return () => clearInterval(cycle);
  }, [phase]);

  if (phase === "countdown") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl bg-white p-5 text-center"
        style={{ border: "1px solid #f0ede8" }}
      >
        <div className="text-3xl mb-2">🧘</div>
        <div className="text-base font-bold text-gray-900 mb-1">90-second brain reset</div>
        <div className="text-xs text-gray-500 mb-4">
          Sit comfortably. Eyes closed. Just breathe. That's it.
        </div>
        <button
          onClick={() => setPhase("breathing")}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: "#5b21b6" }}
        >
          Start →
        </button>
        {onSkip && (
          <button onClick={onSkip} className="text-xs text-gray-400 underline mt-3 block w-full">
            Skip today
          </button>
        )}
      </motion.div>
    );
  }

  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl bg-white p-5 text-center"
        style={{ border: "1px solid #f0ede8" }}
      >
        <div className="text-3xl mb-2">✅</div>
        <div className="text-base font-bold text-gray-900 mb-1">That counts.</div>
        <div className="text-xs text-gray-500 mb-4">
          You showed up. That's the whole game. +10 XP earned.
        </div>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: "#2D6A4F" }}
        >
          Continue my day →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 text-center" style={{ border: "1px solid #f0ede8" }}>
      <motion.div
        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
        style={{ background: "#ede9fe" }}
        animate={{ scale: breathPhase === "inhale" ? 1.15 : 0.9 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        <div className="text-purple-700 font-bold text-sm capitalize">{breathPhase}</div>
      </motion.div>
      <div className="text-2xl font-mono font-bold text-gray-900 mb-1">{secs}s</div>
      <div className="text-xs text-gray-400">remaining</div>
    </div>
  );
}

// ── STREAK FREEZE ──────────────────────────────────────────────────────────

type StreakFreezeCardProps = {
  freezesLeft: number;
  streak: number;
  onUseFreeze: () => void;
};

export function StreakFreezeCard({ freezesLeft, streak, onUseFreeze }: StreakFreezeCardProps) {
  return (
    <div className="rounded-2xl p-4"
         style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-amber-800">Protect your streak</div>
          <div className="text-xs text-amber-600">
            {freezesLeft} freeze{freezesLeft !== 1 ? "s" : ""} left this month
          </div>
        </div>
        <div className="text-2xl">🛡️</div>
      </div>
      <div className="text-xs text-amber-700 mb-3">
        You're on a {streak}-day streak. A freeze lets you skip one day without losing it.
      </div>
      <button
        onClick={onUseFreeze}
        disabled={freezesLeft === 0}
        className="w-full py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
        style={{ background: "#b45309", color: "#fff" }}
      >
        {freezesLeft > 0 ? "Use a freeze →" : "No freezes left this month"}
      </button>
    </div>
  );
}

// ── TIME ANCHOR PROMPT ─────────────────────────────────────────────────────

export function TimeAnchorPrompt({ onSet }: { onSet: (time: string) => void }) {
  const [selectedTime, setSelectedTime] = useState("07:00");

  const timeSlots = [
    { label: "Before waking up", time: "06:00", icon: "🌅" },
    { label: "After brushing teeth", time: "07:30", icon: "🪥" },
    { label: "Before lunch", time: "12:00", icon: "☀️" },
    { label: "After work", time: "17:30", icon: "🌆" },
    { label: "Before sleep", time: "21:30", icon: "🌙" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-5"
      style={{ border: "1.5px solid #c4b5fd" }}
    >
      <div className="text-xs font-semibold text-purple-600 mb-1">Day 3 — anchor your practice</div>
      <div className="text-sm font-bold text-gray-900 mb-1">When will you practice each day?</div>
      <div className="text-xs text-gray-500 mb-4">
        Research shows people who meditate at the same time daily are 3x more likely to still
        be practising at 6 months. Pick a trigger, not just a time.
      </div>

      <div className="space-y-2 mb-4">
        {timeSlots.map(slot => (
          <button
            key={slot.time}
            onClick={() => setSelectedTime(slot.time)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all"
            style={{
              background: selectedTime === slot.time ? "#ede9fe" : "#fafaf9",
              border: `1px solid ${selectedTime === slot.time ? "#c4b5fd" : "#f0ede8"}`,
              color: selectedTime === slot.time ? "#5b21b6" : "#374151",
              fontWeight: selectedTime === slot.time ? 600 : 400,
            }}
          >
            <span>{slot.icon}</span>
            <span>{slot.label}</span>
            <span className="ml-auto text-xs opacity-60">{slot.time}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onSet(selectedTime)}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white"
        style={{ background: "#5b21b6" }}
      >
        Set my daily anchor →
      </button>
    </motion.div>
  );
}

// ── 21-DAY SPRINT CARD ─────────────────────────────────────────────────────

export function SprintCard({ currentDay, completedDays = [] }: { currentDay: number; completedDays: number[] }) {
  const TOTAL = 21;
  const days = Array.from({ length: TOTAL }, (_, i) => i + 1);

  const getDayStatus = (day: number) => {
    if (day > currentDay) return "future";
    if (completedDays.includes(day)) return "done";
    if (day === currentDay) return "today";
    return "missed";
  };

  const dotColor: Record<string, string> = {
    done: "#2D6A4F",
    today: "#5b21b6",
    missed: "#fca5a5",
    future: "#f3f4f6",
  };

  const completed = completedDays.length;
  const pct = Math.round((completed / TOTAL) * 100);

  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-gray-900">21-day brain sprint</div>
          <div className="text-xs text-gray-400">{completed}/{TOTAL} days · {pct}% complete</div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full"
             style={{ background: "#ede9fe", color: "#5b21b6" }}>
          Day {currentDay}
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#5b21b6" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {days.map(day => {
          const status = getDayStatus(day);
          return (
            <motion.div
              key={day}
              className="rounded-full flex items-center justify-center text-xs"
              style={{
                width: 26, height: 26,
                background: dotColor[status],
                color: status === "done" || status === "today" ? "#fff" : "transparent",
                border: status === "today" ? "2px solid #5b21b6" : "none",
                fontSize: 10,
                fontWeight: 600,
              }}
              whileHover={{ scale: 1.1 }}
            >
              {status === "done" ? "✓" : status === "today" ? day : ""}
            </motion.div>
          );
        })}
      </div>

      {currentDay === 7 && (
        <div className="mt-3 text-xs text-green-700 font-medium">
          🎉 1 week done — your brain is physically changing
        </div>
      )}
      {currentDay === 14 && (
        <div className="mt-3 text-xs text-purple-700 font-medium">
          💪 2 weeks in — habit pathways are forming
        </div>
      )}
      {completed === TOTAL && (
        <div className="mt-3 text-xs text-amber-700 font-medium">
          🏆 Sprint complete — you built a real habit
        </div>
      )}
    </div>
  );
}

// ── BRAIN CIRCLE TEASER ────────────────────────────────────────────────────

export function BrainCircleTeaser({ currentDay, onJoin }: { currentDay: number; onJoin: () => void }) {
  const locked = currentDay < 7;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: locked ? "#fafaf9" : "linear-gradient(135deg, #0f0c29, #302b63)",
        border: locked ? "1px solid #f0ede8" : "none",
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{locked ? "🔒" : "🧬"}</div>
        <div>
          <div className="text-sm font-bold" style={{ color: locked ? "#9ca3af" : "#fff" }}>
            Brain circles
          </div>
          <div className="text-xs" style={{ color: locked ? "#d1d5db" : "rgba(200,180,255,0.7)" }}>
            {locked ? `Unlocks at Day 7 (${7 - currentDay} days away)` : "7-person accountability pods"}
          </div>
        </div>
      </div>
      {!locked && (
        <>
          <div className="text-xs text-purple-200 mb-3 leading-relaxed">
            Insight Timer's data shows community accountability drives 3x retention vs solo practice.
            Join a pod of 7 people at the same level as you.
          </div>
          <button
            onClick={onJoin}
            className="w-full py-2 rounded-xl text-xs font-semibold"
            style={{ background: "#5b21b6", color: "#fff" }}
          >
            Find my brain circle →
          </button>
        </>
      )}
    </div>
  );
}

// ── CONSISTENCY ENGINE (orchestrates all the above) ────────────────────────

type ConsistencyEngineProps = {
  streak: number;
  currentDay: number;
  completedDays: number[];
  daysMissed: number;
  freezesLeft: number;
  onFreezeUsed?: () => void;
  onTimeSet?: (time: string) => void;
  onMicroComplete?: () => void;
  onJoinCircle?: () => void;
};

export default function ConsistencyEngine({
  streak,
  currentDay,
  completedDays,
  daysMissed,
  freezesLeft,
  onFreezeUsed,
  onTimeSet,
  onMicroComplete,
  onJoinCircle,
}: ConsistencyEngineProps) {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [showMicro, setShowMicro] = useState(false);

  const dismiss = (key: string) => setDismissed(d => ({ ...d, [key]: true }));

  return (
    <div className="space-y-3">
      {/* Comeback ritual — if missed ≥1 day */}
      {daysMissed >= 1 && !dismissed.comeback && !showMicro && (
        <AnimatePresence>
          <ComebackRitual
            daysMissed={daysMissed}
            onDismiss={() => dismiss("comeback")}
            onStartMicro={() => { setShowMicro(true); dismiss("comeback"); }}
          />
        </AnimatePresence>
      )}

      {/* Micro session */}
      {showMicro && (
        <MicroSession
          onComplete={() => { setShowMicro(false); onMicroComplete?.(); }}
          onSkip={() => setShowMicro(false)}
        />
      )}

      {/* Streak freeze — show when streak ≥ 3 and there's risk of losing it */}
      {streak >= 3 && !dismissed.freeze && (
        <StreakFreezeCard
          streak={streak}
          freezesLeft={freezesLeft}
          onUseFreeze={() => { onFreezeUsed?.(); dismiss("freeze"); }}
        />
      )}

      {/* Time anchor prompt — Day 3 only */}
      {currentDay === 3 && !dismissed.timeAnchor && (
        <TimeAnchorPrompt
          onSet={(time) => { onTimeSet?.(time); dismiss("timeAnchor"); }}
        />
      )}

      {/* 21-day sprint */}
      <SprintCard
        currentDay={currentDay}
        completedDays={completedDays}
      />

      {/* Brain circle */}
      <BrainCircleTeaser
        currentDay={currentDay}
        onJoin={() => { onJoinCircle?.(); }}
      />
    </div>
  );
}
