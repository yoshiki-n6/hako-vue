import { useEffect, useRef } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import type { ReturnNotificationData } from '../components/ReturnNotification';

const CHECK_INTERVAL_MS = 30 * 1000;

// Service Worker登録
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.log('[v0] SW registration failed:', e);
    }
  }
}

// Service Worker経由で通知を送る（バックグラウンド対応）
async function sendNotificationViaSW(title: string, body: string, tag: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
    return true;
  }
  return false;
}

export function useReturnReminder() {
  const { settings } = useAppSettings();
  const { items } = useData();
  const { currentUser } = useAuth();
  const notifiedItemsRef = useRef<Set<string>>(new Set());
  const lastCheckTimeRef = useRef<{ [key: string]: number }>({});

  // 最新のitems/settings/currentUserをrefで参照（タイマーを再起動せずに最新値を使う）
  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);
  const currentUserRef = useRef(currentUser);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Service Worker登録 & 通知権限リクエスト
  useEffect(() => {
    registerSW();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        return (now - takenOutAt) >= thresholdMs;
      });

      overdue.forEach(item => {
        const key = `${item.id}_${settings.notificationIntervalDays}`;
        if (notifiedItemsRef.current.has(key)) return;
        const lastNotifyTime = lastCheckTimeRef.current[key] || 0;
        if (now - lastNotifyTime < 5000) return;

        notifiedItemsRef.current.add(key);
        lastCheckTimeRef.current[key] = now;

        const notification: ReturnNotificationData = {
          id: key,
          itemName: item.name,
          days: settings.notificationIntervalDays,
        };

        window.dispatchEvent(new CustomEvent('return-reminder-notification', { detail: notification }));

        const title = '返却の確認';
        const body = `「${item.name}」を返却しましたか？`;
        sendNotificationViaSW(title, body, key).then(sent => {
          if (!sent && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico', tag: key });
          }
        });
      });

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

