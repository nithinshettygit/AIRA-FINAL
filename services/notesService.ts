const NOTES_STORAGE_KEY = 'aira_session_notes';

export interface NotesService {
  getNotes: () => string[];
  addNote: (note: string) => void;
  clearNotes: () => void;
}

export const notesService: NotesService = {
  getNotes: (): string[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const notes = localStorage.getItem(NOTES_STORAGE_KEY);
      return notes ? JSON.parse(notes) : [];
    } catch (error) {
      console.error('Error reading notes from localStorage:', error);
      return [];
    }
  },

  addNote: (note: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const currentNotes = notesService.getNotes();
      const updatedNotes = [...currentNotes, note];
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Error saving note to localStorage:', error);
    }
  },

  clearNotes: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(NOTES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notes from localStorage:', error);
    }
  },
};