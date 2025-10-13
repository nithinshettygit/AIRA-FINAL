import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RobotAvatar } from './components/RobotAvatar';
import { MessageDisplay } from './components/MessageDisplay';
import { InputBar } from './components/InputBar';
import { getAiTeacherResponse } from './services/apiService';
import { ttsService } from './services/ttsService';
import { useMediaSequencer } from './hooks/useMediaSequencer';
import type { MediaInfo } from './types';
import { Message, Role } from './types';
import { READING_SPEED_MS_PER_CHAR } from './constants';

export default function App(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [floatingText, setFloatingText] = useState<string>('');
  const [isFloating, setIsFloating] = useState<boolean>(false);

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

  const textFloatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalAiResponseRef = useRef<string>('');
  const floatingTextIndexRef = useRef<number>(0);
  const interruptedTextRef = useRef<string>('');

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
      // For videos, use special closeVideo function
      closeVideo();
    } else {
      // For images and other media, advance normally
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
    console.log('[App] End lesson requested');
    stopFloatingText();
    stopSequence();
    ttsService.stop();
    setFloatingText('');
    originalAiResponseRef.current = '';
    floatingTextIndexRef.current = 0;
    interruptedTextRef.current = '';
  };

  useEffect(() => {
    return () => {
      stopFloatingText();
      stopSequence();
      ttsService.stop();
    };
  }, [stopFloatingText, stopSequence]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center">
        <RobotAvatar 
          mediaInfo={currentMedia} 
          onClose={handleCloseMedia} 
          isSpeaking={isFloating || (isSequencePlaying && (currentSegment?.type === 'text' || currentSegment?.type === 'image'))} 
        />
        <MessageDisplay text={floatingText} />
      </div>
      <InputBar
        userInput={userInput}
        setUserInput={setUserInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isFloating={isFloating || isSequencePlaying}
        onInterrupt={handleInterrupt}
        onOmit={handleEndLesson}
        onEnd={handleEndLesson}
      />
    </div>
  );
}