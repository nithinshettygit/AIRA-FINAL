import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          isGuest: false
        };
        setUser(userData);
        localStorage.setItem('aira_user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('aira_user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load progress from localStorage on mount - personalized per user
  useEffect(() => {
    if (user) {
      const progressKey = user.isGuest ? 'aira_progress_guest' : `aira_progress_${user.id}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      } else {
        setProgress({});
      }
    } else {
      setProgress({});
    }
  }, [user]);

  // Save progress to localStorage whenever it changes - personalized per user
  useEffect(() => {
    if (user && Object.keys(progress).length > 0) {
      const progressKey = user.isGuest ? 'aira_progress_guest' : `aira_progress_${user.id}`;
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [progress, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Signup failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const useWithoutSignin = () => {
    const guestUser = {
      id: 'guest',
      email: 'guest@aira.com',
      name: 'Guest User',
      isGuest: true
    };
    setUser(guestUser);
    localStorage.setItem('aira_user', JSON.stringify(guestUser));
  };

  const markLessonCompleted = (lessonTitle) => {
    // Don't track progress for guest users
    if (!user || user.isGuest) {
      return;
    }

    const newProgress = {
      ...progress,
      [lessonTitle]: {
        completed: true,
        completedAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email
      }
    };
    setProgress(newProgress);
  };

  const markChapterCompleted = (chapterTitle, allLessons) => {
    // Don't track progress for guest users
    if (!user || user.isGuest) {
      return;
    }

    // Check if all lessons are completed
    const allCompleted = allLessons.every(lessonTitle => 
      progress[lessonTitle]?.completed
    );
    
    if (allCompleted && allLessons.length > 0) {
      const newProgress = {
        ...progress,
        [chapterTitle]: {
          completed: true,
          completedAt: new Date().toISOString(),
          userId: user.id,
          userEmail: user.email
        }
      };
      setProgress(newProgress);
    }
  };

  const isLessonCompleted = (lessonTitle) => {
    // Guest users don't have progress tracking
    if (!user || user.isGuest) {
      return false;
    }
    return progress[lessonTitle]?.completed || false;
  };

  const isChapterCompleted = (chapterTitle) => {
    // Guest users don't have progress tracking
    if (!user || user.isGuest) {
      return false;
    }
    return progress[chapterTitle]?.completed || false;
  };

  const getProgressStats = () => {
    const totalLessons = Object.keys(progress).length;
    const completedLessons = Object.values(progress).filter(p => p.completed).length;
    return { totalLessons, completedLessons };
  };

  const value = {
    user,
    progress,
    loading,
    authLoading,
    login,
    signup,
    logout,
    useWithoutSignin,
    markLessonCompleted,
    markChapterCompleted,
    isLessonCompleted,
    isChapterCompleted,
    getProgressStats
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
