import { useEffect, useRef } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const requestAndSaveFCMToken = async (currentUser: { uid: string }) => {
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

          // Save token to Firestore user document (Duplicates Prevented)
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const existingTokens = userData.fcmTokens || [];

            // 古いデータ形式（文字列の配列）と新しいデータ形式（オブジェクトの配列）の両方に対応
            const tokenExists = existingTokens.some((t: any) =>
              typeof t === 'object' && t !== null ? t.token === token : t === token
            );

            if (!tokenExists) {
              await updateDoc(userRef, {
                fcmTokens: arrayUnion({
                  token,
                  createdAt: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                }),
                lastFCMTokenUpdate: serverTimestamp(),
              });
              console.log('[v0] FCM Token saved to Firestore');
            } else {
              // 既ににトークンが存在する場合は更新時間のみ更新して終了
              await updateDoc(userRef, {
                lastFCMTokenUpdate: serverTimestamp(),
              });
              console.log('[v0] FCM Token already exists (duplicate prevented)');
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error getting FCM token:', error);
      }
    }
  } catch (error) {
    console.error('[v0] Error initializing FCM:', error);
  }
};

export const removeFCMToken = async (currentUser: { uid: string }) => {
  try {
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;

    const messaging = getMessaging();
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const existingTokens = userData.fcmTokens || [];

        // Find the exact object to pass to arrayRemove
        const tokenToRemove = existingTokens.find((t: any) =>
          typeof t === 'object' && t !== null ? t.token === token : t === token
        );

        if (tokenToRemove) {
          await updateDoc(userRef, {
            fcmTokens: arrayRemove(tokenToRemove)
          });
          console.log('[v0] FCM Token removed from Firestore');
        }
      }
    }
  } catch (error) {
    console.error('[v0] Error removing FCM token:', error);
  }
};

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

        // 起動時にトークン取得＆保存を実行
        await requestAndSaveFCMToken(currentUser);

        // Listen for messages manually broadcasted by our custom sw.js
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'FCM_PUSH_RECEIVED') {
            const payload = event.data.payload;
            console.log('[v0] Foreground FCM message received via sw.js:', payload);

            // アプリ内トースト通知としてもディスパッチ
            const itemId = payload.data?.itemId || '';

            // functions側で `data.itemName` を送るように対応するまでのフォールバックとして、
            // body（「○○」を返却しましたか？）からアイテム名を正規表現で抽出します。
            const extractedItemName = payload.notification?.body?.match(/「(.*?)」/)?.[1];
            const itemNameText = payload.data?.itemName || extractedItemName || 'アイテム';

            window.dispatchEvent(
              new CustomEvent('return-reminder-notification', {
                detail: {
                  id: payload.messageId || Date.now().toString(),
                  itemId,
                  itemName: itemNameText,
                  days: 1,
                  receivedAt: Date.now(),
                },
              })
            );
          }
        });

      } catch (error) {
        console.error('[v0] FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, [currentUser]);
}
