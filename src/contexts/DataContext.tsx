import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useChannel } from './ChannelContext';

export interface Location {
  id: string;
  name: string;
  description: string;
  landscapePhoto: string;
  markerText: string;
  userId: string;
  channelId?: string;
  createdAt: any;
}

export interface Item {
  id: string;
  locationId: string;
  name: string;
  itemPhotoUrl: string;
  status: 'stored' | 'taken_out';
  isFavorite?: boolean;
  takenOutBy?: string; // User ID who took out the item
  userId: string;
  channelId?: string;
  createdAt: any;
  updatedAt: any;
}

interface DataContextType {
  locations: Location[];
  items: Item[];
  loading: boolean;
  addLocation: (location: Omit<Location, 'id' | 'userId' | 'channelId' | 'createdAt'>) => Promise<string>;
  addItem: (item: Omit<Item, 'id' | 'userId' | 'channelId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItemStatus: (itemId: string, status: 'stored' | 'taken_out') => Promise<void>;
  updateItemName: (itemId: string, name: string) => Promise<void>;
  updateItem: (itemId: string, data: Partial<Pick<Item, 'name' | 'tags' | 'locationId'>>) => Promise<void>;
  updateLocation: (locationId: string, data: Partial<Pick<Location, 'name' | 'description' | 'markerText'>>) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemFavorite: (itemId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { currentChannel, loading: channelLoading, needsOnboarding, addActivityLog } = useChannel();
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to channel's data
  useEffect(() => {
    // Wait for channel context to finish loading
    if (channelLoading) {
      return;
    }

    if (!currentUser || !currentChannel) {
      setLocations([]);
      setItems([]);
      setLoading(false);
      return;
    }

    // Skip data loading during onboarding
    if (needsOnboarding) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Use channel-based paths
    const locationsRef = collection(db, `channels/${currentChannel.id}/locations`);
    const itemsRef = collection(db, `channels/${currentChannel.id}/items`);

    const unsubLocations = onSnapshot(locationsRef, (snapshot) => {
      const locData: Location[] = [];
      snapshot.forEach(doc => {
        locData.push({ id: doc.id, ...doc.data() } as Location);
      });
      setLocations(locData);
    });

    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      const itemData: Item[] = [];
      snapshot.forEach(doc => {
        itemData.push({ id: doc.id, ...doc.data() } as Item);
      });
      setItems(itemData);
      setLoading(false);
    });

    return () => {
      unsubLocations();
      unsubItems();
    };
  }, [currentUser, currentChannel, channelLoading, needsOnboarding]);

  const addLocation = async (locData: Omit<Location, 'id' | 'userId' | 'channelId' | 'createdAt'>) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const newDocRef = doc(collection(db, `channels/${currentChannel.id}/locations`));
    await setDoc(newDocRef, {
      ...locData,
      userId: currentUser.uid,
      channelId: currentChannel.id,
      createdAt: serverTimestamp()
    });
    return newDocRef.id;
  };

  const addItem = async (itemData: Omit<Item, 'id' | 'userId' | 'channelId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const newDocRef = doc(collection(db, `channels/${currentChannel.id}/items`));
    await setDoc(newDocRef, {
      ...itemData,
      userId: currentUser.uid,
      channelId: currentChannel.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add activity log for shared channels
    try {
      await addActivityLog('item_added', newDocRef.id, itemData.name);
    } catch (err) {
      console.error('Failed to add activity log:', err);
    }
    
    return newDocRef.id;
  };

  const updateItemStatus = async (itemId: string, status: 'stored' | 'taken_out') => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const itemRef = doc(db, `channels/${currentChannel.id}/items`, itemId);
    
    // If taking out, record who took it out; if storing, clear the takenOutBy field
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === 'taken_out') {
      updateData.takenOutBy = currentUser.uid;
    } else {
      updateData.takenOutBy = null;
    }
    
    await updateDoc(itemRef, updateData);
    
    // Add activity log for shared channels
    try {
      const item = items.find(i => i.id === itemId);
      const logType = status === 'taken_out' ? 'item_taken_out' : 'item_stored';
      await addActivityLog(logType as 'item_taken_out' | 'item_stored', itemId, item?.name);
    } catch (err) {
      console.error('Failed to add activity log:', err);
    }
  };

  const updateItemName = async (itemId: string, name: string) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const itemRef = doc(db, `channels/${currentChannel.id}/items`, itemId);
    await updateDoc(itemRef, {
      name,
      updatedAt: serverTimestamp()
    });
  };

  const updateItem = async (itemId: string, data: Partial<Pick<Item, 'name' | 'locationId'>>) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const itemRef = doc(db, `channels/${currentChannel.id}/items`, itemId);
    await updateDoc(itemRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const updateLocation = async (locationId: string, data: Partial<Pick<Location, 'name' | 'description' | 'markerText'>>) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const locationRef = doc(db, `channels/${currentChannel.id}/locations`, locationId);
    await updateDoc(locationRef, data);
  };

  const deleteLocation = async (locationId: string) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const locationRef = doc(db, `channels/${currentChannel.id}/locations`, locationId);
    await deleteDoc(locationRef);
  };

  const deleteItem = async (itemId: string) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const itemRef = doc(db, `channels/${currentChannel.id}/items`, itemId);
    await deleteDoc(itemRef);
  };

  const toggleItemFavorite = async (itemId: string) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!currentChannel) throw new Error("No channel selected");
    
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error("Item not found");
    
    const itemRef = doc(db, `channels/${currentChannel.id}/items`, itemId);
    await updateDoc(itemRef, {
      isFavorite: !item.isFavorite,
      updatedAt: serverTimestamp()
    });
  };

  const value = {
    locations,
    items,
    loading,
    addLocation,
    addItem,
    updateItemStatus,
    updateItemName,
    updateItem,
    updateLocation,
    deleteLocation,
    deleteItem,
    toggleItemFavorite
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
