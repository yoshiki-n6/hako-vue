import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useFCM() {
  const { currentUser } = useAuth();
  const initializeRef = useRef(false);

  useEffect(() => {
    if (!currentUser || initializeRef.current) return;
    initializeRef.current = true;

    const initializeFCM = async () => {
      try {
        // Check if FCM is supported
        if (!('serviceWorker' in navigator)) {
          console.log('[v0] Service Workers not supported');
          return;
        }

        const messaging = getMessaging();
        
        // Request notification permission if not already granted
        if (Notification.permission === 'granted') {
          try {
            const token = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });

            if (token) {
              console.log('[v0] FCM Token obtained:', token);
              
              // Save token to Firestore user document
              await updateDoc(doc(db, 'users', currentUser.uid), {
                fcmToken: token,
                fcmTokenUpdatedAt: serverTimestamp(),
              });

              console.log('[v0] FCM Token saved to Firestore');
            }
          } catch (error) {
            console.error('[v0] Error getting FCM token:', error);
          }
        }

        // Listen for foreground messages (when app is open)
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('[v0] Foreground message received:', payload);
          
          if (payload.notification) {
            new Notification(payload.notification.title || 'Notification', {
              body: payload.notification.body,
              icon: payload.notification.icon || '/pwa-192x192.jpg',
            });
          }

          // Also dispatch custom event for app-level handling
          window.dispatchEvent(
            new CustomEvent('fcm-message', { detail: payload })
          );
        });

        return unsubscribe;
      } catch (error) {
        console.error('[v0] FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, [currentUser]);
}
