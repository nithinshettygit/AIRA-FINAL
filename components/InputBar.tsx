import React, { useRef, useEffect, useState } from 'react';
import { transcribeAudio } from '../services/apiService';

// Minimal ambient typings for Web Speech API to satisfy TS without external types
type WebkitSpeechRecognition = any;
type BrowserSpeechRecognition = any;
type BrowserSpeechRecognitionEvent = any;

interface InputBarProps {
  userInput: string;
  setUserInput: (value: string) => void;
  onSubmit: (query: string) => void;
  isLoading: boolean;
  isFloating: boolean;
  onInterrupt: () => void;
  onOmit: () => void;
  onEnd?: () => void;
  onOpenNotes: () => void;
  onOpenLessons: () => void;
  showNotesButton?: boolean;
  showEndButton?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  userInput,
  setUserInput,
  onSubmit,
  isLoading,
  isFloating,
  onInterrupt,
  onOmit,
  onEnd,
  onOpenNotes,
  onOpenLessons,
  showNotesButton = true,
  showEndButton = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [speechActive, setSpeechActive] = useState<boolean>(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceFinalRef = useRef<string>("");
  const voiceInterimRef = useRef<string>("");
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const hasHeardSpeechRef = useRef<boolean>(false);
  const lastSpeechTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0.008);
  const speechThresholdRef = useRef<number>(0.015);
  const emaLevelRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognitionImpl: WebkitSpeechRecognition | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      console.warn('[voice] Web Speech API not supported in this browser.');
      return;
    }

    const recog = new (SpeechRecognitionImpl as any)();
    // Keep mic open and stream results; we'll stop on 4s of silence
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recog.lang = navigator.language || 'en-US';

    recog.onstart = () => {
      console.debug('[voice] recognition started');
      voiceFinalRef.current = '';
      voiceInterimRef.current = '';
      setIsListening(true);
    };
    recog.onend = () => {
      console.debug('[voice] recognition ended');
      setIsListening(false);
      // Finalize submission if we've stopped listening (timeout or user stop)
      const finalUtterance = voiceFinalRef.current.trim();
      if (finalUtterance.length > 0) {
        console.debug('[voice] submitting final utterance:', finalUtterance);
        onSubmit(finalUtterance);
      } else {
        console.debug('[voice] no final utterance to submit');
      }
    };
    recog.onerror = (e: any) => {
      console.error('[voice] recognition error', e);
      setIsListening(false);
    };
    recog.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let interim = '';
      // Append newly finalized segments to persistent buffer
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          voiceFinalRef.current = (voiceFinalRef.current + ' ' + transcript).trim();
        } else {
          interim += transcript;
        }
      }
      voiceInterimRef.current = interim.trim();
      const preview = (voiceFinalRef.current + (voiceInterimRef.current ? ' ' + voiceInterimRef.current : '')).trim();
      console.debug('[voice] preview text:', preview);
      setUserInput(preview);

      // Reset 4s inactivity timer on every result
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        console.debug('[voice] 4s silence detected, stopping recognition');
        stopListening();
      }, 4000);
    };

    recognitionRef.current = recog as any;

    return () => {
      try {
        recog.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [setUserInput, userInput]);

  const stopListening = () => {
    console.debug('[voice] stop requested');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    // Ensure UI leaves listening state immediately
    setIsListening(false);
    try { (recognitionRef.current as any)?.stop(); } catch (e) { /* ignore when not started */ }
    // Stop recorder + audio stream
    const mr = mediaRecorderRef.current;
    const stream = audioStreamRef.current;
    let willFinalize = false;
    if (mr && mr.state !== 'inactive') {
      try { mr.stop(); willFinalize = true; } catch {}
    }
    try { stream && stream.getTracks().forEach(t => t.stop()); } catch {}
    try { audioStreamRef.current && audioStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    isRecordingRef.current = false;

    // If we have audio collected and not yet submitted, finalize now
    if (!isSubmittingRef.current) {
      isSubmittingRef.current = true;
      setTimeout(async () => {
        try {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            const text = await transcribeAudio(blob);
            if (text && text.trim()) {
              setUserInput(text.trim());
              onSubmit(text.trim());
            }
          }
        } finally {
          // reset for next session
          recordedChunksRef.current = [];
        }
      }, willFinalize ? 150 : 0);
    }
  };

  const startListening = async () => {
    console.debug('[voice] start requested (silence-based, media recorder)');
    voiceFinalRef.current = '';
    voiceInterimRef.current = '';
    isSubmittingRef.current = false;
    isRecordingRef.current = true;
    hasHeardSpeechRef.current = false;
    lastSpeechTimeRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    // Disable Web Speech preview to avoid premature endings; rely on server transcription
    // try { (recognitionRef.current as any)?.start(); } catch (e) { console.error('[voice] start error', e); }
    // Start MediaRecorder + silence detection
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.start(200);

      // Set up silence detection with Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

      // Ambient noise calibration (~1s) to estimate a noise floor and dynamic threshold
      setIsCalibrating(true);
      const calibSamples: number[] = [];
      const calibStart = performance.now();
      const doCalibrate = () => {
        analyser.getFloatTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        calibSamples.push(rms);
        if (performance.now() - calibStart < 900) {
          requestAnimationFrame(doCalibrate);
        } else {
          calibSamples.sort((a, b) => a - b);
          const median = calibSamples[Math.floor(calibSamples.length * 0.5)] || 0.008;
          const p80 = calibSamples[Math.floor(calibSamples.length * 0.8)] || median;
          noiseFloorRef.current = Math.max(0.003, Math.min(p80, 0.03));
          // Lower multiplier so we detect more easily in quieter voices
          speechThresholdRef.current = Math.max(0.010, noiseFloorRef.current * 2.0);
          console.debug('[voice] calibrated noiseFloor=', noiseFloorRef.current.toFixed(4), 'threshold=', speechThresholdRef.current.toFixed(4));
          setIsCalibrating(false);
          setIsListening(true);
          requestAnimationFrame(checkSilence);
        }
      };

      const checkSilence = () => {
        analyser.getFloatTimeDomainData(data);
        // Compute float RMS (0..1 range)
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length); // typical speech ~0.02-0.1
        const speechThreshold = speechThresholdRef.current;
        const quietThreshold = Math.max(noiseFloorRef.current * 1.2, speechThreshold * 0.6);
        const isSpeech = rms >= speechThreshold;
        setSpeechActive(isSpeech);

        // Debug occasionally (based on time)
        const tNow = performance.now();
        if ((Math.floor(tNow) % 500) < 16) {
          // eslint-disable-next-line no-console
          console.debug('[voice] rms=', rms.toFixed(4), 'thresh=', speechThreshold.toFixed(4), 'quiet=', quietThreshold.toFixed(4), 'speech=', isSpeech);
        }

        // Update simple VU meter (EMA smoothing)
        const instLevel = Math.min(1, rms * 12);
        const ema = 0.3 * instLevel + 0.7 * emaLevelRef.current;
        emaLevelRef.current = ema;
        setInputLevel(ema);

        // Track speech activity
        const now = Date.now();
        if (isSpeech) {
          lastSpeechTimeRef.current = now;
          hasHeardSpeechRef.current = true;
        }

        // End condition: heard speech at least once, and 1.2s since last speech
        const silenceAfterSpeechMs = now - lastSpeechTimeRef.current;
        const exceededSilence = hasHeardSpeechRef.current && silenceAfterSpeechMs >= 1200 && rms < quietThreshold;
        const exceededMax = now - sessionStartTimeRef.current >= 10000; // cap 10s
        const spokenLongEnough = hasHeardSpeechRef.current && (lastSpeechTimeRef.current - sessionStartTimeRef.current) >= 1000;

        // If no speech for 4s from start, stop listening gracefully
        const noSpeechTimeout = !hasHeardSpeechRef.current && (now - sessionStartTimeRef.current) >= 6000;
        if (noSpeechTimeout && !isSubmittingRef.current) {
          console.debug('[voice] no speech detected within 4s, stopping');
          stopListening();
          return;
        }

        if ((exceededMax || (exceededSilence && spokenLongEnough)) && !isSubmittingRef.current) {
          isSubmittingRef.current = true;
          console.debug('[voice] finalizing recording (silence or max duration)');
          try { mr.state !== 'inactive' && mr.stop(); } catch {}
          try { stream.getTracks().forEach(t => t.stop()); } catch {}
          isRecordingRef.current = false;
          (async () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            const text = await transcribeAudio(blob);
            if (text && text.trim()) {
              setUserInput(text.trim());
              onSubmit(text.trim());
            }
          })();
          return;
        }

        if (isListening && isRecordingRef.current) {
          requestAnimationFrame(checkSilence);
        }
      };
      // Start calibration first, then run detection loop
      requestAnimationFrame(doCalibrate);
    } catch (err) {
      console.error('[voice] media recorder init failed', err);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleListening = () => {
    const recog = recognitionRef.current as any;
    if (!recog) {
      console.warn('[voice] recognition not initialized');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(userInput);
  };
  
  const handleInterruptClick = () => {
      onInterrupt();
      // auto-start listening for the user's spoken question after interrupt
      if (!isListening) {
        startListening();
      }
      if(inputRef.current) {
          inputRef.current.focus();
      }
  }

  return (
    <div className="w-full max-w-3xl p-4 z-30">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={isLoading ? "Thinking..." : "Ask about a science topic..."}
          className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none px-3 py-2"
          disabled={isLoading}
          onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit(e)}
        />

        {isFloating ? (
          <button
            onClick={handleInterruptClick}
            className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Interrupt the teacher and ask a question"
          >
            Interrupt
          </button>
        ) : (
          <button
            onClick={handleFormSubmit}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !userInput.trim()}
            aria-label="Send your message to the teacher"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        )}

        {/* Conditionally render Notes button */}
        {showNotesButton && (
          <button
            onClick={onOpenNotes}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Open session notes"
            title="Session Notes"
          >
            Notes
          </button>
        )}

        {/* Conditionally render End button */}
        {showEndButton && (
          <button
            onClick={() => onEnd && onEnd()}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="End the current lesson"
          >
            End
          </button>
        )}
      </div>
    </div>
  );
};