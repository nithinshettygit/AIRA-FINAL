import React from 'react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string[];
}

export const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, notes }) => {
  if (!isOpen) return null;

  const formatNotes = (notes: string[]): string[] => {
    return notes.flatMap(note => {
      // Split by sentences and create bullet points
      const sentences = note.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.map(sentence => `• ${sentence.trim()}`);
    });
  };

  const formattedNotes = formatNotes(notes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Session Notes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {formattedNotes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No notes yet. Start a lesson to generate notes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formattedNotes.map((note, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-gray-750 rounded-lg border-l-4 border-green-500"
                >
                  <p className="text-white text-sm leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700 bg-gray-750 rounded-b-lg">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>{formattedNotes.length} note items</span>
            <button
              onClick={() => {
                const notesText = formattedNotes.join('\n');
                navigator.clipboard.writeText(notesText);
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              Copy All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};