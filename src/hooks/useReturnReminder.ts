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

  // Service Worker登録 & 通知権限リクエスト
  useEffect(() => {
    registerSW();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!currentUser) return;

    const checkAndNotify = () => {
      const now = Date.now();
      let intervalDays = settings.notificationIntervalDays;

      // デバッグ: 30秒後ボタン（0.000347日または旧値0.0347）が選ばれた場合、30秒で判定
      const isDebugMode = intervalDays === 0.000347 || intervalDays === 0.0347;
      if (isDebugMode) {
        intervalDays = 30 / (24 * 60 * 60); // 正確に30秒
      }

      const thresholdMs = intervalDays * 24 * 60 * 60 * 1000;

      console.log('[v0] Checking. Threshold:', Math.floor(thresholdMs / 1000), 'sec, DEBUG:', isDebugMode);

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        const elapsedMs = now - takenOutAt;
        console.log('[v0] Item:', item.name, 'elapsed:', Math.floor(elapsedMs / 1000), 'sec, isOverdue:', elapsedMs >= thresholdMs);
        return elapsedMs >= thresholdMs;
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

        // アプリ内トースト通知
        window.dispatchEvent(new CustomEvent('return-reminder-notification', { detail: notification }));

        // バックグラウンド対応: Service Worker経由でプッシュ通知
        const title = '返却の確認';
        const body = `「${item.name}」を返却しましたか？`;
        sendNotificationViaSW(title, body, key).then(sent => {
          if (!sent && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico', tag: key });
          }
        });

        console.log('[v0] Notification dispatched for:', item.name);
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

    checkAndNotify();
    const timer = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [settings.notificationsEnabled, settings.notificationIntervalDays, items, currentUser]);
}

