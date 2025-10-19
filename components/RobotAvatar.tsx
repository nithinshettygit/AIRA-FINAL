  import React, { useState, useEffect, useRef } from 'react';
  import type { MediaInfo } from '../types';

  interface RobotAvatarProps {
    mediaInfo: MediaInfo | null;
    onClose: () => void;
    isSpeaking: boolean;
  }

  const MediaOverlay: React.FC<{ mediaInfo: MediaInfo; onClose: () => void }> = ({ mediaInfo, onClose }) => {
    const [showVideoControls, setShowVideoControls] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Send play command to YouTube iframe when it loads
    useEffect(() => {
      if (mediaInfo.type === 'video' && iframeRef.current) {
        const iframe = iframeRef.current;
        const onLoad = () => {
          console.log('[MediaOverlay] YouTube iframe loaded');
          // YouTube iframe API commands can be sent here if needed
        };
        
        iframe.addEventListener('load', onLoad);
        return () => iframe.removeEventListener('load', onLoad);
      }
    }, [mediaInfo]);

    return (
      <div 
        className="absolute inset-0 z-20 bg-black bg-opacity-70 flex items-center justify-center p-4 transition-opacity duration-500"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-title"
        onMouseEnter={() => mediaInfo.type === 'video' && setShowVideoControls(true)}
        onMouseLeave={() => mediaInfo.type === 'video' && setShowVideoControls(false)}
      >
        <div className="relative w-full h-full max-w-3xl max-h-[80%] rounded-lg overflow-hidden shadow-2xl">
          <h2 id="media-title" className="sr-only">
            {mediaInfo.type === 'image' ? 'Educational Image' : 'Educational Video'}
          </h2>
          {mediaInfo.type === 'image' && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <img 
                  src={mediaInfo.url} 
                  alt="Educational content" 
                  className="w-full h-full object-contain" 
                  onLoad={() => console.debug('[media] image loaded ok:', mediaInfo.url)}
                  onError={(e) => {
                    console.error('[media] image failed to load:', mediaInfo.url);
                    (e.currentTarget as HTMLImageElement).alt = 'Image unavailable';
                  }}
                />
              </div>
              {mediaInfo.explanation && (
                <div className="w-full bg-gray-900 bg-opacity-70 text-white p-4 border-t border-gray-700">
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{mediaInfo.explanation}</p>
                </div>
              )}
            </div>
          )}
          {mediaInfo.type === 'video' && (
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={mediaInfo.url}
                title="Educational Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => console.log('[media] YouTube iframe loaded')}
              ></iframe>
              
              {/* Video controls - show on hover */}
              {showVideoControls && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={onClose}
                    className="bg-red-600 text-white rounded-full p-3 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white shadow-lg"
                    aria-label="Close video and continue lesson"
                    title="Close video and continue"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Video hint message */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
                Video will auto-close when finished, or click X to close early
              </div>
            </div>
          )}
          
          {/* Close button for images (always visible) */}
          {mediaInfo.type === 'image' && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-30 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-label="Close image view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  // ... (keep the existing AnimatedRobot component exactly the same)

  const AnimatedRobot: React.FC<{isSpeaking: boolean}> = ({ isSpeaking }) => {
      const [isBlinking, setIsBlinking] = useState(false);
      const [mouthShape, setMouthShape] = useState('smile');
      const mouthShapes = ['open', 'oh', 'smile', 'ah'];

      // Blinking effect
      useEffect(() => {
          const blinkInterval = setInterval(() => {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 150);
          }, 4000);
          return () => clearInterval(blinkInterval);
      }, []);

      // Lip-sync effect
      useEffect(() => {
          let syncInterval: ReturnType<typeof setInterval> | null = null;
          if (isSpeaking) {
          syncInterval = setInterval(() => {
              const nextShape = mouthShapes[Math.floor(Math.random() * mouthShapes.length)];
              setMouthShape(nextShape);
          }, 150);
          } else {
          setMouthShape('smile');
          }
          return () => {
          if (syncInterval) clearInterval(syncInterval);
          };
      }, [isSpeaking]);
      
      const mouthPaths: {[key: string]: string} = {
          smile: "M 140 215 C 150 225, 170 225, 180 215",
          open: "M 145 215 C 155 230, 165 230, 175 215 Z",
          oh: "M 160 210 A 10 10 0 1 0 160 220 A 10 10 0 1 0 160 210 Z",
          ah: "M 150 210 C 155 225, 165 225, 170 210 Z"
      }

      return (
          <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
              <defs>
                  <radialGradient id="grad-face" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#d1d5db" />
                      <stop offset="100%" stopColor="#6b7280" />
                  </radialGradient>
                  <radialGradient id="grad-eye" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#a7f3d0" />
                      <stop offset="100%" stopColor="#10b981" />
                  </radialGradient>
                  <filter id="glow">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                      <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                  </filter>
              </defs>
              
              {/* Head */}
              <path d="M 80 280 C 10 180, 10 80, 80 40 L 240 40 C 310 80, 310 180, 240 280 Z" fill="url(#grad-face)" stroke="#4b5563" strokeWidth="2"/>
              
              {/* Antenna */}
              <line x1="160" y1="40" x2="160" y2="20" stroke="#9ca3af" strokeWidth="4" />
              <circle cx="160" cy="15" r="6" fill="#4ade80" filter="url(#glow)" />

              {/* Eyes */}
              <g id="left-eye">
                  <circle cx="120" cy="150" r="25" fill="#1f2937" />
                  <circle cx="120" cy="150" r="20" fill="url(#grad-eye)" />
                  <circle cx="120" cy="150" r="10" fill="#064e3b" />
                  <path d="M 95 130 C 105 125, 135 125, 145 130" stroke="#4b5563" strokeWidth="4" fill="none" />
                  {isBlinking && <path d="M 95 150 C 105 160, 135 160, 145 150" stroke="url(#grad-face)" strokeWidth="6" fill="url(#grad-face)"/>}
              </g>
              <g id="right-eye">
                  <circle cx="200" cy="150" r="25" fill="#1f2937" />
                  <circle cx="200" cy="150" r="20" fill="url(#grad-eye)" />
                  <circle cx="200" cy="150" r="10" fill="#064e3b" />
                  <path d="M 175 130 C 185 125, 215 125, 225 130" stroke="#4b5563" strokeWidth="4" fill="none" />
                  {isBlinking && <path d="M 175 150 C 185 160, 215 160, 225 150" stroke="url(#grad-face)" strokeWidth="6" fill="url(#grad-face)"/>}
              </g>

              {/* Mouth */}
              <path d={mouthPaths[mouthShape]} stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
      )
  }

  export const RobotAvatar: React.FC<RobotAvatarProps> = ({ mediaInfo, onClose, isSpeaking }) => {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[450px] h-[450px] md:w-[520px] md:h-[520px] lg:w-[600px] lg:h-[600px]">
          <AnimatedRobot isSpeaking={isSpeaking} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>
        {mediaInfo && <MediaOverlay mediaInfo={mediaInfo} onClose={onClose} />}
      </div>
    );
  };