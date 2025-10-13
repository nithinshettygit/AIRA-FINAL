import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaInfo } from '../types';
import { backendBaseUrl } from '../services/apiService';

export interface MediaSegment {
  type: 'text' | 'image' | 'video';
  content: string;
  duration?: number;
  url?: string;
  explanation?: string;
}

export const useMediaSequencer = () => {
  const [segments, setSegments] = useState<MediaSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [currentText, setCurrentText] = useState<string>('');
  
  const segmentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoEndListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Extract filename from absolute path (Windows/Linux compatible)
  const extractFilename = useCallback((fullPath: string): string => {
    const windowsMatch = fullPath.match(/[^\\]+$/);
    if (windowsMatch) return windowsMatch[0];
    
    const linuxMatch = fullPath.match(/[^/]+$/);
    if (linuxMatch) return linuxMatch[0];
    
    return fullPath;
  }, []);

  // Generate image explanations based on context
  const generateImageExplanation = useCallback((imageName: string, index: number, total: number): string => {
    const explanations = [
      `Let's examine ${imageName}. Notice the key structures and how they relate to each other.`,
      `Looking at ${imageName}, you can see the main components I was describing.`,
      `This diagram ${imageName} illustrates the concept perfectly. Observe the details.`,
      `${imageName} shows exactly what we're discussing. Pay attention to the labeled parts.`
    ];
    return explanations[index % explanations.length];
  }, []);

  // Setup YouTube video end detection
  const setupVideoEndDetection = useCallback((videoId: string, onVideoEnd: () => void) => {
    // Remove previous listener if exists
    if (videoEndListenerRef.current) {
      window.removeEventListener('message', videoEndListenerRef.current);
      videoEndListenerRef.current = null;
    }

    // Create new listener for YouTube events
    const messageListener = (event: MessageEvent) => {
      try {
        // YouTube iframe API events
        if (event.origin !== 'https://www.youtube.com') return;
        
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange') {
          // Video ended (state = 0)
          if (data.info === 0) {
            console.log('[MediaSequencer] Video ended, advancing automatically');
            onVideoEnd();
          }
        }
      } catch (error) {
        // Not a YouTube message or not JSON
      }
    };

    videoEndListenerRef.current = messageListener;
    window.addEventListener('message', messageListener);

    return () => {
      if (videoEndListenerRef.current) {
        window.removeEventListener('message', videoEndListenerRef.current);
        videoEndListenerRef.current = null;
      }
    };
  }, []);

  // Parse AI response into sequential segments
  const parseResponse = useCallback((text: string): MediaSegment[] => {
    console.log('[MediaSequencer] Parsing response:', text.substring(0, 200));
    
    const result: MediaSegment[] = [];
    
    // Improved regex patterns
    const imageRegex = /\(see:\s*([^)]+\.(?:png|jpg|jpeg))\)/gi;
    const videoRegex = /\(YouTube:\s*(https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))\)/gi;
    
    // Find all media markers
    const mediaMarkers: Array<{
      index: number; 
      type: 'image' | 'video'; 
      match: string; 
      url: string;
      fullMatch: string;
    }> = [];
    
    let match;
    while ((match = imageRegex.exec(text)) !== null) {
      console.log('[MediaSequencer] Found image:', match[1]);
      mediaMarkers.push({
        index: match.index,
        type: 'image',
        match: match[0],
        url: match[1],
        fullMatch: match[0]
      });
    }
    
    while ((match = videoRegex.exec(text)) !== null) {
      console.log('[MediaSequencer] Found video:', match[2]);
      mediaMarkers.push({
        index: match.index,
        type: 'video', 
        match: match[0],
        url: match[2],
        fullMatch: match[0]
      });
    }
    
    console.log('[MediaSequencer] Total media markers:', mediaMarkers.length);
    
    // Sort by position in text
    mediaMarkers.sort((a, b) => a.index - b.index);
    
    // Split text into segments around media markers
    let lastIndex = 0;
    
    mediaMarkers.forEach((marker, idx) => {
      // Add text before media
      const textBefore = text.substring(lastIndex, marker.index).trim();
      if (textBefore) {
        result.push({
          type: 'text',
          content: textBefore
        });
      }
      
      // Add media segment
      if (marker.type === 'image') {
        const filename = extractFilename(marker.url);
        const explanation = generateImageExplanation(filename, idx, mediaMarkers.length);
        
        result.push({
          type: 'image',
          content: filename,
          duration: 20000, // 20 seconds for image with explanation
          explanation: explanation
        });
      } else if (marker.type === 'video') {
        result.push({
          type: 'video', 
          content: marker.url,
          duration: 0 // 0 means wait for video end or manual close
        });
      }
      
      lastIndex = marker.index + marker.fullMatch.length;
    });
    
    // Add remaining text after last media
    const remaining = text.substring(lastIndex).trim();
    if (remaining) {
      result.push({
        type: 'text',
        content: remaining
      });
    }
    
    console.log('[MediaSequencer] Parsed segments:', result);
    return result;
  }, [extractFilename, generateImageExplanation]);

  // Start sequence with new AI response
  const startSequence = useCallback((fullText: string) => {
    console.log('[MediaSequencer] Starting sequence with text length:', fullText.length);
    const parsedSegments = parseResponse(fullText);
    setSegments(parsedSegments);
    setCurrentIndex(0);
    setIsPlaying(true);
    setCurrentMedia(null);
    setCurrentText('');
    
    console.log('[MediaSequencer] Sequence started with', parsedSegments.length, 'segments');
  }, [parseResponse]);

  // Advance to next segment
  const nextSegment = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      console.log('[MediaSequencer] Advancing to segment:', next);
      if (next >= segments.length) {
        setIsPlaying(false);
        setCurrentMedia(null);
        setCurrentText('');
        console.log('[MediaSequencer] Sequence completed');
      }
      return next;
    });
  }, [segments.length]);

  // Get current segment
  const currentSegment = segments[currentIndex];

  // Handle segment changes
  useEffect(() => {
    if (!currentSegment || !isPlaying) {
      console.log('[MediaSequencer] No segment or not playing');
      return;
    }

    console.log('[MediaSequencer] Processing segment:', currentSegment.type, currentSegment.content);

    // Clear any existing timeout
    if (segmentTimeoutRef.current) {
      clearTimeout(segmentTimeoutRef.current);
      segmentTimeoutRef.current = null;
    }

    // Cleanup video listener if switching away from video
    if (currentSegment.type !== 'video' && videoEndListenerRef.current) {
      window.removeEventListener('message', videoEndListenerRef.current);
      videoEndListenerRef.current = null;
    }

    if (currentSegment.type === 'image') {
      // Build proper image URL
      const imageUrl = `${backendBaseUrl}/images/${currentSegment.content}`;
      console.log('[MediaSequencer] Setting image media:', imageUrl);
      
      setCurrentMedia({
        type: 'image',
        url: imageUrl,
        explanation: currentSegment.explanation
      });
      
      // Set the explanation text for TTS
      setCurrentText(currentSegment.explanation || 'Let me explain this diagram...');
      
      // Auto-advance after image duration (20 seconds)
      segmentTimeoutRef.current = setTimeout(() => {
        console.log('[MediaSequencer] Image display time completed, advancing');
        nextSegment();
      }, currentSegment.duration || 20000);
      
    } else if (currentSegment.type === 'video') {
      // Build proper YouTube embed URL with API enabled
      const videoUrl = `https://www.youtube.com/embed/${currentSegment.content}?autoplay=1&enablejsapi=1&rel=0&origin=${window.location.origin}`;
      console.log('[MediaSequencer] Setting video media:', videoUrl);
      
      setCurrentMedia({
        type: 'video',
        url: videoUrl
      });
      
      // Clear text during video
      setCurrentText('');
      
      // Setup video end detection
      const cleanupVideoListener = setupVideoEndDetection(currentSegment.content, nextSegment);
      
      // Also set a safety timeout (10 minutes) in case video end detection fails
      segmentTimeoutRef.current = setTimeout(() => {
        console.log('[MediaSequencer] Video safety timeout reached, advancing');
        cleanupVideoListener();
        nextSegment();
      }, 600000); // 10 minutes safety timeout
      
      return cleanupVideoListener;
      
    } else if (currentSegment.type === 'text') {
      // Clear media for text segments
      console.log('[MediaSequencer] Text segment, clearing media');
      setCurrentMedia(null);
      setCurrentText(currentSegment.content);
      // Text segments are advanced manually via TTS completion
    }

    return () => {
      if (segmentTimeoutRef.current) {
        clearTimeout(segmentTimeoutRef.current);
      }
    };
  }, [currentSegment, isPlaying, nextSegment, setupVideoEndDetection]);

  // Stop sequence
  const stopSequence = useCallback(() => {
    console.log('[MediaSequencer] Stopping sequence');
    setIsPlaying(false);
    setSegments([]);
    setCurrentIndex(0);
    setCurrentMedia(null);
    setCurrentText('');
    if (segmentTimeoutRef.current) {
      clearTimeout(segmentTimeoutRef.current);
      segmentTimeoutRef.current = null;
    }
    if (videoEndListenerRef.current) {
      window.removeEventListener('message', videoEndListenerRef.current);
      videoEndListenerRef.current = null;
    }
  }, []);

  // Manually advance (for text segments when TTS completes)
  const advanceManually = useCallback(() => {
    console.log('[MediaSequencer] Manual advance requested');
    if (currentSegment?.type === 'text') {
      nextSegment();
    }
  }, [currentSegment, nextSegment]);

  // Manually close video (user-triggered)
  const closeVideo = useCallback(() => {
    console.log('[MediaSequencer] Video closed manually, advancing');
    if (segmentTimeoutRef.current) {
      clearTimeout(segmentTimeoutRef.current);
      segmentTimeoutRef.current = null;
    }
    if (videoEndListenerRef.current) {
      window.removeEventListener('message', videoEndListenerRef.current);
      videoEndListenerRef.current = null;
    }
    nextSegment();
  }, [nextSegment]);

  return {
    segments,
    currentSegment,
    currentMedia,
    currentText,
    currentIndex,
    totalSegments: segments.length,
    isPlaying,
    hasNext: currentIndex < segments.length - 1,
    startSequence,
    stopSequence,
    nextSegment,
    advanceManually,
    closeVideo
  };
};