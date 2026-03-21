import { useEffect, useRef } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import type { ReturnNotificationData } from '../components/ReturnNotification';

const CHECK_INTERVAL_MS = 30 * 1000;

// Service Worker登録 (Vite PWAプラグインが自動登録するのでここでは待機のみ)
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.ready;
    } catch (e) {
      console.log('[v0] SW ready failed:', e);
    }
  }
}

// SWにリマインダーデータを同期（アプリが閉じた後のバックグラウンドチェック用）
async function syncDataToSW(payload: object) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SYNC_DATA', payload });
  }
}

// Periodic Background Sync を登録（Chrome Android対応）
async function registerPeriodicSync() {
  if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await (navigator.permissions as any).query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('hako-reminder-check', {
          minInterval: 30 * 60 * 1000, // 最短30分
        });
      }
    } catch (e) {
      // Periodic Sync非対応ブラウザはignore
    }
  }
}

export function useReturnReminder() {
  const { settings } = useAppSettings();
  const { items, updateItemReturnReminded } = useData();
  const { currentUser } = useAuth();
  const notifiedItemsRef = useRef<Set<string>>(new Set());
  const lastCheckTimeRef = useRef<{ [key: string]: number }>({});

  // 最新のitems/settings/currentUserをrefで参照（タイマーを再起動せずに最新値を使う）
  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);
  const currentUserRef = useRef(currentUser);
  const updateItemReturnRemindedRef = useRef(updateItemReturnReminded);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { updateItemReturnRemindedRef.current = updateItemReturnReminded; }, [updateItemReturnReminded]);

  // Service Worker登録 & Periodic Sync登録
  useEffect(() => {
    registerSW().then(() => registerPeriodicSync());
  }, []);

  // タイマーは一度だけ起動（依存配列を空にしてitemの変化で再起動させない）
  useEffect(() => {
    const checkAndNotify = () => {
      const items = itemsRef.current;
      const settings = settingsRef.current;
      const currentUser = currentUserRef.current;

      if (!settings.notificationsEnabled) return;
      if (!currentUser) return;

      const now = Date.now();
      let intervalDays = settings.notificationIntervalDays;

      const isDebugMode = intervalDays === 0.000347 || intervalDays === 0.0347;
      if (isDebugMode) {
        intervalDays = 30 / (24 * 60 * 60);
      }

      const thresholdMs = intervalDays * 24 * 60 * 60 * 1000;

      console.log('[v0] Check at', new Date(now).toLocaleTimeString(), '| Threshold:', Math.round(thresholdMs / 1000), 'sec');

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        if (item.returnReminded) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        const elapsedSec = Math.round((now - takenOutAt) / 1000);
        const takenOutTime = new Date(takenOutAt).toLocaleTimeString();
        console.log(`[v0]   "${item.name}" | taken at ${takenOutTime} | elapsed ${elapsedSec}sec | overdue: ${elapsedSec >= Math.round(thresholdMs / 1000)}`);
        return (now - takenOutAt) >= thresholdMs;
      });

      overdue.forEach(item => {
        const key = `${item.id}_${settings.notificationIntervalDays}`;
        if (notifiedItemsRef.current.has(key)) return;
        const lastNotifyTime = lastCheckTimeRef.current[key] || 0;
        if (now - lastNotifyTime < 5000) return;

        notifiedItemsRef.current.add(key);
        lastCheckTimeRef.current[key] = now;

        updateItemReturnRemindedRef.current(item.id, true).catch(e => {
          console.error('[v0] Failed to update returnReminded', e);
        });

        const notification: ReturnNotificationData = {
          id: key,
          itemId: item.id,
          itemName: item.name,
          days: settings.notificationIntervalDays,
        };

        window.dispatchEvent(new CustomEvent('return-reminder-notification', { detail: notification }));
      });

      // SWにデータを同期（バックグラウンドチェック用）
      if (currentUser) {
        syncDataToSW({
          items: items
            .filter(i => i.status === 'taken_out' && i.takenOutBy === currentUser.uid)
            .map(i => ({
              id: i.id,
              name: i.name,
              status: i.status,
              takenOutBy: i.takenOutBy,
              returnReminded: i.returnReminded,
              takenOutAt: i.updatedAt?.toMillis?.() || i.createdAt?.toMillis?.() || 0,
            })),
          intervalDays: settings.notificationIntervalDays,
          currentUserId: currentUser.uid,
          notifiedKeys: Array.from(notifiedItemsRef.current),
        });
      }

      // 返却済みアイテムのキーをクリーンアップ
      const currentTakenOutIds = new Set(
        items
          .filter(item => item.status === 'taken_out' && item.takenOutBy === currentUser.uid)
          .map(i => `${i.id}_${settings.notificationIntervalDays}`)
      );
      notifiedItemsRef.current.forEach(key => {
        if (!currentTakenOutIds.has(key)) {
          notifiedItemsRef.current.delete(key);
          delete lastCheckTimeRef.current[key];
        }
      });
    };

    const timer = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列: タイマーはマウント時に一度だけ起動
}

