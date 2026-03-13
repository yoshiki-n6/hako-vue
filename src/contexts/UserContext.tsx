import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

export interface Channel {
    id: string;
    name: string;
    description: string;
    mode: 'single' | 'shared';
    createdAt: any;
}

export interface UserProfile {
    uid: string;
    currentChannelId: string | null;
    channelIds: string[];
}

interface UserContextType {
    userProfile: UserProfile | null;
    loading: boolean;
    createChannel: (name: string, description: string, mode: 'single' | 'shared') => Promise<string>;
}

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { currentUser, loading: authLoading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserProfile() {
            if (!currentUser) {
                setUserProfile(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const userDocRef = doc(db, `users/${currentUser.uid}/profile/main`);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                } else {
                    // If profile doesn't exist, they haven't created a channel yet.
                    setUserProfile({
                        uid: currentUser.uid,
                        currentChannelId: null,
                        channelIds: []
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            fetchUserProfile();
        }
    }, [currentUser, authLoading]);

    const createChannel = async (name: string, description: string, mode: 'single' | 'shared') => {
        if (!currentUser) throw new Error("Not logged in");

        // 1. Create the new channel
        const newChannelRef = doc(collection(db, 'channels'));
        const channelData: Channel = {
            id: newChannelRef.id,
            name,
            description,
            mode,
            createdAt: serverTimestamp()
        };
        await setDoc(newChannelRef, channelData);

        // 2. Update user profile
        const userProfileRef = doc(db, `users/${currentUser.uid}/profile/main`);

        // Check if they are creating their first channel
        let currentChannelIds = userProfile?.channelIds || [];
        const newProfile: UserProfile = {
            uid: currentUser.uid,
            currentChannelId: newChannelRef.id, // Set as current
            channelIds: [...currentChannelIds, newChannelRef.id]
        };

        await setDoc(userProfileRef, newProfile, { merge: true });

        // Update local state
        setUserProfile(newProfile);

        return newChannelRef.id;
    };

    const value = {
        userProfile,
        loading: loading || authLoading,
        createChannel
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
