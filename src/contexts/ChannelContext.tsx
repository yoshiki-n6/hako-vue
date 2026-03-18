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
  writeBatch,
  deleteDoc,
  orderBy
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
  type: 'solo' | 'shared'; // solo: 一人暮らし用, shared: 共有用
}

export interface UserProfile {
  userId: string;
  defaultChannelId: string;
  channelIds: string[];
  migrated: boolean;
  createdAt: any;
  nickname?: string;
  photoURL?: string;
}

export interface ChannelMember {
  userId: string;
  nickname: string;
  photoURL: string;
}

export interface ActivityLog {
  id: string;
  channelId: string;
  type: 'item_taken_out' | 'item_stored' | 'member_joined' | 'member_left' | 'item_added';
  userId: string;
  userNickname: string;
  itemId?: string;
  itemName?: string;
  createdAt: any;
}

interface ChannelContextType {
  currentChannel: Channel | null;
  channels: Channel[];
  userProfile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  createChannel: (name: string, isDefault?: boolean, type?: 'solo' | 'shared') => Promise<Channel>;
  joinChannelByCode: (code: string) => Promise<Channel>;
  switchChannel: (channelId: string) => Promise<void>;
  setDefaultChannel: (channelId: string) => Promise<void>;
  getInviteCode: (channelId: string) => string | null;
  migrateExistingData: () => Promise<void>;
  completeOnboarding: (_mode: 'solo' | 'shared', channelId: string) => Promise<void>;
  updateProfile: (nickname: string, photoURL?: string) => Promise<void>;
  getChannelMembers: (channelId: string) => Promise<ChannelMember[]>;
  leaveChannel: (channelId: string) => Promise<void>;
  updateChannelName: (channelId: string, name: string) => Promise<void>;
  addActivityLog: (type: ActivityLog['type'], itemId?: string, itemName?: string) => Promise<void>;
  getActivityLogs: (channelId: string) => Promise<ActivityLog[]>;
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
          const profileData = profileSnap.data();
          // nicknameが未設定でGoogleのdisplayNameがある場合は自動保存
          if (!profileData.nickname && currentUser.displayName) {
            const updateData: Record<string, string> = { nickname: currentUser.displayName };
            if (!profileData.photoURL && currentUser.photoURL) {
              updateData.photoURL = currentUser.photoURL;
            }
            await updateDoc(profileRef, updateData);
            profileData.nickname = currentUser.displayName;
            if (updateData.photoURL) profileData.photoURL = currentUser.photoURL!;
          }
          const profile = { userId: currentUser.uid, ...profileData } as UserProfile;
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
  const createChannel = useCallback(async (name: string, isDefault = false, type: 'solo' | 'shared' = 'shared'): Promise<Channel> => {
    if (!currentUser) throw new Error('Not logged in');

    console.log('[v0] createChannel: starting...', { name, isDefault, type });

    const inviteCode = generateUniqueInviteCode();
    console.log('[v0] createChannel: generated invite code:', inviteCode);
    
    const channelRef = doc(collection(db, 'channels'));
    
    const channelData: Omit<Channel, 'id'> = {
      name,
      ownerId: currentUser.uid,
      inviteCode,
      memberIds: [currentUser.uid],
      createdAt: serverTimestamp(),
      type
    };

    await setDoc(channelRef, channelData);
    console.log('[v0] createChannel: channel document created:', channelRef.id);
    
    const newChannel: Channel = { id: channelRef.id, ...channelData };

    // Update or create profile
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    if (userProfile) {
      console.log('[v0] createChannel: updating existing profile');
      const newChannelIds = [...userProfile.channelIds, channelRef.id];
      await updateDoc(profileRef, {
        channelIds: newChannelIds,
        ...(isDefault ? { defaultChannelId: channelRef.id } : {})
      });
      
      // Update local state
      setChannels(prev => [...prev, newChannel]);
      setUserProfile(prev => prev ? {
        ...prev,
        channelIds: newChannelIds,
        ...(isDefault ? { defaultChannelId: channelRef.id } : {})
      } : null);
      console.log('[v0] createChannel: local state updated');
    } else {
      // Create new profile with Google account info
      console.log('[v0] createChannel: creating new profile');
      const newProfile = {
        defaultChannelId: channelRef.id,
        channelIds: [channelRef.id],
        migrated: false,
        createdAt: serverTimestamp(),
        ...(currentUser.displayName ? { nickname: currentUser.displayName } : {}),
        ...(currentUser.photoURL ? { photoURL: currentUser.photoURL } : {}),
      };
      await setDoc(profileRef, newProfile);
      
      // Update local state
      setChannels([newChannel]);
      setUserProfile({
        userId: currentUser.uid,
        defaultChannelId: channelRef.id,
        channelIds: [channelRef.id],
        nickname: currentUser.displayName || undefined,
        photoURL: currentUser.photoURL || undefined,
      } as UserProfile);
      setNeedsOnboarding(false);
      console.log('[v0] createChannel: new profile created');
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

    // Add join log for shared channels
    if (channelData.type === 'shared') {
      const profileSnap = await getDoc(doc(db, 'userProfiles', currentUser.uid));
      const data = profileSnap.exists() ? profileSnap.data() : null;
      const userNickname = data?.nickname
        || currentUser.displayName
        || (currentUser.email ? currentUser.email.split('@')[0] : null)
        || '名称未設定';
      
      const logRef = doc(collection(db, `channels/${channelDoc.id}/activityLogs`));
      await setDoc(logRef, {
        channelId: channelDoc.id,
        type: 'member_joined',
        userId: currentUser.uid,
        userNickname,
        createdAt: serverTimestamp()
      });
    }

    // Update user profile
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);
    
    const joinedChannel: Channel = { 
      id: channelDoc.id, 
      ...channelData, 
      memberIds: [...channelData.memberIds, currentUser.uid] 
    };
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile;
      const newChannelIds = [...profile.channelIds, channelDoc.id];
      await updateDoc(profileRef, {
        channelIds: newChannelIds
      });
      
      // Update local state
      setChannels(prev => [...prev, joinedChannel]);
      setUserProfile(prev => prev ? {
        ...prev,
        channelIds: newChannelIds
      } : null);
    } else {
      // Create new profile with Google account info
      const newProfile = {
        defaultChannelId: channelDoc.id,
        channelIds: [channelDoc.id],
        migrated: false,
        createdAt: serverTimestamp(),
        ...(currentUser.displayName ? { nickname: currentUser.displayName } : {}),
        ...(currentUser.photoURL ? { photoURL: currentUser.photoURL } : {}),
      };
      await setDoc(profileRef, newProfile);
      
      // Update local state
      setChannels([joinedChannel]);
      setUserProfile({
        userId: currentUser.uid,
        defaultChannelId: channelDoc.id,
        channelIds: [channelDoc.id],
        nickname: currentUser.displayName || undefined,
        photoURL: currentUser.photoURL || undefined,
      } as UserProfile);
      setNeedsOnboarding(false);
    }

    return joinedChannel;
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
    
    // Update local state
    setUserProfile(prev => prev ? {
      ...prev,
      defaultChannelId: channelId
    } : null);
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
      createdAt: serverTimestamp(),
      type: 'solo' // デフォルトは一人暮らし用
    });
    console.log('[v0] migrateExistingData: channel created:', channelRef.id);

    // Step 2: Create user profile (so user has access to channel)
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      defaultChannelId: channelRef.id,
      channelIds: [channelRef.id],
      migrated: true,
      createdAt: serverTimestamp(),
      // GoogleアカウントのdisplayNameとphotoURLを保存
      ...(currentUser.displayName ? { nickname: currentUser.displayName } : {}),
      ...(currentUser.photoURL ? { photoURL: currentUser.photoURL } : {}),
    });
    console.log('[v0] migrateExistingData: profile created');

    // Step 3: Migrate data in batch
    const batch = writeBatch(db);

    // Migrate locations and track old -> new ID mapping
    const locationsSnap = await getDocs(collection(db, `users/${currentUser.uid}/locations`));
    console.log('[v0] migrateExistingData: locations to migrate:', locationsSnap.size);
    const locationIdMap: Record<string, string> = {};
    
    locationsSnap.forEach((locDoc) => {
      const newLocRef = doc(collection(db, `channels/${channelRef.id}/locations`));
      locationIdMap[locDoc.id] = newLocRef.id; // Map old ID to new ID
      batch.set(newLocRef, {
        ...locDoc.data(),
        channelId: channelRef.id
      });
    });

    // Migrate items with updated locationId
    const itemsSnap = await getDocs(collection(db, `users/${currentUser.uid}/items`));
    console.log('[v0] migrateExistingData: items to migrate:', itemsSnap.size);
    itemsSnap.forEach((itemDoc) => {
      const itemData = itemDoc.data();
      const newItemRef = doc(collection(db, `channels/${channelRef.id}/items`));
      const newLocationId = locationIdMap[itemData.locationId] || itemData.locationId;
      batch.set(newItemRef, {
        ...itemData,
        locationId: newLocationId, // Use the new location ID
        channelId: channelRef.id
      });
    });

    if (locationsSnap.size > 0 || itemsSnap.size > 0) {
      await batch.commit();
      console.log('[v0] migrateExistingData: data migration completed');
    } else {
      console.log('[v0] migrateExistingData: no data to migrate');
    }

    // Update local state to prevent loop
    const newChannel: Channel = {
      id: channelRef.id,
      name: 'マイチャンネル',
      ownerId: currentUser.uid,
      inviteCode,
      memberIds: [currentUser.uid],
      createdAt: new Date(),
      type: 'solo'
    };
    const newProfile: UserProfile = {
      userId: currentUser.uid,
      defaultChannelId: channelRef.id,
      channelIds: [channelRef.id],
      migrated: true,
      createdAt: new Date()
    };
    
    setChannels([newChannel]);
    setCurrentChannel(newChannel);
    setUserProfile(newProfile);
    setNeedsOnboarding(false);
    console.log('[v0] migrateExistingData: local state updated');
  }, [currentUser]);

  // Update user profile (nickname and photo)
  const updateProfile = useCallback(async (nickname: string, photoURL?: string) => {
    if (!currentUser) throw new Error('Not logged in');
    
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    const updateData: { nickname: string; photoURL?: string } = { nickname };
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }
    
    await updateDoc(profileRef, updateData);
    
    // Update local state
    setUserProfile(prev => prev ? {
      ...prev,
      nickname,
      ...(photoURL !== undefined ? { photoURL } : {})
    } : null);
  }, [currentUser]);

  // Get channel members
  const getChannelMembers = useCallback(async (channelId: string): Promise<ChannelMember[]> => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return [];
    
    const memberPromises = channel.memberIds.map(async (memberId) => {
      try {
        const profileDoc = await getDoc(doc(db, 'userProfiles', memberId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          // nickname優先、なければdisplayName、なければメールアドレスの@前
          const nickname = data.nickname || data.displayName || (data.email ? data.email.split('@')[0] : null) || '名称未設定';
          return {
            userId: memberId,
            nickname,
            photoURL: data.photoURL || ''
          } as ChannelMember;
        }
      } catch (err) {
        console.error('Error loading member profile:', memberId, err);
      }
      return {
        userId: memberId,
        nickname: '名称未設定',
        photoURL: ''
      } as ChannelMember;
    });
    
    return Promise.all(memberPromises);
  }, [channels]);

  // Complete onboarding
  const completeOnboarding = useCallback(async (_mode: 'solo' | 'shared', channelId: string) => {
    if (!currentUser) throw new Error('Not logged in');

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      defaultChannelId: channelId,
      channelIds: [channelId],
      migrated: false,
      createdAt: serverTimestamp(),
      // GoogleアカウントのdisplayNameとphotoURLを保存
      ...(currentUser.displayName ? { nickname: currentUser.displayName } : {}),
      ...(currentUser.photoURL ? { photoURL: currentUser.photoURL } : {}),
    });

    // Load the channel and update local state
    const channelDoc = await getDoc(doc(db, 'channels', channelId));
    if (channelDoc.exists()) {
      const channel = { id: channelDoc.id, ...channelDoc.data() } as Channel;
      setChannels([channel]);
      setCurrentChannel(channel);
    }
    
    const newProfile: UserProfile = {
      userId: currentUser.uid,
      defaultChannelId: channelId,
      channelIds: [channelId],
      migrated: false,
      createdAt: new Date()
    };
setUserProfile(newProfile);
    setNeedsOnboarding(false);
    console.log('[v0] completeOnboarding: local state updated');
  }, [currentUser]);

  // Leave channel
  const leaveChannel = useCallback(async (channelId: string) => {
    if (!currentUser) throw new Error('Not logged in');
    if (!userProfile) throw new Error('No profile');

    const channel = channels.find(c => c.id === channelId);
    if (!channel) throw new Error('Channel not found');

    // Add leave log before leaving (for shared channels)
    if (channel.type === 'shared') {
      const userNickname = userProfile.nickname
        || currentUser.displayName
        || (currentUser.email ? currentUser.email.split('@')[0] : null)
        || '名称未設定';

      const logRef = doc(collection(db, `channels/${channelId}/activityLogs`));
      await setDoc(logRef, {
        channelId,
        type: 'member_left',
        userId: currentUser.uid,
        userNickname,
        createdAt: serverTimestamp()
      });
    }

    // Remove user from channel members
    const channelRef = doc(db, 'channels', channelId);
    
    // Get fresh channel data from Firestore to avoid stale memberIds
    const freshChannelDoc = await getDoc(channelRef);
    if (!freshChannelDoc.exists()) {
      throw new Error('Channel no longer exists');
    }
    const freshChannelData = freshChannelDoc.data();
    const currentMemberIds: string[] = freshChannelData.memberIds || [];
    
    console.log('[v0] leaveChannel: currentMemberIds from Firestore', currentMemberIds);
    console.log('[v0] leaveChannel: removing userId', currentUser.uid);
    
    const newMemberIds = currentMemberIds.filter(id => id !== currentUser.uid);
    console.log('[v0] leaveChannel: newMemberIds after removal', newMemberIds);

    if (newMemberIds.length === 0) {
      // Delete channel if no members left
      await deleteDoc(channelRef);
      console.log('[v0] leaveChannel: channel deleted (no members)');
    } else {
      // Update channel members
      await updateDoc(channelRef, {
        memberIds: newMemberIds
      });
      console.log('[v0] leaveChannel: updated memberIds in Firestore');
    }

    // Remove channel from user profile
    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    const newChannelIds = userProfile.channelIds.filter(id => id !== channelId);
    
    // If leaving default channel, set new default
    const newDefaultChannelId = userProfile.defaultChannelId === channelId
      ? (newChannelIds[0] || '')
      : userProfile.defaultChannelId;

    await updateDoc(profileRef, {
      channelIds: newChannelIds,
      defaultChannelId: newDefaultChannelId
    });

    // Update local state
    const updatedChannels = channels.filter(c => c.id !== channelId);
    setChannels(updatedChannels);
    setUserProfile(prev => prev ? {
      ...prev,
      channelIds: newChannelIds,
      defaultChannelId: newDefaultChannelId
    } : null);

    // Switch to another channel if leaving current
    if (currentChannel?.id === channelId) {
      setCurrentChannel(updatedChannels[0] || null);
    }

    // If no channels left, set onboarding needed
    if (updatedChannels.length === 0) {
      setNeedsOnboarding(true);
    }

    console.log('[v0] leaveChannel: completed');
  }, [currentUser, userProfile, channels, currentChannel]);

  // Update channel name
  const updateChannelName = useCallback(async (channelId: string, name: string) => {
    if (!currentUser) throw new Error('Not logged in');

    const channelRef = doc(db, 'channels', channelId);
    await updateDoc(channelRef, { name });

    // Update local state
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, name } : c
    ));
    if (currentChannel?.id === channelId) {
      setCurrentChannel(prev => prev ? { ...prev, name } : null);
    }

    console.log('[v0] updateChannelName: completed');
  }, [currentUser, currentChannel]);

  // Add activity log
  const addActivityLog = useCallback(async (
    type: ActivityLog['type'],
    itemId?: string,
    itemName?: string
  ) => {
    if (!currentUser) throw new Error('Not logged in');
    if (!currentChannel) throw new Error('No channel selected');
    if (!userProfile) throw new Error('No profile');

    // Only add logs for shared channels
    if (currentChannel.type !== 'shared') return;

    // nickname優先、なければAuth displayName、なければメールの@前
    const userNickname = userProfile.nickname
      || currentUser.displayName
      || (currentUser.email ? currentUser.email.split('@')[0] : null)
      || '名称未設定';

    const logRef = doc(collection(db, `channels/${currentChannel.id}/activityLogs`));
    await setDoc(logRef, {
      channelId: currentChannel.id,
      type,
      userId: currentUser.uid,
      userNickname,
      itemId,
      itemName,
      createdAt: serverTimestamp()
    });

    console.log('[v0] addActivityLog: added', type);
  }, [currentUser, currentChannel, userProfile]);

  // Get activity logs for a channel
  const getActivityLogs = useCallback(async (channelId: string): Promise<ActivityLog[]> => {
    const logsRef = collection(db, `channels/${channelId}/activityLogs`);
    // Get logs from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const q = query(logsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const logs: ActivityLog[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Omit<ActivityLog, 'id'>;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      // Only include logs from the last 7 days
      if (createdAt >= sevenDaysAgo) {
        logs.push({ id: docSnap.id, ...data } as ActivityLog);
      }
    });
    
    return logs;
  }, []);
  
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
    completeOnboarding,
    updateProfile,
    getChannelMembers,
    leaveChannel,
    updateChannelName,
    addActivityLog,
    getActivityLogs
  };

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  );
}
