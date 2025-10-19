import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RobotAvatar } from './components/RobotAvatar';
import { MessageDisplay } from './components/MessageDisplay';
import { InputBar } from './components/InputBar';
import { getAiTeacherResponse, transcribeAudio } from './services/apiService';
import { ttsService } from './services/ttsService';
import { useMediaSequencer } from './hooks/useMediaSequencer';
import { NotesModal } from './components/NotesModal';
import { notesService } from './services/notesService';
import type { MediaInfo } from './types';
import { Message, Role } from './types';
import { READING_SPEED_MS_PER_CHAR } from './constants';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [floatingText, setFloatingText] = useState<string>('');
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string[]>([]);
  const [showEndConfirmation, setShowEndConfirmation] = useState<boolean>(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [speechActive, setSpeechActive] = useState<boolean>(false);

  // Use media sequencer hook
  const {
    currentSegment,
    currentMedia,
    currentText,
    isPlaying: isSequencePlaying,
    startSequence,
    stopSequence,
    advanceManually,
    closeVideo
  } = useMediaSequencer();

  const location = useLocation();
  const navigate = useNavigate();
  const textFloatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalAiResponseRef = useRef<string>('');
  const floatingTextIndexRef = useRef<number>(0);
  const interruptedTextRef = useRef<string>('');
  const hasProcessedInitialTopic = useRef<boolean>(false);

  // Voice recognition refs
  const recognitionRef = useRef<any>(null);
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

  // Load notes on component mount
  useEffect(() => {
    const notes = notesService.getNotes();
    setSessionNotes(notes);
  }, []);

  // Handle topic selection from Lesson Index
  useEffect(() => {
    if (location.state?.selectedTopic && !hasProcessedInitialTopic.current) {
      const topic = location.state.selectedTopic;
      console.log('[App] Auto-submitting topic from Lesson Index:', topic);
      handleSubmit(topic);
      hasProcessedInitialTopic.current = true;
      
      // Clear the location state to prevent resubmission on refresh
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Voice recognition useEffect
  useEffect(() => {
    const SpeechRecognitionImpl: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      console.warn('[voice] Web Speech API not supported in this browser.');
      return;
    }

    const recog = new SpeechRecognitionImpl();
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
      const finalUtterance = voiceFinalRef.current.trim();
      if (finalUtterance.length > 0) {
        console.debug('[voice] submitting final utterance:', finalUtterance);
        handleSubmit(finalUtterance);
      }
    };
    
    recog.onerror = (e: any) => {
      console.error('[voice] recognition error', e);
      setIsListening(false);
    };
    
    recog.onresult = (event: any) => {
      let interim = '';
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

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        console.debug('[voice] 4s silence detected, stopping recognition');
        stopListening();
      }, 4000);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [setUserInput]);

  const stopListening = () => {
    console.debug('[voice] stop requested');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setIsListening(false);
    try { recognitionRef.current?.stop(); } catch (e) { }
    
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

    if (!isSubmittingRef.current) {
      isSubmittingRef.current = true;
      setTimeout(async () => {
        try {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            const text = await transcribeAudio(blob);
            if (text && text.trim()) {
              setUserInput(text.trim());
              handleSubmit(text.trim());
            }
          }
        } finally {
          recordedChunksRef.current = [];
        }
      }, willFinalize ? 150 : 0);
    }
  };

  const startListening = async () => {
    console.debug('[voice] start requested');
    voiceFinalRef.current = '';
    voiceInterimRef.current = '';
    isSubmittingRef.current = false;
    isRecordingRef.current = true;
    hasHeardSpeechRef.current = false;
    lastSpeechTimeRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.start(200);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

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
          speechThresholdRef.current = Math.max(0.010, noiseFloorRef.current * 2.0);
          console.debug('[voice] calibrated noiseFloor=', noiseFloorRef.current.toFixed(4), 'threshold=', speechThresholdRef.current.toFixed(4));
          setIsCalibrating(false);
          setIsListening(true);
          requestAnimationFrame(checkSilence);
        }
      };

      const checkSilence = () => {
        analyser.getFloatTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        const speechThreshold = speechThresholdRef.current;
        const quietThreshold = Math.max(noiseFloorRef.current * 1.2, speechThreshold * 0.6);
        const isSpeech = rms >= speechThreshold;
        setSpeechActive(isSpeech);

        const instLevel = Math.min(1, rms * 12);
        const ema = 0.3 * instLevel + 0.7 * emaLevelRef.current;
        emaLevelRef.current = ema;
        setInputLevel(ema);

        const now = Date.now();
        if (isSpeech) {
          lastSpeechTimeRef.current = now;
          hasHeardSpeechRef.current = true;
        }

        const silenceAfterSpeechMs = now - lastSpeechTimeRef.current;
        const exceededSilence = hasHeardSpeechRef.current && silenceAfterSpeechMs >= 1200 && rms < quietThreshold;
        const exceededMax = now - sessionStartTimeRef.current >= 10000;
        const spokenLongEnough = hasHeardSpeechRef.current && (lastSpeechTimeRef.current - sessionStartTimeRef.current) >= 1000;

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
              handleSubmit(text.trim());
            }
          })();
          return;
        }

        if (isListening && isRecordingRef.current) {
          requestAnimationFrame(checkSilence);
        }
      };
      requestAnimationFrame(doCalibrate);
    } catch (err) {
      console.error('[voice] media recorder init failed', err);
    }
  };

  const toggleListening = () => {
    const recog = recognitionRef.current;
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

  const stopFloatingText = useCallback(() => {
    if (textFloatIntervalRef.current) {
      clearInterval(textFloatIntervalRef.current);
      textFloatIntervalRef.current = null;
    }
    setIsFloating(false);
    ttsService.stop();
  }, []);

  const handleCloseMedia = useCallback(() => {
    console.log('[App] Media closed manually');
    
    if (currentMedia?.type === 'video') {
      closeVideo();
    } else {
      advanceManually();
    }
  }, [currentMedia, advanceManually, closeVideo]);

  const sanitizeForDisplay = useCallback((text: string) => {
    return text
      .replace(/\(see: [^)]+\.(png|jpg|jpeg)\)/gi, '')
      .replace(/\(YouTube: https?:\/\/[^)]+\)/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }, []);

  // Handle text segments with TTS
  const startTextSegment = useCallback((text: string) => {
    console.log('[App] Starting text segment:', text.substring(0, 100));
    stopFloatingText();
    setFloatingText('');
    floatingTextIndexRef.current = 0;
    setIsFloating(true);

    const displayText = sanitizeForDisplay(text);

    // Use TTS if available
    if (ttsService.isSupported()) {
      console.log('[App] Using TTS for text segment');
      try {
        ttsService.onBoundary((charIndex) => {
          const safeIndex = Math.max(0, Math.min(charIndex, text.length));
          floatingTextIndexRef.current = safeIndex;
          const partial = text.substring(0, safeIndex);
          setFloatingText(sanitizeForDisplay(partial));
        });
        
        ttsService.onEnd(() => {
          console.log('[App] TTS ended, advancing sequence');
          stopFloatingText();
          setFloatingText(displayText);
          // Advance to next segment when TTS completes
          advanceManually();
        });
        
        ttsService.speak(text, { rate: 1, pitch: 1 });
      } catch (error) {
        console.error('[App] TTS error, falling back to streaming:', error);
        // Fallback to character streaming
        startCharacterStreaming(text, displayText);
      }
    } else {
      console.log('[App] TTS not supported, using character streaming');
      // Fallback to character streaming
      startCharacterStreaming(text, displayText);
    }
  }, [stopFloatingText, sanitizeForDisplay, advanceManually]);

  // Fallback character-by-character streaming
  const startCharacterStreaming = useCallback((fullText: string, displayText: string) => {
    console.log('[App] Starting character streaming');
    floatingTextIndexRef.current = 0;
    textFloatIntervalRef.current = setInterval(() => {
      if (floatingTextIndexRef.current < fullText.length) {
        const nextText = fullText.substring(0, floatingTextIndexRef.current + 1);
        setFloatingText(sanitizeForDisplay(nextText));
        floatingTextIndexRef.current++;
      } else {
        console.log('[App] Character streaming completed, advancing sequence');
        stopFloatingText();
        setFloatingText(displayText);
        // Advance to next segment when streaming completes
        advanceManually();
      }
    }, READING_SPEED_MS_PER_CHAR);
  }, [stopFloatingText, sanitizeForDisplay, advanceManually]);

  // Handle segment changes
  useEffect(() => {
    if (currentSegment) {
      console.log('[App] Current segment changed:', currentSegment.type, currentSegment.content?.substring(0, 50));
      
      if (currentSegment.type === 'text') {
        startTextSegment(currentSegment.content);
      } else if (currentSegment.type === 'image') {
        // For image segments, use the explanation text for TTS
        if (currentText) {
          startTextSegment(currentText);
        } else {
          // Fallback if no explanation text
          setFloatingText('');
          setIsFloating(false);
        }
      } else {
        // For video segments, clear text
        setFloatingText('');
        setIsFloating(false);
      }
    }
  }, [currentSegment, currentText, startTextSegment]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    console.log('[App] Handling submit:', query);

    const interruptionContext = interruptedTextRef.current;
    interruptedTextRef.current = '';

    stopFloatingText();
    stopSequence();
    setFloatingText('');
    
    const userMessage: Message = { role: Role.USER, content: query };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAiTeacherResponse(query, messages, interruptionContext || undefined);
      console.log('[App] Received AI response, starting sequence');
      
      const aiMessage: Message = { role: Role.ASSISTANT, content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
      
      // Add AI response to notes
      notesService.addNote(aiResponse);
      setSessionNotes(notesService.getNotes());
      
      originalAiResponseRef.current = aiResponse;
      
      // Start the media sequence
      startSequence(aiResponse);
      
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = { role: Role.ASSISTANT, content: "Oh dear, it seems my circuits are a bit scrambled. Could you try asking again?" };
      setMessages(prev => [...prev, errorMessage]);
      setFloatingText(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterrupt = () => {
    console.log('[App] Interrupt requested');
    stopFloatingText();
    stopSequence();
    interruptedTextRef.current = floatingText;
    ttsService.stop();
  };
  
  const handleEndLesson = () => {
    setShowEndConfirmation(true);
  };

  const handleConfirmEndLesson = (downloadNotes: boolean) => {
    console.log('[App] End lesson confirmed, download notes:', downloadNotes);
    
    if (downloadNotes && sessionNotes.length > 0) {
      downloadNotesAsPDF();
    }
    
    // Clear notes
    notesService.clearNotes();
    setSessionNotes([]);
    
    // Stop all media and reset state
    stopFloatingText();
    stopSequence();
    ttsService.stop();
    setFloatingText('');
    setMessages([]);
    setUserInput('');
    originalAiResponseRef.current = '';
    floatingTextIndexRef.current = 0;
    interruptedTextRef.current = '';
    hasProcessedInitialTopic.current = false;
    
    setShowEndConfirmation(false);
    
    // Navigate to home
    navigate('/');
  };

  const downloadNotesAsPDF = () => {
    const content = sessionNotes.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `AIRA_Notes_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenNotes = () => {
    setIsNotesModalOpen(true);
  };

  const handleOpenLessons = () => {
    navigate('/lessons');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Add TTS replay functionality as a separate button in the UI
  const handleReplayMessage = useCallback(() => {
    if (floatingText && ttsService.isSupported()) {
      console.log('[App] Replay button clicked, speaking text:', floatingText.substring(0, 50));
      ttsService.speak(floatingText, { rate: 1, pitch: 1 });
    }
  }, [floatingText]);

  useEffect(() => {
    return () => {
      stopFloatingText();
      stopSequence();
      ttsService.stop();
    };
  }, [stopFloatingText, stopSequence]);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white min-h-screen flex flex-col font-sans overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header Section */}
      <header className="relative z-10 w-full py-4 px-6 border-b border-blue-700 bg-gray-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ASK AIRA
            </h1>
            <p className="text-blue-200 text-sm font-medium">Your AI Science Teacher</p>
          </div>
          
          <div className="w-28 opacity-0">
            <button className="py-2 px-5 text-sm">Home</button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 max-w-7xl mx-auto w-full p-6">
        {/* Left Panel - AI Agent & Conversation */}
        <div className="flex-1 flex flex-col items-center lg:pr-8">
          {/* AI Agent Container - Fixed sizing for proper avatar display */}
          <div className="w-full max-w-2xl aspect-[3/2] bg-gray-800 bg-opacity-50 rounded-3xl border-2 border-blue-500 border-opacity-30 shadow-2xl mb-6 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <RobotAvatar 
                mediaInfo={currentMedia} 
                onClose={handleCloseMedia} 
                isSpeaking={isFloating || (isSequencePlaying && (currentSegment?.type === 'text' || currentSegment?.type === 'image'))} 
              />
            </div>
          </div>

          {/* Floating Message Display - Centered below avatar */}
          <div className="w-full max-w-2xl mb-8">
            <div className="w-full flex justify-center px-4">
              <MessageDisplay text={floatingText} />
            </div>
          </div>
        </div>

        {/* Right Panel - Controls & Actions */}
        <div className="lg:w-80 flex flex-col space-y-6 mt-8 lg:mt-0">
          {/* Quick Actions Card */}
          <div className="bg-gray-800 bg-opacity-50 rounded-2xl border border-blue-500 border-opacity-30 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-cyan-300 mb-4 text-center">Lesson Controls</h3>
            
            <div className="space-y-4">
              <button
                onClick={handleOpenNotes}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Notes ({sessionNotes.length})</span>
              </button>
            </div>
          </div>

          {/* Ask AIRA Card with Input and Buttons */}
          <div className="bg-gray-800 bg-opacity-50 rounded-2xl border border-purple-500 border-opacity-30 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-purple-300 mb-4 text-center">Ask AIRA</h3>
            
            <InputBar
              userInput={userInput}
              setUserInput={setUserInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isFloating={isFloating || isSequencePlaying}
              onInterrupt={handleInterrupt}
              onOmit={handleEndLesson}
              onOpenNotes={handleOpenNotes}
              onOpenLessons={handleOpenLessons}
              showNotesButton={false}
              showEndButton={false}
            />

            {/* Speak and Browse Lessons buttons below search */}
            <div className="mt-4 space-y-3">
              <button
                onClick={toggleListening}
                className={`w-full font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 ${isListening ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-purple-500 text-white hover:bg-purple-400'}`}
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{isListening ? 'Send' : 'Speak'}</span>
              </button>

              <button
                onClick={handleOpenLessons}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm">Browse Lessons</span>
              </button>
            </div>
          </div>

          {/* End Lesson Card */}
          <div className="bg-gray-800 bg-opacity-50 rounded-2xl border border-red-500 border-opacity-30 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-300 mb-4 text-center">Session Control</h3>
            
            <button
              onClick={handleEndLesson}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
            >
              End Lesson
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-3">
              Save your notes before ending
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-blue-700 bg-gray-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-blue-300 text-sm">
            AIRA - AI Science Teacher • Ask anything about science!
          </p>
        </div>
      </footer>

      {/* Modals */}
      <NotesModal 
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={sessionNotes}
      />

      {/* End Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-auto border-2 border-purple-500 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">End Lesson?</h3>
              <p className="text-gray-300 mb-6">
                Do you want to download your notes before ending this lesson?
              </p>
              
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => handleConfirmEndLesson(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 flex-1"
                >
                  No, Just End
                </button>
                <button
                  onClick={() => handleConfirmEndLesson(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 flex-1"
                >
                  Yes, Download & End
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return <ChatInterface />;
};

export default App;