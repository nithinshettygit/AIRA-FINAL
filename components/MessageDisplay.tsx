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

  // Show the last N words for a subtitle-like effect while keeping full centering
  const words = text.trim().split(/\s+/);
  const displayedText =
    words.length > MAX_WORDS_SUBTITLE ? words.slice(-MAX_WORDS_SUBTITLE).join(' ') : words.join(' ');

  return (
    <div className="w-full flex items-center justify-center">
      <div className="bg-black bg-opacity-60 rounded-2xl px-6 py-4 max-w-2xl mx-auto">
        <p
          className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white text-center"
          style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}
        >
          {displayedText}
        </p>
      </div>
    </div>
  );
};
