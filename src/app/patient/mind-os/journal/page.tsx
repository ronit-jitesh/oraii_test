/**
 * MindOS — Journal Page
 * /app/patient/mind-os/journal/page.tsx
 *
 * v3 FIXES:
 *  - Imports corrected to match updated mindos-data.ts exports
 *  - saveDailyState called on successful save → journalDone badge on Today tab
 *  - Draft restored from localStorage on mount — survives refreshes
 *  - Past entries load from Supabase first, localStorage fallback
 *  - Sound recommendation matched to mood tag
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  saveJournalEntry,
  loadJournalEntries,
  saveDraft,
  loadDraft,
  clearDraft,
  addXP,
  getRecommendation,
  saveDailyState,
  JournalEntry,
  Recommendation,
} from "@/lib/mindos-data";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const PROMPTS = [
  "What did your brain do differently today that you want to remember?",
  "If your mind were a landscape right now, what would it look like?",
  "One belief you want to rewrite in your subconscious:",
  "The best version of your brain does what in the morning?",
  "What would you create if you had unlimited mental clarity?",
  "A pattern you noticed in your thoughts today:",
  "Your brain's superpower that you haven't fully used yet:",
  "What does your mind keep returning to today, and why?",
  "If your anxiety had a shape, what would it be?",
  "The one thought you want to carry into tomorrow:",
];

const MOOD_TAGS = [
  { id: "anxious",   label: "Anxious",      color: "#be185d" },
  { id: "foggy",     label: "Foggy",         color: "#6b7280" },
  { id: "creative",  label: "Creative",      color: "#2D6A4F" },
  { id: "focused",   label: "Focused",       color: "#1d4ed8" },
  { id: "racing",    label: "Overthinking",  color: "#9333ea" },
  { id: "calm",      label: "Calm",          color: "#0891b2" },
  { id: "tired",     label: "Tired",         color: "#78716c" },
  { id: "energised", label: "Energised",     color: "#b45309" },
];

// Maps mood tag id → check-in answer shape for getRecommendation()
const MOOD_TO_CHECKIN: Record<string, { energy?: string; state?: string; intention?: string }> = {
  anxious:   { state: "Racing/anxious" },
  foggy:     { energy: "Foggy 😶‍🌫️" },
  creative:  { state: "Creative/calm", intention: "Creativity" },
  focused:   { energy: "Sharp ⚡", intention: "Focus" },
  racing:    { state: "Racing/anxious" },
  calm:      { state: "Relaxed/open", intention: "Calm" },
  tired:     { energy: "Low 😴", intention: "Rest" },
  energised: { energy: "Sharp ⚡" },
};

const SOUNDSCAPE_ICONS: Record<string, string> = {
  waterfall: "🏔️", ocean: "🌊", rain: "🌧️",
  forest: "🌲", stream: "🏞️", fire: "🔥",
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [text, setText] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [savedEntries, setSavedEntries] = useState<JournalEntry[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [xpNotif, setXpNotif] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── LOAD ON MOUNT ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Restore draft (survives refresh)
    const draft = loadDraft();
    if (draft) setText(draft);

    // Random prompt
    setPromptIdx(Math.floor(Math.random() * PROMPTS.length));

    // Load past entries (Supabase → localStorage fallback)
    loadJournalEntries(10)
      .then(setSavedEntries)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // ── AUTO-SAVE DRAFT ────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveDraft(text), 800);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [text]);

  // ── RECOMMENDATION FROM MOOD ───────────────────────────────────────────────

  useEffect(() => {
    if (selectedMood) {
      const rec = getRecommendation(MOOD_TO_CHECKIN[selectedMood] || {});
      setRecommendation(rec);
    } else {
      setRecommendation(null);
    }
  }, [selectedMood]);

  // ── SAVE ENTRY ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!text.trim() || saveState === "saving") return;
    setSaveState("saving");

    try {
      const result = await saveJournalEntry({
        content: text,
        prompt: PROMPTS[promptIdx],
        wave: recommendation?.wave || "alpha",
        moodState: selectedMood,
      });

      if (!result.ok) throw new Error(result.error || "Save failed");

      // Award XP
      const xpResult = await addXP(15);

      // Mark journal done in daily state → Today tab badge updates
      saveDailyState({ journalDone: true });

      // Clear draft + textarea
      clearDraft();
      setText("");
      setSaveState("saved");
      setXpNotif(
        xpResult.added > 0
          ? `+${xpResult.added} XP earned`
          : "Daily XP cap reached — full XP from tomorrow"
      );

      // Reload entries list
      const updated = await loadJournalEntries(10);
      setSavedEntries(updated);

      setTimeout(() => {
        setSaveState("idle");
        setXpNotif(null);
        setSelectedMood(null);
      }, 3000);
    } catch (e) {
      console.error("Save failed:", e);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }, [text, saveState, promptIdx, recommendation, selectedMood]);

  // ── HELPERS ────────────────────────────────────────────────────────────────

  const nextPrompt = () => setPromptIdx(i => (i + 1) % PROMPTS.length);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const moodTag = MOOD_TAGS.find(m => m.id === selectedMood);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#faf9f6", fontFamily: "system-ui, sans-serif" }}>

      {/* XP toast */}
      <AnimatePresence>
        {xpNotif && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg"
            style={{ background: "#2D6A4F" }}
          >
            {xpNotif}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Header with back link */}
        <div className="flex items-center gap-3">
          <Link href="/patient/mind-os" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </Link>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">MindOS</div>
            <div className="text-xl font-bold text-gray-900">Brain Journal</div>
          </div>
        </div>

        {/* Why theta */}
        <div className="rounded-2xl p-3.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="text-xs font-semibold text-green-800 mb-1">The theta window</div>
          <div className="text-xs text-green-700 leading-relaxed">
            The first 10 minutes after waking or meditation your brain is in theta — the subconscious
            is open. Writing here surfaces beliefs and patterns you can&apos;t reach during beta thinking.
            Dr. Adatia calls this &quot;conscious rewiring.&quot;
          </div>
        </div>

        {/* Mood selector */}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
          <div className="text-xs font-semibold text-gray-700 mb-2.5">
            How is your brain right now?{" "}
            <span className="text-gray-400 font-normal">(optional — shapes sound recommendation)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOOD_TAGS.map(mood => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: selectedMood === mood.id ? mood.color + "18" : "#fafaf9",
                  border: `1.5px solid ${selectedMood === mood.id ? mood.color : "#f0ede8"}`,
                  color: selectedMood === mood.id ? mood.color : "#6b7280",
                  fontWeight: selectedMood === mood.id ? 700 : 400,
                }}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound recommendation */}
        <AnimatePresence>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-4"
              style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}
            >
              <div className="text-xs font-semibold text-purple-700 mb-2">
                Recommended sound for your state
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {SOUNDSCAPE_ICONS[recommendation.soundscape] || "🎵"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {recommendation.soundscape} + {recommendation.wave} binaural ({recommendation.binaural_hz} Hz)
                  </div>
                  <div className="text-xs text-purple-600 mt-0.5 leading-relaxed">
                    {recommendation.reason}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-500">
                Start <strong>{recommendation.session}</strong> session before journaling for maximum effect
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journal entry form */}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs font-semibold text-gray-700">Today&apos;s theta prompt</div>
            <button onClick={nextPrompt} className="text-xs text-purple-500 hover:text-purple-700 underline">
              New prompt
            </button>
          </div>

          <div className="rounded-xl p-3 mb-3 italic text-sm text-purple-700"
               style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
            &quot;{PROMPTS[promptIdx]}&quot;
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely. No rules. Your subconscious is talking..."
              rows={5}
              className="w-full p-3 text-sm rounded-xl resize-none focus:outline-none"
              style={{
                background: "#fafaf9",
                border: "1px solid #f0ede8",
                color: "#374151",
                fontFamily: "inherit",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#c4b5fd";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#f0ede8";
                e.target.style.background = "#fafaf9";
              }}
            />
            {text.length > 10 && (
              <div className="absolute bottom-2 right-3 text-xs text-gray-300">
                draft saved
              </div>
            )}
          </div>

          {/* Word count + mood chip + save button */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{text.split(/\s+/).filter(Boolean).length} words</span>
              {selectedMood && moodTag && (
                <span
                  className="px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: moodTag.color + "18", color: moodTag.color }}
                >
                  {moodTag.label}
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={!text.trim() || saveState === "saving"}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              style={{
                background:
                  saveState === "saved" ? "#2D6A4F" :
                  saveState === "error" ? "#be185d" :
                  "#5b21b6",
              }}
            >
              {saveState === "saving" ? "Saving..." :
               saveState === "saved" ? "✓ Saved! +15 XP" :
               saveState === "error" ? "Save failed — try again" :
               "Save entry →"}
            </motion.button>
          </div>
        </div>

        {/* Past entries */}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
          <div className="text-sm font-bold text-gray-800 mb-3">Past entries</div>

          {isLoading ? (
            <div className="text-xs text-gray-400 text-center py-6">Loading your entries...</div>
          ) : savedEntries.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-6">
              No entries yet. Write your first one above.
            </div>
          ) : (
            <div className="space-y-3">
              {savedEntries.slice(0, 8).map((entry, i) => (
                <motion.div
                  key={entry.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-xl"
                  style={{ background: "#fafaf9", border: "1px solid #f0ede8" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs text-gray-400">{formatDate(entry.created_at)}</div>
                    <div className="flex items-center gap-1.5">
                      {entry.wave && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: "#ede9fe", color: "#5b21b6" }}
                        >
                          {entry.wave}
                        </span>
                      )}
                      {entry.mood_state && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: "#f0fdf4", color: "#2D6A4F" }}
                        >
                          {entry.mood_state}
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.prompt && (
                    <div className="text-xs text-gray-400 italic mb-1 line-clamp-1">
                      &quot;{entry.prompt}&quot;
                    </div>
                  )}
                  <div className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                    {entry.content}
                  </div>
                </motion.div>
              ))}
              {savedEntries.length > 8 && (
                <div className="text-xs text-center text-gray-400 pt-1">
                  +{savedEntries.length - 8} more entries
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
