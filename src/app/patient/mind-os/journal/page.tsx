/**
 * MindOS — Journal Page (with full persistence + sound recommendation)
 * /app/patient/mind-os/journal/page.tsx
 *
 * FEATURES:
 *  - Auto-saves draft to localStorage as user types
 *  - Saves completed entries to Supabase (localStorage fallback)
 *  - Sound recommendation shown based on journal mood reflection
 *  - Saving journal awards XP via the persistence layer
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  saveJournalEntry,
  loadJournalEntries,
  saveDraft,
  loadDraft,
  clearDraft,
  addXP,
  getRecommendation,
  SOUND_RECOMMENDATIONS,
  JournalEntry,
  Recommendation
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
  { id: "anxious",    label: "Anxious",    color: "#be185d" },
  { id: "foggy",      label: "Foggy",      color: "#6b7280" },
  { id: "creative",   label: "Creative",   color: "#2D6A4F" },
  { id: "focused",    label: "Focused",    color: "#1d4ed8" },
  { id: "racing",     label: "Overthinking", color: "#9333ea" },
  { id: "calm",       label: "Calm",       color: "#0891b2" },
  { id: "tired",      label: "Tired",      color: "#78716c" },
  { id: "energised",  label: "Energised",  color: "#b45309" },
];

const MOOD_TO_CHECKIN: Record<string, any> = {
  anxious:   { state: "Racing/anxious" },
  foggy:     { energy: "Foggy 😶🌫️" },
  creative:  { state: "Creative/calm", intention: "Creativity" },
  focused:   { energy: "Sharp ⚡", intention: "Focus" },
  racing:    { state: "Racing/anxious" },
  calm:      { state: "Relaxed/open", intention: "Calm" },
  tired:     { energy: "Low 😴", intention: "Rest" },
  energised: { energy: "Sharp ⚡" },
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
    const init = async () => {
      const draft = loadDraft();
      if (draft) setText(draft);

      try {
        const entries = await loadJournalEntries(10);
        setSavedEntries(entries);
      } catch (e) {
        console.warn("Could not load entries:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    setPromptIdx(Math.floor(Math.random() * PROMPTS.length));
  }, []);

  // ── AUTO-SAVE DRAFT ────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveDraft(text);
    }, 800);
    return () => {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    };
  }, [text]);

  // ── UPDATE RECOMMENDATION WHEN MOOD CHANGES ────────────────────────────────

  useEffect(() => {
    if (selectedMood) {
      const answers = MOOD_TO_CHECKIN[selectedMood] || {};
      const rec = getRecommendation(answers);
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

      if (result.ok) {
        const xpResult = await addXP(15);
        clearDraft();
        setText("");
        setSaveState("saved");
        setXpNotif(xpResult.added && xpResult.added > 0
          ? `+${xpResult.added} XP earned`
          : "Daily XP cap reached — full XP from tomorrow");

        const updated = await loadJournalEntries(10);
        setSavedEntries(updated);

        setTimeout(() => {
          setSaveState("idle");
          setXpNotif(null);
          setSelectedMood(null);
        }, 3000);
      } else {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2000);
      }
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

      {/* XP notification */}
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

        {/* Header */}
        <div>
          <div className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">MindOS</div>
          <div className="text-xl font-bold text-gray-900">Brain Journal</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Write in theta state for deepest access to the subconscious
          </div>
        </div>

        {/* Why this works */}
        <div className="rounded-2xl p-3.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="text-xs font-semibold text-green-800 mb-1">The theta window</div>
          <div className="text-xs text-green-700 leading-relaxed">
            The first 10 minutes after waking or meditation your brain is in theta — the subconscious
            is open. Writing here can surface beliefs and patterns you can't reach during beta thinking.
            Dr. Adatia calls this "conscious rewiring."
          </div>
        </div>

        {/* Mood selector */}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
          <div className="text-xs font-semibold text-gray-700 mb-2.5">
            How is your brain right now? <span className="text-gray-400 font-normal">(optional)</span>
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

        {/* Sound recommendation based on mood */}
        <AnimatePresence>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-4"
              style={{
                background: "#faf5ff",
                border: "1px solid #e9d5ff",
              }}
            >
              <div className="text-xs font-semibold text-purple-700 mb-1">
                Recommended sound for your state
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {({ waterfall: "🏔️", ocean: "🌊", rain: "🌧️", forest: "🌲", stream: "🏞️", fire: "🔥", delta: "🌑" } as Record<string, string>)[recommendation.soundscape] || "🎵"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {recommendation.soundscape} + {recommendation.wave} binaural ({recommendation.binaural_hz} Hz)
                  </div>
                  <div className="text-xs text-purple-600 mt-0.5">{recommendation.reason}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-500">
                Start the <strong>{recommendation.session}</strong> session before journaling for maximum effect
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journal prompt */}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0ede8" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs font-semibold text-gray-700">Today's theta prompt</div>
            <button
              onClick={nextPrompt}
              className="text-xs text-purple-500 hover:text-purple-700 underline"
            >
              New prompt
            </button>
          </div>

          <div className="rounded-xl p-3 mb-3 italic text-sm text-purple-700"
               style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
            "{PROMPTS[promptIdx]}"
          </div>

          {/* Textarea with auto-save indicator */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely. No rules. Your subconscious is talking..."
              className="w-full h-32 p-3 text-sm rounded-xl resize-none focus:outline-none"
              style={{
                background: "#fafaf9",
                border: "1px solid #f0ede8",
                color: "#374151",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#c4b5fd"; e.target.style.background = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#f0ede8"; e.target.style.background = "#fafaf9"; }}
            />

            {/* Auto-save indicator */}
            {text.length > 0 && (
              <div className="absolute bottom-2 right-3 text-xs text-gray-300">
                {text.length > 10 ? "draft saved" : ""}
              </div>
            )}
          </div>

          {/* Word count + save button */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">
              {text.split(/\s+/).filter(Boolean).length} words
              {selectedMood && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: moodTag?.color + "18", color: moodTag?.color }}>
                  {moodTag?.label}
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={!text.trim() || saveState === "saving"}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              style={{
                background: saveState === "saved" ? "#2D6A4F"
                  : saveState === "error" ? "#be185d"
                  : "#5b21b6",
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
            <div className="text-xs text-gray-400 text-center py-4">Loading your entries...</div>
          ) : savedEntries.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              No entries yet. Write your first one above.
            </div>
          ) : (
            <div className="space-y-3">
              {savedEntries.slice(0, 5).map((entry, i) => (
                <motion.div
                  key={entry.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl"
                  style={{ background: "#fafaf9", border: "1px solid #f0ede8" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs text-gray-400">
                      {formatDate(entry.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.wave && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: "#ede9fe", color: "#5b21b6" }}>
                          {entry.wave}
                        </span>
                      )}
                      {entry.mood_state && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: "#f0fdf4", color: "#2D6A4F" }}>
                          {entry.mood_state}
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.prompt && (
                    <div className="text-xs text-gray-400 italic mb-1 line-clamp-1">
                      "{entry.prompt}"
                    </div>
                  )}
                  <div className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                    {entry.content}
                  </div>
                </motion.div>
              ))}

              {savedEntries.length > 5 && (
                <div className="text-xs text-center text-gray-400">
                  +{savedEntries.length - 5} more entries saved
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
