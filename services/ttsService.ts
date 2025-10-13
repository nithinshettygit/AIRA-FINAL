// Lightweight TTS manager built atop Web Speech API with queuing and interruption
// Falls back gracefully if speechSynthesis is unavailable.

type UtteranceOptions = {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  lang?: string; // e.g., 'en-US'
  voiceNameHint?: string; // try to pick a matching voice by name
};

class TtsService {
  private synth: SpeechSynthesis | null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onBoundaryCb: ((charIndex: number, charLength: number) => void) | null = null;
  private onEndCb: (() => void) | null = null;
  private defaultOptions: Required<UtteranceOptions> = {
    rate: 1,
    pitch: 1,
    volume: 1,
    lang: typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US',
    voiceNameHint: ''
  };

  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public stop(): void {
    if (!this.synth) return;
    try {
      this.synth.cancel();
    } catch {}
    this.currentUtterance = null;
  }

  public async speak(text: string, opts?: UtteranceOptions): Promise<void> {
    if (!text || !this.synth) return;
    // Cancel anything ongoing
    this.stop();

    const options = { ...this.defaultOptions, ...(opts || {}) };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;
    utterance.lang = options.lang;

    const voice = this.pickVoice(options.lang, options.voiceNameHint || '');
    if (voice) utterance.voice = voice;

    this.currentUtterance = utterance;

    await new Promise<void>((resolve) => {
      utterance.onend = () => { try { this.onEndCb && this.onEndCb(); } catch {} ; resolve(); };
      utterance.onerror = () => resolve();
      utterance.onboundary = (ev: any) => {
        try {
          const charIndex = typeof ev.charIndex === 'number' ? ev.charIndex : 0;
          const charLength = typeof ev.charLength === 'number' ? ev.charLength : 0;
          this.onBoundaryCb && this.onBoundaryCb(charIndex, charLength);
        } catch {}
      };
      try {
        this.synth!.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  private pickVoice(lang: string, nameHint: string): SpeechSynthesisVoice | null {
    try {
      const voices = (this.synth?.getVoices?.() || []) as SpeechSynthesisVoice[];
      if (!voices.length) return null;
      // Prefer exact name match if hint provided
      if (nameHint) {
        const byName = voices.find(v => v.name.toLowerCase().includes(nameHint.toLowerCase()));
        if (byName) return byName;
      }
      // Prefer matching language
      const byLang = voices.find(v => (v.lang || '').toLowerCase() === (lang || '').toLowerCase());
      if (byLang) return byLang;
      // Fallback to first available
      return voices[0] || null;
    } catch {
      return null;
    }
  }

  public onBoundary(cb: (charIndex: number, charLength: number) => void) {
    this.onBoundaryCb = cb;
  }

  public onEnd(cb: () => void) {
    this.onEndCb = cb;
  }
}

export const ttsService = new TtsService();


