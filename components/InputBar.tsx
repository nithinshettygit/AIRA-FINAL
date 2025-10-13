// frontend/components/InputBar.tsx
import React from 'react';

interface InputBarProps {
    userInput: string;
    setUserInput: (value: string) => void;
    onSubmit: (query: string) => void;
    isLoading: boolean;
    isFloating: boolean;
    // CRITICAL: Updated wakeWordStatus definition from the hook
    wakeWordStatus?: 'initial' | 'ready' | 'wakeword_detected' | 'listening_query' | 'processing';
    isWakeWordListening?: boolean;
}

export const InputBar: React.FC<InputBarProps> = React.memo(({
    userInput,
    setUserInput,
    onSubmit,
    isLoading,
    isFloating,
    wakeWordStatus = 'initial', // Default to initial state
    isWakeWordListening = false
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.trim() && !isLoading) {
            onSubmit(userInput.trim());
            // setUserInput is handled by onSubmit in App.tsx now
        }
    };

    return (
        <div className="w-full max-w-3xl p-4 z-30">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask me anything about science..."
                    className="w-full p-4 pr-12 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    // CRITICAL FIX: Use the isFloating prop from App.tsx, which handles all disabling logic.
                    disabled={isLoading || isFloating}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim() || isFloating}
                    className={`absolute right-0 top-0 h-full w-12 text-white flex items-center justify-center transition-colors duration-200
                        ${(isLoading || !userInput.trim() || isFloating) ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </form>

            {isWakeWordListening && (
                <div className="text-center mt-2 space-y-1">
                    <div className="text-sm text-blue-300 transition-opacity duration-300">
                        
                        {/* Status: Ready for Wake Word */}
                        {wakeWordStatus === 'ready' && (
                            <span className="flex items-center justify-center space-x-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"/>
                                <span>Say "AIRA" to start...</span>
                            </span>
                        )}
                        
                        {/* Status: Wake Word Detected (Immediate recognition) */}
                        {wakeWordStatus === 'wakeword_detected' && (
                            <span className="flex items-center justify-center space-x-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                                <span>Wake word recognized!</span>
                            </span>
                        )}
                        
                        {/* Status: Listening for the full Query (After wake word) */}
                        {wakeWordStatus === 'listening_query' && (
                             <span className="flex items-center justify-center space-x-2">
                                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"/>
                                <span>🔴 LISTENING: Speak your full question (10s max)...</span>
                            </span>
                        )}
                        
                        {/* Status: Processing the audio chunk */}
                        {wakeWordStatus === 'processing' && (
                            <span className="flex items-center justify-center space-x-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
                                <span>Processing transcription...</span>
                            </span>
                        )}
                        
                        {/* Status: Initial is not shown here, as it's typically covered by 'isCalibrating' in App.tsx */}
                    </div>
                </div>
            )}
        </div>
    );
});