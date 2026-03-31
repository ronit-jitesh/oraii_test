/**
 * MindOS — Data Persistence + Sound Recommendation Engine
 * ─────────────────────────────────────────────────────────
 * /lib/mindos-data.ts
 */

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
  // Energy level mappings
  "Foggy 😶🌫️": {
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

  // Brain state mappings (from check-in Q2)
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

  // Intention mappings (from check-in Q3)
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

  return {
    ...primary,
    confidence: waves.filter(w => w === bestWave).length,
  };
}

// ── JOURNAL PERSISTENCE ────────────────────────────────────────────────────

const JOURNAL_LOCAL_KEY = "mindos_journal_draft";
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

export async function saveJournalEntry({
  content,
  prompt,
  wave,
  moodState
}: {
  content: string;
  prompt?: string | null;
  wave?: string | null;
  moodState?: string | null;
}) {
  if (!content?.trim()) return { ok: false, error: "Empty entry" };

  const entry: JournalEntry = {
    content: content.trim(),
    prompt: prompt || null,
    wave: wave || null,
    mood_state: moodState || null,
    created_at: new Date().toISOString(),
    id: crypto.randomUUID?.() || Date.now().toString(),
  };

  try {
    let existingStr = "[]"
    if (typeof window !== "undefined") {
        existingStr = localStorage.getItem(JOURNAL_ENTRIES_KEY) || "[]";
    }
    const existing = JSON.parse(existingStr);
    existing.unshift(entry);
    if (typeof window !== "undefined") {
        localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(existing.slice(0, 100)));
    }
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    entry.user_id = user.id;
    const { error } = await supabase.from("mindos_journal").insert({
      user_id: user.id,
      content: entry.content,
      prompt: entry.prompt,
      wave: entry.wave,
      mood_state: entry.mood_state,
    });
    if (error) console.warn("Supabase journal sync failed (localStorage saved):", error.message);
  }

  return { ok: true, entry };
}

export async function loadJournalEntries(limit = 20): Promise<JournalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from("mindos_journal")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data?.length) return data as JournalEntry[];
  }

  try {
    let existingStr = "[]"
    if (typeof window !== "undefined") {
        existingStr = localStorage.getItem(JOURNAL_ENTRIES_KEY) || "[]";
    }
    const local = JSON.parse(existingStr);
    return local.slice(0, limit);
  } catch {
    return [];
  }
}

export function saveDraft(text: string) {
  try { if (typeof window !== "undefined") localStorage.setItem(JOURNAL_LOCAL_KEY, text); } catch (e) {}
}

export function loadDraft() {
  try { return typeof window !== "undefined" ? localStorage.getItem(JOURNAL_LOCAL_KEY) || "" : ""; } catch { return ""; }
}

export function clearDraft() {
  try { if (typeof window !== "undefined") localStorage.removeItem(JOURNAL_LOCAL_KEY); } catch (e) {}
}

// ── SESSION HISTORY ────────────────────────────────────────────────────────

const SESSIONS_LOCAL_KEY = "mindos_sessions";

export async function saveSession({
  sessionId,
  wave,
  soundscape,
  durationSecs,
  xpEarned
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
    id: crypto.randomUUID?.() || Date.now().toString(),
  };

  try {
    let existingStr = "[]"
    if (typeof window !== "undefined") {
        existingStr = localStorage.getItem(SESSIONS_LOCAL_KEY) || "[]";
    }
    const existing = JSON.parse(existingStr);
    existing.unshift(record);
    if (typeof window !== "undefined") {
        localStorage.setItem(SESSIONS_LOCAL_KEY, JSON.stringify(existing.slice(0, 50)));
    }
  } catch (e) {}

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("mindos_sessions").insert({ user_id: user.id, ...record });
  }

  return { ok: true };
}

// ── PROGRESS (XP + STREAK) ─────────────────────────────────────────────────

const PROGRESS_LOCAL_KEY = "mindos_progress";
const DAILY_XP_CAP = 150;

export type MindOSProgress = {
  xp: number;
  streak: number;
  last_active: string | null;
  daily_xp_today: number;
  added?: number;
  capped?: boolean;
};

export async function loadProgress(): Promise<MindOSProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from("mindos_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (!error && data) {
      const today = new Date().toISOString().split("T")[0];
      if (data.last_active !== today) {
        data.daily_xp_today = 0;
      }
      return data as MindOSProgress;
    }
  }

  try {
    let localStr = "null"
    if (typeof window !== "undefined") {
        localStr = localStorage.getItem(PROGRESS_LOCAL_KEY) || "null";
    }
    const local = JSON.parse(localStr);
    if (local) {
      const today = new Date().toISOString().split("T")[0];
      if (local.last_active !== today) local.daily_xp_today = 0;
      return local as MindOSProgress;
    }
  } catch {}

  return { xp: 0, streak: 0, last_active: null, daily_xp_today: 0 };
}

export async function addXP(amount: number): Promise<MindOSProgress> {
  const progress = await loadProgress();
  const today = new Date().toISOString().split("T")[0];

  const cappedAmount = Math.min(amount, DAILY_XP_CAP - (progress.daily_xp_today || 0));
  if (cappedAmount <= 0) return { ...progress, added: 0, capped: true };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = progress.last_active === yesterday || progress.last_active === today
    ? (progress.last_active === today ? progress.streak : (progress.streak || 0) + 1)
    : 1;

  const updated = {
    xp: (progress.xp || 0) + cappedAmount,
    streak: newStreak,
    last_active: today,
    daily_xp_today: (progress.daily_xp_today || 0) + cappedAmount,
  };

  try {
     if (typeof window !== "undefined") {
         localStorage.setItem(PROGRESS_LOCAL_KEY, JSON.stringify(updated));
     }
  } catch {}

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("mindos_progress").upsert({
      user_id: user.id, ...updated, updated_at: new Date().toISOString()
    });
  }

  return { ...updated, added: cappedAmount, capped: cappedAmount < amount };
}
