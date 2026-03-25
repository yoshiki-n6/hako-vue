import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isGuest: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  linkGuestWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isGuest = currentUser?.isAnonymous ?? false;

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("[v0] Google login successful:", result.user.email);
    } catch (error: any) {
      console.error("[v0] Error signing in with Google:", error.code, error.message);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try {
      const result = await signInAnonymously(auth);
      console.log("[v0] Guest login successful:", result.user.uid);
    } catch (error: any) {
      console.error("[v0] Error signing in as guest:", error.code, error.message);
      throw error;
    }
  };

  const linkGuestWithGoogle = async () => {
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('ゲストユーザーのみ連携できます');
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await linkWithPopup(currentUser, provider);
      console.log("[v0] Guest linked with Google:", result.user.email);
    } catch (error: any) {
      console.error("[v0] Error linking guest with Google:", error.code, error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    isGuest,
    loginWithGoogle,
    loginAsGuest,
    linkGuestWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
