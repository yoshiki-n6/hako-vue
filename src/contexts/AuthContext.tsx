import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup,
  deleteUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';

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

  const deleteGuestData = async (user: User) => {
    try {
      const batch = writeBatch(db);

      // userProfile を取得してチャンネルIDのリストを得る
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        const channelIds: string[] = profileData.channelIds || [];

        for (const channelId of channelIds) {
          // locations を削除
          const locationsSnap = await getDocs(collection(db, `channels/${channelId}/locations`));
          locationsSnap.forEach(d => batch.delete(d.ref));

          // items を削除
          const itemsSnap = await getDocs(collection(db, `channels/${channelId}/items`));
          itemsSnap.forEach(d => batch.delete(d.ref));

          // userFavorites を削除
          const favSnap = await getDocs(collection(db, `channels/${channelId}/userFavorites/${user.uid}/favorites`));
          favSnap.forEach(d => batch.delete(d.ref));

          // チャンネル自体を削除
          batch.delete(doc(db, 'channels', channelId));
        }

        // userProfile を削除
        batch.delete(profileRef);
      }

      await batch.commit();

      // Firebase Auth の匿名ユーザーアカウントも削除
      await deleteUser(user);
    } catch (error) {
      console.error('Error deleting guest data:', error);
      // データ削除に失敗してもサインアウトは続行する
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.isAnonymous) {
        await deleteGuestData(currentUser);
        // deleteUser によりすでにサインアウト済みなので signOut 不要
      } else {
        await signOut(auth);
      }
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
