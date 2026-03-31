/**
 * MindOS — Upgraded Session Modal
 * /components/mindos/SessionModal.tsx
 *
 * FIXES vs v1:
 *   - XP per session max ~60 XP, daily cap 150 XP
 *   - Tibetan bell start + end (via audio engine)
 *   - Soundscape picker (waterfall / rain / ocean / forest / stream / fire / none)
 *   - Optional guided breathing voice (opt-in toggle)
 *   - Eyes-closed safe: all audio cues, no need to look at screen
 *   - Animated breathing ring synced to actual breath cadence
 *   - Volume slider
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MindOSAudio from "@/lib/mindos-audio-engine";

// ── TYPES ──────────────────────────────────────────────────────────────────

interface SessionData {
  id: string;
  wave: string;
  title: string;
  duration: string;
  desc: string;
  xp: number;
  type: string;
  locked?: boolean;
}

interface SessionModalProps {
  session: SessionData;
  currentDailyXP?: number;
  onComplete: (xpEarned: number) => void;
  onClose: () => void;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const SOUNDSCAPES = [
  { id: "waterfall", label: "Waterfall", icon: "🏔️", science: "Brown noise — deepest relaxation, alpha induction" },
  { id: "ocean",     label: "Ocean",     icon: "🌊", science: "8-sec swell matches alpha rhythm — parasympathetic" },
  { id: "rain",      label: "Rain",      icon: "🌧️", science: "Pink noise — problem solving, sleep preparation" },
  { id: "forest",    label: "Forest",    icon: "🌲", science: "Birdsong — best for stress + anxiety relief" },
  { id: "stream",    label: "Stream",    icon: "🏞️", science: "Running water — creativity, calm focus" },
  { id: "fire",      label: "Fire",      icon: "🔥", science: "Hearth crackle — warmth, safety, grounding" },
  { id: "none",      label: "Silence",   icon: "🤫", science: "Pure silence for advanced meditators" },
];

const BREATH_PATTERNS: Record<string, { inhale: number; hold: number; exhale: number; label: string }> = {
  delta:  { inhale: 4, hold: 7, exhale: 8, label: "4-7-8 (deep relaxation)" },
  theta:  { inhale: 4, hold: 4, exhale: 4, label: "Box breathing" },
  alpha:  { inhale: 4, hold: 4, exhale: 6, label: "Extended exhale" },
  beta:   { inhale: 4, hold: 2, exhale: 4, label: "Alert breathing" },
  gamma:  { inhale: 4, hold: 0, exhale: 4, label: "Continuous flow" },
};

const WAVE_COLORS: Record<string, string> = {
  delta: "#1e3a5f",
  theta: "#065f46",
  alpha: "#5b21b6",
  beta:  "#b45309",
  gamma: "#be185d",
};

const DAILY_XP_CAP = 150;

// ── SESSION MODAL COMPONENT ────────────────────────────────────────────────

export default function SessionModal({ session, currentDailyXP = 0, onComplete, onClose }: SessionModalProps) {
  const [phase, setPhase] = useState<"setup" | "active" | "complete">("setup");
  const [soundscape, setSoundscape] = useState("waterfall");
  const [breathingGuide, setBreathingGuide] = useState(false);
  const [binauralEnabled, setBinauralEnabled] = useState(true);
  const [volume, setVolume] = useState(70);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [breathProgress, setBreathProgress] = useState(0);

  const audioRef = useRef<MindOSAudio | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wave = session.wave || "alpha";
  const color = WAVE_COLORS[wave] || "#5b21b6";
  const durationSecs = parseInt(session.duration) * 60;
  const bp = BREATH_PATTERNS[wave] || BREATH_PATTERNS.alpha;

  // Calculate actual XP after daily cap
  const rawXP = session.xp;
  const remainingCap = Math.max(0, DAILY_XP_CAP - currentDailyXP);
  const earnedXP = Math.min(rawXP, remainingCap);

  // ── START SESSION ────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    setPhase("active");

    audioRef.current = new MindOSAudio();
    await audioRef.current.init();
    audioRef.current.setVolume(volume / 100);

    audioRef.current.startSession({
      wave,
      durationSecs,
      soundscape,
      binauralEnabled,
      breathingGuide,
      onTick: (remaining: number) => setSecondsElapsed(durationSecs - remaining),
      onComplete: () => {
        setPhase("complete");
        cleanupAudio();
      },
    });

    startBreathAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wave, durationSecs, soundscape, binauralEnabled, breathingGuide, volume]);

  // ── BREATH ANIMATION ─────────────────────────────────────────────────────

  const startBreathAnimation = useCallback(() => {
    const total = bp.inhale + bp.hold + bp.exhale;
    let elapsed = 0;

    const tick = () => {
      elapsed += 0.05;
      if (elapsed >= total) elapsed = 0;

      if (elapsed < bp.inhale) {
        setBreathPhase("inhale");
        setBreathProgress(elapsed / bp.inhale);
      } else if (elapsed < bp.inhale + bp.hold) {
        setBreathPhase("hold");
        setBreathProgress(1);
      } else {
        setBreathPhase("exhale");
        setBreathProgress(1 - (elapsed - bp.inhale - bp.hold) / bp.exhale);
      }
    };

    breathTimerRef.current = setInterval(tick, 50);
  }, [bp]);

  // ── CLEANUP ──────────────────────────────────────────────────────────────

  const cleanupAudio = useCallback(() => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    if (audioRef.current) {
      audioRef.current.destroy();
      audioRef.current = null;
    }
  }, []);

  const handleClose = () => {
    cleanupAudio();
    onClose();
  };

  const handleComplete = () => {
    cleanupAudio();
    onComplete(earnedXP);
  };

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.setVolume(volume / 100);
  }, [volume]);

  // ── PROGRESS ─────────────────────────────────────────────────────────────

  const progress = durationSecs > 0 ? (secondsElapsed / durationSecs) * 100 : 0;
  const minsLeft = Math.floor((durationSecs - secondsElapsed) / 60);
  const secsLeft = (durationSecs - secondsElapsed) % 60;

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <SetupPanel
              key="setup"
              session={session} wave={wave} color={color}
              soundscape={soundscape} setSoundscape={setSoundscape}
              breathingGuide={breathingGuide} setBreathingGuide={setBreathingGuide}
              binauralEnabled={binauralEnabled} setBinauralEnabled={setBinauralEnabled}
              volume={volume} setVolume={setVolume}
              earnedXP={earnedXP} rawXP={rawXP}
              bp={bp} onStart={handleStart} onClose={handleClose}
            />
          )}
          {phase === "active" && (
            <ActivePanel
              key="active"
              session={session} wave={wave} color={color}
              breathPhase={breathPhase} breathProgress={breathProgress}
              progress={progress} minsLeft={minsLeft} secsLeft={secsLeft}
              breathingGuide={breathingGuide} bp={bp}
              volume={volume} setVolume={setVolume}
              onStop={handleClose}
            />
          )}
          {phase === "complete" && (
            <CompletePanel
              key="complete"
              session={session} wave={wave} color={color}
              earnedXP={earnedXP} rawXP={rawXP} cappedToday={earnedXP < rawXP}
              onDone={handleComplete}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── SETUP PANEL ───────────────────────────────────────────────────────────

function SetupPanel({
  session, wave, color, soundscape, setSoundscape,
  breathingGuide, setBreathingGuide, binauralEnabled, setBinauralEnabled,
  volume, setVolume, earnedXP, rawXP, bp, onStart, onClose,
}: {
  session: SessionData; wave: string; color: string;
  soundscape: string; setSoundscape: (v: string) => void;
  breathingGuide: boolean; setBreathingGuide: (v: boolean) => void;
  binauralEnabled: boolean; setBinauralEnabled: (v: boolean) => void;
  volume: number; setVolume: (v: number) => void;
  earnedXP: number; rawXP: number;
  bp: { inhale: number; hold: number; exhale: number; label: string };
  onStart: () => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color }}>
            {session.type} · {session.duration}
          </div>
          <div className="text-lg font-bold text-gray-900">{session.title}</div>
          <div className="text-xs text-gray-500 mt-1">{session.desc}</div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl ml-3 mt-1">✕</button>
      </div>

      {/* XP + bell info */}
      <div
        className="rounded-2xl p-3 flex items-center gap-3"
        style={{ background: color + "12", border: `1px solid ${color}30` }}
      >
        <div className="text-2xl">🔔</div>
        <div>
          <div className="text-xs font-semibold" style={{ color }}>
            +{earnedXP} XP this session
            {earnedXP < rawXP && <span className="text-gray-400 font-normal"> (daily cap applied)</span>}
          </div>
          <div className="text-xs text-gray-400">
            A Tibetan bell starts + ends the session. Eyes closed is fine.
          </div>
        </div>
      </div>

      {/* Soundscape picker */}
      <div>
        <div className="text-xs font-bold text-gray-700 mb-2">Background sound</div>
        <div className="grid grid-cols-4 gap-2">
          {SOUNDSCAPES.map(s => (
            <button
              key={s.id}
              onClick={() => setSoundscape(s.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
              style={{
                background: soundscape === s.id ? color + "18" : "#f9f9f8",
                border: `1.5px solid ${soundscape === s.id ? color : "#f0ede8"}`,
                color: soundscape === s.id ? color : "#6b7280",
                fontWeight: soundscape === s.id ? 700 : 400,
              }}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        {soundscape !== "none" && (
          <div className="text-xs text-gray-400 mt-2 italic">
            {SOUNDSCAPES.find(s => s.id === soundscape)?.science}
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleRow
          label="Binaural beats"
          sub={`${wave.charAt(0).toUpperCase() + wave.slice(1)} frequency — use headphones`}
          checked={binauralEnabled}
          onChange={setBinauralEnabled}
          color={color}
        />
        <ToggleRow
          label="Guided breathing voice"
          sub={`${bp.label} — spoken cues (opt-in)`}
          checked={breathingGuide}
          onChange={setBreathingGuide}
          color={color}
        />
      </div>

      {/* Volume */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs font-bold text-gray-700">Volume</div>
          <div className="text-xs text-gray-400">{volume}%</div>
        </div>
        <input
          type="range" min="0" max="100" value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: color }}
        />
      </div>

      {/* Start button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full py-4 rounded-2xl text-white font-bold text-base"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
      >
        Begin session →
      </motion.button>

      <div className="text-center text-xs text-gray-400">
        A gentle bell will play when the session ends
      </div>
    </motion.div>
  );
}

// ── ACTIVE PANEL ──────────────────────────────────────────────────────────

function ActivePanel({
  session, wave, color, breathPhase, breathProgress,
  progress, minsLeft, secsLeft, breathingGuide, bp,
  volume, setVolume, onStop,
}: {
  session: SessionData; wave: string; color: string;
  breathPhase: string; breathProgress: number;
  progress: number; minsLeft: number; secsLeft: number;
  breathingGuide: boolean; bp: { inhale: number; hold: number; exhale: number; label: string };
  volume: number; setVolume: (v: number) => void;
  onStop: () => void;
}) {
  const ringScale = 0.85 + (breathProgress * 0.28);
  const ringOpacity = 0.3 + (breathProgress * 0.4);

  const breathLabel: Record<string, string> = {
    inhale: "Breathe in",
    hold:   "Hold",
    exhale: "Breathe out",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center p-8"
      style={{ minHeight: 480 }}
    >
      {/* Session name */}
      <div className="text-xs font-semibold mb-1 self-start" style={{ color }}>
        {session.title}
      </div>

      {/* Animated breathing orb */}
      <div className="relative flex items-center justify-center my-6" style={{ width: 200, height: 200 }}>
        {/* Outer pulse ring */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 200, height: 200, background: color + "20" }}
          animate={{ scale: ringScale * 1.1, opacity: ringOpacity * 0.5 }}
          transition={{ duration: 0.05 }}
        />
        {/* Mid ring */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 160, height: 160, background: color + "30" }}
          animate={{ scale: ringScale, opacity: ringOpacity }}
          transition={{ duration: 0.05 }}
        />
        {/* Core */}
        <motion.div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: 110, height: 110,
            background: `radial-gradient(circle at 35% 35%, ${color}99, ${color})`,
          }}
          animate={{ scale: 0.9 + breathProgress * 0.12 }}
          transition={{ duration: 0.05 }}
        >
          <div className="text-white text-center">
            <div className="text-lg font-bold">{wave.charAt(0).toUpperCase() + wave.slice(1)}</div>
            <div className="text-xs opacity-80">
              {bp.inhale}-{bp.hold || "0"}-{bp.exhale}
            </div>
          </div>
        </motion.div>

        {/* Circular progress ring */}
        <svg className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r="94" fill="none" stroke={color + "20"} strokeWidth="4" />
          <circle
            cx="100" cy="100" r="94" fill="none"
            stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 94}`}
            strokeDashoffset={`${2 * Math.PI * 94 * (1 - progress / 100)}`}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
      </div>

      {/* Breath instruction */}
      <AnimatePresence mode="wait">
        <motion.div
          key={breathPhase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xl font-bold text-gray-800 mb-1"
        >
          {breathLabel[breathPhase] || "Breathe in"}
        </motion.div>
      </AnimatePresence>

      {/* Breath pattern info */}
      <div className="text-xs text-gray-400 mb-6">
        {bp.label}{breathingGuide ? " · voice guidance on" : ""}
      </div>

      {/* Time remaining */}
      <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
        {minsLeft}:{secsLeft.toString().padStart(2, "0")}
      </div>
      <div className="text-xs text-gray-400 mb-6">remaining</div>

      {/* Volume mini-control */}
      <div className="w-full flex items-center gap-3 mb-4">
        <span className="text-gray-400 text-sm">🔈</span>
        <input
          type="range" min="0" max="100" value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: color }}
        />
        <span className="text-gray-400 text-sm">🔊</span>
      </div>

      <div className="text-xs text-gray-400 mb-4 text-center">
        Eyes closed. The session will end with a gentle bell.
      </div>

      <button
        onClick={onStop}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        End session early
      </button>
    </motion.div>
  );
}

// ── COMPLETE PANEL ────────────────────────────────────────────────────────

function CompletePanel({
  session, wave, color, earnedXP, rawXP, cappedToday, onDone,
}: {
  session: SessionData; wave: string; color: string;
  earnedXP: number; rawXP: number; cappedToday: boolean;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        className="text-5xl mb-4"
      >
        🧠
      </motion.div>

      <div className="text-xl font-bold text-gray-900 mb-2">Session complete</div>
      <div className="text-sm text-gray-500 mb-5">Your brain just rewired itself a little.</div>

      {/* XP earned */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white mb-3"
        style={{ background: color }}
      >
        ⚡ +{earnedXP} NeuroCoin XP
      </motion.div>

      {cappedToday && (
        <div className="text-xs text-gray-400 mb-4">
          Daily XP cap reached. Full {rawXP} XP from tomorrow.
        </div>
      )}

      {/* AI insight preview */}
      <div
        className="w-full rounded-2xl p-4 text-left mb-5"
        style={{ background: color + "10", border: `1px solid ${color}25` }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color }}>Your AI brain coach</div>
        <div className="text-xs text-gray-600 leading-relaxed">
          Completing a {wave} session builds the habit bridge between conscious intent
          and automatic practice. Do this 7 days in a row and your baseline
          resting state will shift measurably toward {wave} dominance.
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        className="w-full py-3.5 rounded-2xl font-bold text-white"
        style={{ background: color }}
      >
        Done →
      </motion.button>
    </motion.div>
  );
}

// ── TOGGLE ROW ────────────────────────────────────────────────────────────

function ToggleRow({
  label, sub, checked, onChange, color,
}: {
  label: string; sub: string; checked: boolean;
  onChange: (v: boolean) => void; color: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl"
      style={{
        background: checked ? color + "0c" : "#fafaf9",
        border: `1px solid ${checked ? color + "30" : "#f0ede8"}`,
      }}
    >
      <div>
        <div className="text-xs font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sub}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? color : "#e5e3de" }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ left: checked ? "calc(100% - 20px)" : "4px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
