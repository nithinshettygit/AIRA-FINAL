
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
}

export const InputBar: React.FC<InputBarProps> = ({
  userInput,
  setUserInput,
  onSubmit,
  isLoading,
  isFloating,
  onInterrupt,
  onOmit,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
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

      const checkSilence = () => {
        analyser.getFloatTimeDomainData(data);
        // Compute float RMS (0..1 range)
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length); // typical speech ~0.02-0.1
        const speechThreshold = 0.015; // sensitive enough for normal speech
        const isSpeech = rms >= speechThreshold;

        // Track speech activity
        const now = Date.now();
        if (isSpeech) {
          lastSpeechTimeRef.current = now;
          hasHeardSpeechRef.current = true;
        }

        // End condition: heard speech at least once, and 1.5s since last speech
        const silenceAfterSpeechMs = now - lastSpeechTimeRef.current;
        const exceededSilence = hasHeardSpeechRef.current && silenceAfterSpeechMs >= 1500;
        const exceededMax = now - sessionStartTimeRef.current >= 10000; // cap 10s as requested
        const spokenLongEnough = hasHeardSpeechRef.current && (lastSpeechTimeRef.current - sessionStartTimeRef.current) >= 1200;

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
      setIsListening(true);
      requestAnimationFrame(checkSilence);
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
        {!isFloating && (
          <button
            onClick={toggleListening}
            className={`px-3 py-2 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 ${isListening ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-purple-500 text-white hover:bg-purple-400'}`}
            disabled={isLoading}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? 'Stop' : 'Speak'}
          </button>
        )}
        {isFloating ? (
          <>
            <button
              onClick={handleInterruptClick}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50"
              disabled={isLoading}
              aria-label="Interrupt the teacher and ask a question"
            >
              Interrupt
            </button>
            <button
              onClick={onOmit}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-400 transition-colors duration-200 disabled:opacity-50"
              disabled={isLoading}
              aria-label="Show the teacher's full response immediately"
            >
              Show All
            </button>
          </>
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
            ) : "Send"}
          </button>
        )}
      </div>
    </div>
  );
};
