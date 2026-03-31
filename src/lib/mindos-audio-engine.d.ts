declare class MindOSAudio {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  isRunning: boolean;
  volume: number;

  constructor();
  init(): Promise<MindOSAudio>;
  playBell(volume?: number, decaySeconds?: number): void;
  playTripleBell(volume?: number): Promise<void>;
  playSoftBell(): void;
  startBinaural(wave?: string, gainLevel?: number): void;
  stopBinaural(): void;
  startSoundscape(type?: string, gainLevel?: number): void;
  stopSoundscape(): void;
  startBreathingGuide(wave?: string, voiceEnabled?: boolean): void;
  stopBreathingGuide(): void;
  startSession(options?: {
    wave?: string;
    durationSecs?: number;
    soundscape?: string;
    binauralEnabled?: boolean;
    breathingGuide?: boolean;
    onTick?: ((secsRemaining: number) => void) | null;
    onComplete?: (() => void) | null;
  }): Promise<void>;
  stop(): void;
  setVolume(v: number): void;
  destroy(): void;
}

export default MindOSAudio;

export declare const BREATH_PATTERNS: Record<string, number[]>;
export declare const WAVE_FREQUENCIES: Record<string, { beat: number; carrier: number }>;
