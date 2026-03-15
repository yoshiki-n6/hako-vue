import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Types
export interface Channel {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: any;
}

export interface UserProfile {
  userId: string;
  defaultChannelId: string;
  channelIds: string[];
  migrated: boolean;
  createdAt: any;
}

interface ChannelContextType {
  currentChannel: Channel | null;
  channels: Channel[];
  userProfile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  createChannel: (name: string, isDefault?: boolean) => Promise<Channel>;
  joinChannelByCode: (code: string) => Promise<Channel>;
  switchChannel: (channelId: string) => Promise<void>;
  setDefaultChannel: (channelId: string) => Promise<void>;
  getInviteCode: (channelId: string) => string | null;
  migrateExistingData: () => Promise<void>;
  completeOnboarding: (_mode: 'solo' | 'shared', channelId: string) => Promise<void>;
}

const ChannelContext = createContext<ChannelContextType | null>(null);

export function useChannel() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}

// Generate 6-character alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate unique invite code using timestamp + random for uniqueness
function generateUniqueInviteCode(): string {
  // Use timestamp base to ensure uniqueness without DB query
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  const random = generateInviteCode().slice(0, 3);
  return timestamp + random;
}

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Load user profile and channels
  useEffect(() => {
    if (!currentUser) {
      setCurrentChannel(null);
      setChannels([]);
      setUserProfile(null);
      setLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    console.log('[v0] Loading user profile for:', currentUser.uid);
    setLoading(true);
    
    const loadProfile = async () => {
      try {
        const profileRef = doc(db, 'userProfiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        console.log('[v0] Profile exists:', profileSnap.exists());
        
        if (profileSnap.exists()) {
          const profile = { userId: currentUser.uid, ...profileSnap.data() } as UserProfile;
          setUserProfile(profile);
          setNeedsOnboarding(false);
          
          // Load all channels the user belongs to
          if (profile.channelIds && profile.channelIds.length > 0) {
            console.log('[v0] Loading channels:', profile.channelIds);
            const channelPromises = profile.channelIds.map(async (channelId) => {
              try {
                const channelDoc = await getDoc(doc(db, 'channels', channelId));
                if (channelDoc.exists()) {
                  return { id: channelDoc.id, ...channelDoc.data() } as Channel;
                }
              } catch (err) {
                console.error('[v0] Error loading channel:', channelId, err);
              }
              return null;
            });
            
            const loadedChannels = (await Promise.all(channelPromises)).filter(Boolean) as Channel[];
            console.log('[v0] Loaded channels:', loadedChannels.length);
            setChannels(loadedChannels);
            
            // Set current channel to default or first
            const defaultChannel = loadedChannels.find(c => c.id === profile.defaultChannelId) || loadedChannels[0];
            if (defaultChannel) {
              setCurrentChannel(defaultChannel);
              console.log('[v0] Set current channel:', defaultChannel.name);
            }
          }
          setLoading(false);
        } else {
          // No profile exists - new user needs onboarding
          console.log('[v0] No profile found, needs onboarding');
          setNeedsOnboarding(true);
          setUserProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[v0] Error loading profile:', error);
        // On permission error, show onboarding
        setNeedsOnboarding(true);
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [currentUser]);

  // Create a new channel
  const createChannel = useCallback(async (name: string, isDefault = false): Promise<Channel> => {
    if (!currentUser) throw new Error('Not logged in');

    console.log('[v0] createChannel: starting...', { name, isDefault });

    const inviteCode = generateUniqueInviteCode();
    console.log('[v0] createChannel: generated invite code:', inviteCode);
    
    const channelRef = doc(collection(db, 'channels'));
    
    const channelData: Omit<Channel, 'id'> = {
      name,
      ownerId: currentUser.uid,
      inviteCode,
      memberIds: [currentUser.uid],
      createdAt: serverTimestamp()
    };

    await setDoc(channelRef, channelData);
    console.log('[v0] createChannel: channel document created:', channelRef.id);
    
    const newChannel: Channel = { id: channelRef.id, ...channelData };

    // Only update existing profile - don't try to read if it might not exist
    if (userProfile) {
      console.log('[v0] createChannel: updating existing profile');
      const profileRef = doc(db, 'userProfiles', currentUser.uid);
      await updateDoc(profileRef, {
        channelIds: [...userProfile.channelIds, channelRef.id],
        ...(isDefault ? { defaultChannelId: channelRef.id } : {})
      });
    }

    console.log('[v0] createChannel: completed successfully');
    return newChannel;
  }, [currentUser, userProfile]);

  // Join channel by invite code
  const joinChannelByCode = useCallback(async (code: string): Promise<Channel> => {
    if (!currentUser) throw new Error('Not logged in');

    const normalizedCode = code.toUpperCase().trim();
    const q = query(collection(db, 'channels'), where('inviteCode', '==', normalizedCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('招待コードが見つかりません');
    }

    const channelDoc = snapshot.docs[0];
    const channelData = channelDoc.data() as Omit<Channel, 'id'>;

    // Check if already a member
    if (channelData.memberIds.includes(currentUser.uid)) {
      return { id: channelDoc.id, ...channelData };
    }

    // Add user to channel
    await updateDoc(doc(db, 'channels', channelDoc.id), {
      memberIds: [...channelData.memberIds, currentUser.uid]
    });

    // Update user profile
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile;
      await updateDoc(profileRef, {
        channelIds: [...profile.channelIds, channelDoc.id]
      });
    }

    return { id: channelDoc.id, ...channelData, memberIds: [...channelData.memberIds, currentUser.uid] };
  }, [currentUser]);

  // Switch current channel
  const switchChannel = useCallback(async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    }
  }, [channels]);

  // Set default channel
  const setDefaultChannel = useCallback(async (channelId: string) => {
    if (!currentUser) throw new Error('Not logged in');
    
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await updateDoc(profileRef, {
      defaultChannelId: channelId
    });
  }, [currentUser]);

  // Get invite code for a channel
  const getInviteCode = useCallback((channelId: string): string | null => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.inviteCode || null;
  }, [channels]);

  // Migrate existing user data to a new channel
  const migrateExistingData = useCallback(async () => {
    if (!currentUser) throw new Error('Not logged in');

    console.log('[v0] migrateExistingData: starting...');
    
    // Step 1: Create channel first (separate from batch to ensure it exists)
    const inviteCode = generateUniqueInviteCode();
    const channelRef = doc(collection(db, 'channels'));
    
    await setDoc(channelRef, {
      name: 'マイチャンネル',
      ownerId: currentUser.uid,
      inviteCode,
      memberIds: [currentUser.uid],
      createdAt: serverTimestamp()
    });
    console.log('[v0] migrateExistingData: channel created:', channelRef.id);

    // Step 2: Create user profile (so user has access to channel)
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      defaultChannelId: channelRef.id,
      channelIds: [channelRef.id],
      migrated: true,
      createdAt: serverTimestamp()
    });
    console.log('[v0] migrateExistingData: profile created');

    // Step 3: Migrate data in batch
    const batch = writeBatch(db);

    // Migrate locations
    const locationsSnap = await getDocs(collection(db, `users/${currentUser.uid}/locations`));
    console.log('[v0] migrateExistingData: locations to migrate:', locationsSnap.size);
    locationsSnap.forEach((locDoc) => {
      const newLocRef = doc(collection(db, `channels/${channelRef.id}/locations`));
      batch.set(newLocRef, {
        ...locDoc.data(),
        channelId: channelRef.id
      });
    });

    // Migrate items
    const itemsSnap = await getDocs(collection(db, `users/${currentUser.uid}/items`));
    console.log('[v0] migrateExistingData: items to migrate:', itemsSnap.size);
    itemsSnap.forEach((itemDoc) => {
      const newItemRef = doc(collection(db, `channels/${channelRef.id}/items`));
      batch.set(newItemRef, {
        ...itemDoc.data(),
        channelId: channelRef.id
      });
    });

    if (locationsSnap.size > 0 || itemsSnap.size > 0) {
      await batch.commit();
      console.log('[v0] migrateExistingData: data migration completed');
    } else {
      console.log('[v0] migrateExistingData: no data to migrate');
    }
  }, [currentUser]);

  // Complete onboarding
  const completeOnboarding = useCallback(async (_mode: 'solo' | 'shared', channelId: string) => {
    if (!currentUser) throw new Error('Not logged in');

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      defaultChannelId: channelId,
      channelIds: [channelId],
      migrated: false,
      createdAt: serverTimestamp()
    });
  }, [currentUser]);

  const value = {
    currentChannel,
    channels,
    userProfile,
    loading,
    needsOnboarding,
    createChannel,
    joinChannelByCode,
    switchChannel,
    setDefaultChannel,
    getInviteCode,
    migrateExistingData,
    completeOnboarding
  };

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  );
}
