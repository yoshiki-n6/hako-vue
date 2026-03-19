import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
            // Service Worker が準備完了するのを待つ
            const registration = await navigator.serviceWorker.ready;

            const token = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            if (token) {
              console.log('[v0] FCM Token obtained:', token.substring(0, 20) + '...');

              // Save token to Firestore user document - fcmTokens 配列に追加
              const userRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion({
                  token,
                  createdAt: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                }),
                lastFCMTokenUpdate: serverTimestamp(),
              });

              console.log('[v0] FCM Token saved to Firestore');
            }
          } catch (error) {
            console.error('[v0] Error getting FCM token:', error);
          }
        }

        // Listen for foreground messages (when app is open)
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('[v0] Foreground FCM message received:', payload);

          if (payload.notification) {
            // ブラウザネイティブ通知
            new Notification(payload.notification.title || '通知', {
              body: payload.notification.body,
              icon: payload.notification.icon || '/pwa-192x192.jpg',
              data: payload.data,
            });
          }

          // アプリ内トースト通知としてもディスパッチ
          const itemId = payload.data?.itemId || '';
          window.dispatchEvent(
            new CustomEvent('return-reminder-notification', {
              detail: {
                id: payload.messageId || Date.now().toString(),
                itemId,
                itemName: payload.notification?.title || '返却リマインド',
                days: 1,
                receivedAt: Date.now(),
              },
            })
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
