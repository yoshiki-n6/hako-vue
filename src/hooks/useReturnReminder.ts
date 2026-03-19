import { useEffect, useRef } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// デバッグ用: 30秒ごとにチェック
// デバッグオプション: window.__DEBUG_REMINDER__ = true でコンソールログ有効化、3秒に短縮
const CHECK_INTERVAL_MS = (window as any).__DEBUG_REMINDER__ === true ? 3 * 1000 : 30 * 1000;

export function useReturnReminder() {
  const { settings } = useAppSettings();
  const { items } = useData();
  const { currentUser } = useAuth();
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!currentUser) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
      return;
    }

    const checkAndNotify = () => {
      const now = Date.now();
      // デバッグ用: 閾値を0にして持ち出し中のアイテムはすべて通知
      const thresholdMs = 0;

      console.log("[v0] Checking for overdue items. Time:", new Date(now).toLocaleTimeString());

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        return now - takenOutAt >= thresholdMs;
      });

      console.log("[v0] Overdue items found:", overdue.length, overdue.map(i => i.name));

      overdue.forEach(item => {
        const key = `${item.id}_${settings.notificationIntervalDays}`;
        if (notifiedItemsRef.current.has(key)) {
          console.log("[v0] Item already notified:", item.name);
          return;
        }

        console.log("[v0] Sending notification for:", item.name);
        notifiedItemsRef.current.add(key);
        new Notification('返却の確認', {
          body: `「${item.name}」を返却しましたか？${settings.notificationIntervalDays}日以上持ち出し中です。`,
          icon: '/favicon.ico',
          tag: key,
        });
      });

      // Clean up keys for items that are no longer taken out
      const takenOutIds = new Set(overdue.map(i => `${i.id}_${settings.notificationIntervalDays}`));
      notifiedItemsRef.current.forEach(key => {
        if (!takenOutIds.has(key)) {
          console.log("[v0] Cleaning up notification key:", key);
          notifiedItemsRef.current.delete(key);
        }
      });
    };

    // Run immediately, then on interval
    console.log("[v0] Return reminder started. Check interval:", CHECK_INTERVAL_MS, "ms (", CHECK_INTERVAL_MS / 1000, "seconds )");
    checkAndNotify();
    const timer = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => {
      console.log("[v0] Return reminder stopped");
      clearInterval(timer);
    };
  }, [settings.notificationsEnabled, settings.notificationIntervalDays, items, currentUser]);
}
