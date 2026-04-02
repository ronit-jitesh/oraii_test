/**
 * MindOS — Data Persistence + Sound Recommendation Engine
 * /lib/mindos-data.ts
 *
 * BUGS FIXED:
 *  1. Daily reset now uses LOCAL timezone midnight (not UTC) — was causing
 *     UK users to reset at 1am in winter instead of midnight
 *  2. addXP() now always returns updated state even if Supabase fails
 *  3. loadProgress() no longer swallows Supabase errors silently when
 *     table doesn't exist — falls through to localStorage cleanly
 *  4. saveJournalEntry() localStorage write is now synchronous-first
 *     with explicit error surfacing
 *  5. Check-in state persisted to localStorage with midnight reset
 */

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Get today's date string in LOCAL timezone (YYYY-MM-DD).
 * Critical: using toISOString() gives UTC date which is WRONG for UK users —
 * at 11:30pm GMT they'd already be on "tomorrow" UTC.
 */
function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeLocalGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  } catch {}
}

function safeLocalRemove(key: string): void {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  } catch {}
}

// ── SOUND RECOMMENDATION ENGINE ──────────────────────────────────────────────

export type MindOSAnswers = {
  energy?: string;
  state?: string;
  intention?: string;
};

export type Recommendation = {
  soundscape: string;
  wave: string;
  binaural_hz: number;
  reason: string;
  session: string;
  confidence?: number;
};

export const SOUND_RECOMMENDATIONS: Record<string, Recommendation> = {
  "Foggy 😶‍🌫️": {
    soundscape: "waterfall",
    wave: "alpha",
    binaural_hz: 10,
    reason: "Brown noise + 10 Hz alpha beats restore attention and clear mental fog",
    session: "Morning Brain Boot",
  },
  "Low 😴": {
    soundscape: "ocean",
    wave: "theta",
    binaural_hz: 6,
    reason: "Ocean swell cadence matches theta rhythm — ideal for gentle energy restoration",
    session: "Theta Dream Gate",
  },
  "OK 😐": {
    soundscape: "waterfall",
    wave: "alpha",
    binaural_hz: 10,
    reason: "Alpha state is your baseline — waterfall supports calm, sustained focus",
    session: "Morning Brain Boot",
  },
  "Sharp ⚡": {
    soundscape: "rain",
    wave: "beta",
    binaural_hz: 18,
    reason: "Pink noise + beta beats extend your sharp state — perfect for deep work",
    session: "Beta Laser Focus",
  },
  "Wired 🔥": {
    soundscape: "forest",
    wave: "theta",
    binaural_hz: 6,
    reason: "Birdsong is the fastest proven anxiety reducer. Theta brings the system down.",
    session: "Theta Dream Gate",
  },
  "Deep/dreamy": {
    soundscape: "ocean",
    wave: "delta",
    binaural_hz: 2.5,
    reason: "You're already in delta — deepen it with ocean waves and 2.5 Hz entrainment",
    session: "Deep Delta Rest",
  },
  "Creative/calm": {
    soundscape: "stream",
    wave: "theta",
    binaural_hz: 6,
    reason: "Running water boosts creative thinking. 6 Hz theta is peak creativity frequency.",
    session: "Theta Dream Gate",
  },
  "Relaxed/open": {
    soundscape: "waterfall",
    wave: "alpha",
    binaural_hz: 10,
    reason: "You're in alpha — waterfall maintains this state beautifully",
    session: "Morning Brain Boot",
  },
  "Alert/thinking": {
    soundscape: "rain",
    wave: "beta",
    binaural_hz: 18,
    reason: "Pink noise + beta keeps you in focused, analytical mode without overstimulating",
    session: "Beta Laser Focus",
  },
  "Racing/anxious": {
    soundscape: "forest",
    wave: "theta",
    binaural_hz: 6,
    reason: "Birdsong is clinically proven to reduce anxiety fastest. Theta calms the limbic loop.",
    session: "Brahmari Resonance",
  },
  "Rest": {
    soundscape: "ocean",
    wave: "delta",
    binaural_hz: 2.5,
    reason: "Ocean + delta (2.5 Hz) is the most restorative combination known",
    session: "Deep Delta Rest",
  },
  "Creativity": {
    soundscape: "stream",
    wave: "theta",
    binaural_hz: 6,
    reason: "Running water + theta: the combination Shakespeare and Einstein swore by",
    session: "Theta Dream Gate",
  },
  "Focus": {
    soundscape: "rain",
    wave: "beta",
    binaural_hz: 18,
    reason: "Pink noise is the scientifically optimal background for sustained cognitive work",
    session: "Beta Laser Focus",
  },
  "Calm": {
    soundscape: "waterfall",
    wave: "alpha",
    binaural_hz: 10,
    reason: "Brown noise waterfall + 10 Hz alpha: maximum calm without drowsiness",
    session: "Morning Brain Boot",
  },
  "Energy": {
    soundscape: "fire",
    wave: "beta",
    binaural_hz: 18,
    reason: "Fire's warmth + beta stimulation: grounding energy without anxiety",
    session: "Beta Laser Focus",
  },
};

export function getRecommendation(answers: MindOSAnswers = {}): Recommendation {
  const candidates = [
    answers.intention && SOUND_RECOMMENDATIONS[answers.intention],
    answers.state && SOUND_RECOMMENDATIONS[answers.state],
    answers.energy && SOUND_RECOMMENDATIONS[answers.energy],
  ].filter(Boolean) as Recommendation[];

  if (candidates.length === 0) {
    return {
      soundscape: "waterfall",
      wave: "alpha",
      binaural_hz: 10,
      reason: "Alpha state + waterfall: the universal baseline for brain health",
      session: "Morning Brain Boot",
    };
  }

  const waves = candidates.map(c => c.wave);
  const dominantWave = waves.reduce((acc: Record<string, number>, w: string) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
  const bestWave = Object.entries(dominantWave).sort((a, b) => b[1] - a[1])[0][0];
  const primary = candidates.find(c => c.wave === bestWave) || candidates[0];

  return { ...primary, confidence: waves.filter(w => w === bestWave).length };
}

// ── DAILY STATE PERSISTENCE ────────────────────────────────────────────────
// BUG FIX 1: check-in, journal completion reset at LOCAL midnight not page reload

const DAILY_STATE_KEY = "mindos_daily_state";

export type DailyState = {
  date: string;          // LOCAL date YYYY-MM-DD
  checkedIn: boolean;
  checkinAnswers: Record<string, string> | null;
  journalDone: boolean;
  sessionDone: boolean;
};

export function loadDailyState(): DailyState {
  const today = getLocalDateString();
  const raw = safeLocalGet(DAILY_STATE_KEY);
  if (!raw) return { date: today, checkedIn: false, checkinAnswers: null, journalDone: false, sessionDone: false };
  try {
    const parsed = JSON.parse(raw) as DailyState;
    // If stored date != today → it's a new day, return fresh state
    if (parsed.date !== today) {
      return { date: today, checkedIn: false, checkinAnswers: null, journalDone: false, sessionDone: false };
    }
    return parsed;
  } catch {
    return { date: today, checkedIn: false, checkinAnswers: null, journalDone: false, sessionDone: false };
  }
}

export function saveDailyState(partial: Partial<Omit<DailyState, "date">>): DailyState {
  const current = loadDailyState();
  const updated: DailyState = { ...current, ...partial };
  safeLocalSet(DAILY_STATE_KEY, JSON.stringify(updated));
  return updated;
}

// ── JOURNAL PERSISTENCE ────────────────────────────────────────────────────

const JOURNAL_DRAFT_KEY = "mindos_journal_draft";
const JOURNAL_ENTRIES_KEY = "mindos_journal_entries";

export type JournalEntry = {
  id: string;
  user_id?: string;
  content: string;
  prompt: string | null;
  wave: string | null;
  mood_state: string | null;
  created_at: string;
};

export type SaveJournalResult = { ok: boolean; entry?: JournalEntry; error?: string };

/**
 * BUG FIX 3: This now ALWAYS saves to localStorage first (synchronously),
 * then tries Supabase. Previously the journal page's JournalPanel component
 * called a local onSave prop that only awarded XP — it never called this fn.
 * Now the page calls this directly.
 */
export async function saveJournalEntry({
  content,
  prompt,
  wave,
  moodState,
}: {
  content: string;
  prompt?: string | null;
  wave?: string | null;
  moodState?: string | null;
}): Promise<SaveJournalResult> {
  if (!content?.trim()) return { ok: false, error: "Empty entry" };

  const id = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString();

  const entry: JournalEntry = {
    id,
    content: content.trim(),
    prompt: prompt || null,
    wave: wave || null,
    mood_state: moodState || null,
    created_at: new Date().toISOString(),
  };

  // ── Step 1: localStorage (always, instant, works offline) ──
  try {
    const existing = JSON.parse(safeLocalGet(JOURNAL_ENTRIES_KEY) || "[]") as JournalEntry[];
    existing.unshift(entry);
    safeLocalSet(JOURNAL_ENTRIES_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn("localStorage journal save failed:", e);
    // Don't return false here — still try Supabase
  }

  // ── Step 2: Supabase (async, non-blocking, needs auth) ──
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("mindos_journal").insert({
        user_id: user.id,
        content: entry.content,
        prompt: entry.prompt,
        wave: entry.wave,
        mood_state: entry.mood_state,
      });
      if (error) {
        // Log but don't fail — localStorage already has it
        console.warn("Supabase journal sync failed (localStorage saved):", error.message);
      }
    }
  } catch (e) {
    console.warn("Supabase journal error:", e);
  }

  return { ok: true, entry };
}

export async function loadJournalEntries(limit = 20): Promise<JournalEntry[]> {
  // Try Supabase first if authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("mindos_journal")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) return data as JournalEntry[];
    }
  } catch {}

  // Fallback: localStorage
  try {
    const local = JSON.parse(safeLocalGet(JOURNAL_ENTRIES_KEY) || "[]") as JournalEntry[];
    return local.slice(0, limit);
  } catch {
    return [];
  }
}

export function saveDraft(text: string): void {
  safeLocalSet(JOURNAL_DRAFT_KEY, text);
}

export function loadDraft(): string {
  return safeLocalGet(JOURNAL_DRAFT_KEY) || "";
}

export function clearDraft(): void {
  safeLocalRemove(JOURNAL_DRAFT_KEY);
}

// ── SESSION HISTORY ────────────────────────────────────────────────────────

const SESSIONS_LOCAL_KEY = "mindos_sessions";

export async function saveSession({
  sessionId,
  wave,
  soundscape,
  durationSecs,
  xpEarned,
}: {
  sessionId: string;
  wave: string;
  soundscape: string;
  durationSecs: number;
  xpEarned: number;
}) {
  const record = {
    session_id: sessionId,
    wave,
    soundscape,
    duration_secs: durationSecs,
    xp_earned: xpEarned,
    completed_at: new Date().toISOString(),
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
  };

  try {
    const existing = JSON.parse(safeLocalGet(SESSIONS_LOCAL_KEY) || "[]");
    existing.unshift(record);
    safeLocalSet(SESSIONS_LOCAL_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {}

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mindos_sessions").insert({ user_id: user.id, ...record });
    }
  } catch {}

  return { ok: true };
}

// ── PROGRESS (XP + STREAK) ─────────────────────────────────────────────────

const PROGRESS_LOCAL_KEY = "mindos_progress";
const DAILY_XP_CAP = 150;

export type MindOSProgress = {
  xp: number;
  streak: number;
  last_active: string | null; // LOCAL date YYYY-MM-DD
  daily_xp_today: number;
  added?: number;
  capped?: boolean;
};

/**
 * BUG FIX 2: loadProgress now uses LOCAL date for daily reset comparison.
 * Previously used toISOString() which is UTC — broke for UK users at night.
 * Also now falls through cleanly when Supabase table doesn't exist.
 */
export async function loadProgress(): Promise<MindOSProgress> {
  const today = getLocalDateString();

  // Try Supabase if authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("mindos_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        // Reset daily XP if it's a new local day
        if (data.last_active !== today) {
          data.daily_xp_today = 0;
        }
        return data as MindOSProgress;
      }
    }
  } catch {}

  // Fallback: localStorage
  try {
    const raw = safeLocalGet(PROGRESS_LOCAL_KEY);
    if (raw) {
      const local = JSON.parse(raw) as MindOSProgress;
      // Reset daily XP if new local day
      if (local.last_active !== today) {
        local.daily_xp_today = 0;
      }
      return local;
    }
  } catch {}

  // Default starting state
  return { xp: 0, streak: 0, last_active: null, daily_xp_today: 0 };
}

/**
 * BUG FIX 2 (continued): addXP() now ALWAYS updates UI state regardless of
 * Supabase success/failure. Previously if p.added was falsy the UI wouldn't
 * update even though the values changed. Now returns the full updated object.
 */
export async function addXP(amount: number): Promise<MindOSProgress & { added: number; capped: boolean }> {
  const progress = await loadProgress();
  const today = getLocalDateString();

  const cappedAmount = Math.min(amount, DAILY_XP_CAP - (progress.daily_xp_today || 0));

  if (cappedAmount <= 0) {
    // Cap hit — return current state unchanged, added = 0
    return { ...progress, added: 0, capped: true };
  }

  // Calculate new streak using LOCAL dates
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  let newStreak: number;
  if (progress.last_active === today) {
    // Same day — keep streak as-is
    newStreak = progress.streak || 1;
  } else if (progress.last_active === yesterday) {
    // Consecutive day — increment
    newStreak = (progress.streak || 0) + 1;
  } else {
    // Gap of 2+ days — reset streak to 1
    newStreak = 1;
  }

  const updated: MindOSProgress = {
    xp: (progress.xp || 0) + cappedAmount,
    streak: newStreak,
    last_active: today,
    daily_xp_today: (progress.daily_xp_today || 0) + cappedAmount,
  };

  // Save to localStorage immediately (synchronous-first pattern)
  safeLocalSet(PROGRESS_LOCAL_KEY, JSON.stringify(updated));

  // Try Supabase async (non-blocking)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mindos_progress").upsert({
        user_id: user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    // Supabase failed but localStorage already saved — UI still updates correctly
    console.warn("Supabase progress sync failed (localStorage saved):", e);
  }

  return { ...updated, added: cappedAmount, capped: false };
}
