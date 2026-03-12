import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

export interface Location {
  id: string;
  name: string;
  description: string;
  landscapePhoto: string;
  markerText: string;
  userId: string;
  createdAt: any;
}

export interface Item {
  id: string;
  locationId: string;
  name: string;
  tags: string[];
  itemPhotoUrl: string;
  status: 'stored' | 'taken_out';
  userId: string;
  createdAt: any;
  updatedAt: any;
}

interface DataContextType {
  locations: Location[];
  items: Item[];
  loading: boolean;
  addLocation: (location: Omit<Location, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  addItem: (item: Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItemStatus: (itemId: string, status: 'stored' | 'taken_out') => Promise<void>;
  updateItemName: (itemId: string, name: string) => Promise<void>;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's data
  useEffect(() => {
    if (!currentUser) {
      setLocations([]);
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const locationsRef = collection(db, `users/${currentUser.uid}/locations`);
    const itemsRef = collection(db, `users/${currentUser.uid}/items`);

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
      setLoading(false); // only set loading false once items also loaded (naive implementation)
    });

    return () => {
      unsubLocations();
      unsubItems();
    };
  }, [currentUser]);

  const addLocation = async (locData: Omit<Location, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) throw new Error("Not logged in");
    const newDocRef = doc(collection(db, `users/${currentUser.uid}/locations`));
    await setDoc(newDocRef, {
      ...locData,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });
    return newDocRef.id;
  };

  const addItem = async (itemData: Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error("Not logged in");
    const newDocRef = doc(collection(db, `users/${currentUser.uid}/items`));
    await setDoc(newDocRef, {
      ...itemData,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newDocRef.id;
  };

  const updateItemStatus = async (itemId: string, status: 'stored' | 'taken_out') => {
    if (!currentUser) throw new Error("Not logged in");
    const itemRef = doc(db, `users/${currentUser.uid}/items`, itemId);
    await updateDoc(itemRef, {
      status,
      updatedAt: serverTimestamp()
    });
  };

  const updateItemName = async (itemId: string, name: string) => {
     if (!currentUser) throw new Error("Not logged in");
    const itemRef = doc(db, `users/${currentUser.uid}/items`, itemId);
    await updateDoc(itemRef, {
      name,
      updatedAt: serverTimestamp()
    });
  }

  const value = {
    locations,
    items,
    loading,
    addLocation,
    addItem,
    updateItemStatus,
    updateItemName
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
