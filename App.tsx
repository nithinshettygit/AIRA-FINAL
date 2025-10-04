
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RobotAvatar } from './components/RobotAvatar';
import { MessageDisplay } from './components/MessageDisplay';
import { InputBar } from './components/InputBar';
import { getAiTeacherResponse } from './services/apiService';
import type { MediaInfo } from './types';
import { Message, Role } from './types';
import { READING_SPEED_MS_PER_CHAR, MEDIA_OVERLAY_DURATION_MS } from './constants';

export default function App(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [floatingText, setFloatingText] = useState<string>('');
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);

  // Fix: Use ReturnType<typeof setInterval> for browser compatibility instead of NodeJS.Timeout
  const textFloatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
  const mediaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAiResponseRef = useRef<string>('');
  const floatingTextIndexRef = useRef<number>(0);
  const interruptedTextRef = useRef<string>('');

  const stopFloatingText = useCallback(() => {
    if (textFloatIntervalRef.current) {
      clearInterval(textFloatIntervalRef.current);
      textFloatIntervalRef.current = null;
    }
    setIsFloating(false);
  }, []);

  const handleCloseMedia = useCallback(() => {
    setMediaInfo(null);
    if (mediaTimeoutRef.current) {
      clearTimeout(mediaTimeoutRef.current);
      mediaTimeoutRef.current = null;
    }
  }, []);

  const parseAndDisplayMedia = useCallback((text: string) => {
    const imageRegex = /\(see: (.*?(\.png|\.jpg|\.jpeg))\)/ig;
    const videoRegex = /\(YouTube: (https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))\)/i;
    
    const imageMatches = Array.from(text.matchAll(imageRegex));
    const videoMatch = text.match(videoRegex);

    // Build a cleanedText without raw image paths
    let cleanedText = text;
    for (const match of imageMatches) {
      if (match[0]) {
        cleanedText = cleanedText.replace(match[0], '');
      }
    }

    // If we displayed floatingText, also reflect the cleanedText to avoid path showing
    if (cleanedText !== text) {
      currentAiResponseRef.current = cleanedText;
      setFloatingText(prev => prev.replace(text, cleanedText));
    }

    // If there is a video, prefer showing it
    if (videoMatch && videoMatch[2]) {
      const ytId = videoMatch[2];
      console.debug('[media] parsed YouTube id=', ytId);
      handleCloseMedia();
      setMediaInfo({ type: 'video', url: `https://www.youtube.com/embed/${ytId}` });
      mediaTimeoutRef.current = setTimeout(() => setMediaInfo(null), MEDIA_OVERLAY_DURATION_MS);
      return;
    }

    // For each image, sequentially display and narrate
    if (imageMatches.length > 0) {
      const baseUrl = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;
      const imageUrls = imageMatches.map(m => {
        const rawPath = (m && m[1]) ? m[1] : '';
        const filename = rawPath.split('\\').pop()?.split('/').pop() || rawPath;
        return `${baseUrl.replace(/\/$/, '')}/images/${encodeURIComponent(filename)}`;
      });

      // Build a brief 3-4 minute style narration placeholder per image
      const perImageNarrations = imageUrls.map((_, idx) => (
        `Let us closely examine this diagram (${idx + 1}/${imageUrls.length}). Notice the key parts and how they connect. ` +
        `First, identify the main components; then follow the arrows or labels to see relationships. ` +
        `Observe proportions and any repeated patterns—they often hint at function. ` +
        `Imagine explaining the flow to a friend: what enters, what changes, and what leaves.`
      ));

      // Sequentially show each image with its narration below the image overlay
      let index = 0;
      const showNext = () => {
        if (index >= imageUrls.length) {
          mediaTimeoutRef.current = setTimeout(() => setMediaInfo(null), MEDIA_OVERLAY_DURATION_MS);
          return;
        }
        const explanation = perImageNarrations[index];
        setMediaInfo({ type: 'image', url: imageUrls[index], explanation });
        index++;
        // Keep image on screen ~10s; user can close earlier. This simulates a multi-minute walkthrough per image.
        if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
        mediaTimeoutRef.current = setTimeout(showNext, 10000);
      };

      handleCloseMedia();
      showNext();
    }
  }, [handleCloseMedia]);

  const startFloatingText = useCallback((fullText: string) => {
    stopFloatingText();
    setFloatingText('');
    floatingTextIndexRef.current = 0;
    currentAiResponseRef.current = fullText;
    setIsFloating(true);

    textFloatIntervalRef.current = setInterval(() => {
      if (floatingTextIndexRef.current < currentAiResponseRef.current.length) {
        const nextChar = currentAiResponseRef.current[floatingTextIndexRef.current];
        setFloatingText(prev => prev + nextChar);
        floatingTextIndexRef.current++;
        
        const currentDisplayedText = currentAiResponseRef.current.substring(0, floatingTextIndexRef.current);
        // Only parse when a potential media link might have just completed
        if (currentDisplayedText.endsWith(')')) { 
             parseAndDisplayMedia(currentDisplayedText);
        }
      } else {
        stopFloatingText();
        // Final media check on the whole text
        parseAndDisplayMedia(currentAiResponseRef.current);
      }
    }, READING_SPEED_MS_PER_CHAR);
  }, [stopFloatingText, parseAndDisplayMedia]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const interruptionContext = interruptedTextRef.current;
    interruptedTextRef.current = ''; // Clear after use

    stopFloatingText();
    setFloatingText('');
    
    const userMessage: Message = { role: Role.USER, content: query };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAiTeacherResponse(query, messages, interruptionContext || undefined);
      const aiMessage: Message = { role: Role.ASSISTANT, content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
      startFloatingText(aiResponse);
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
    stopFloatingText();
    interruptedTextRef.current = floatingText;
  };
  
  const handleOmit = () => {
    stopFloatingText();
    setFloatingText(currentAiResponseRef.current);
    parseAndDisplayMedia(currentAiResponseRef.current);
  };

  useEffect(() => {
    return () => { // Cleanup on unmount
      stopFloatingText();
      if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
    };
  }, [stopFloatingText]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center">
        <RobotAvatar mediaInfo={mediaInfo} onClose={handleCloseMedia} isSpeaking={isFloating} />
        <MessageDisplay text={floatingText} />
      </div>
      <InputBar
        userInput={userInput}
        setUserInput={setUserInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isFloating={isFloating}
        onInterrupt={handleInterrupt}
        onOmit={handleOmit}
      />
    </div>
  );
}
