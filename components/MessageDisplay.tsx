
import React from 'react';

interface MessageDisplayProps {
  text: string;
}

// Determines how many of the last words to show in the subtitle.
const MAX_WORDS_SUBTITLE = 20;

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ text }) => {
  if (!text) {
    return null;
  }

  // Process the text to only show the last N words for a subtitle effect.
  const words = text.trim().split(/\s+/);
  const displayedText = words.slice(-MAX_WORDS_SUBTITLE).join(' ');

  return (
    <div 
      className="absolute bottom-16 w-full px-4 md:px-8 z-10 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-4xl mx-auto">
        <p 
          className="text-center text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white transition-all duration-150"
          style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
        >
          {displayedText}
        </p>
      </div>
    </div>
  );
};
