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
    if (!settings.notificationsEnabled) {
      console.log("[v0] Notifications disabled");
      return;
    }
    if (!currentUser) {
      console.log("[v0] No current user");
      return;
    }

    const checkAndNotify = () => {
      const now = Date.now();
      const intervalDays = settings.notificationIntervalDays;
      const thresholdMs = intervalDays * 24 * 60 * 60 * 1000;

      console.log("[v0] Checking for overdue items. Time:", new Date(now).toLocaleTimeString(), "Threshold:", thresholdMs, "ms");

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        const elapsedMs = now - takenOutAt;
        const isOverdue = elapsedMs >= thresholdMs;
        console.log("[v0] Item:", item.name, "takenOutAt:", takenOutAt, "elapsed:", elapsedMs, "isOverdue:", isOverdue);
        return isOverdue;
      });

      console.log("[v0] Overdue items found:", overdue.length, overdue.map(i => i.name));

      overdue.forEach(item => {
        const key = `${item.id}_${intervalDays}`;
        if (notifiedItemsRef.current.has(key)) {
          console.log("[v0] Item already notified:", item.name);
          return;
        }

        console.log("[v0] Sending notification for:", item.name);
        notifiedItemsRef.current.add(key);
        
        const title = '返却の確認';
        const message = `「${item.name}」を返却しましたか？${intervalDays}日以上持ち出し中です。`;
        
        // Try Notification API first (if available and permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: message,
              icon: '/favicon.ico',
              tag: key,
            });
            console.log("[v0] Push notification sent (Notification API)");
          } catch (e) {
            console.log("[v0] Notification API error:", e);
            // Fallback to alert
            alert(`[返却リマインド]\n${message}`);
          }
        } else {
          // Fallback to alert for preview/demo environments
          console.log("[v0] Using alert (Notification API not available or permission denied)");
          alert(`[返却リマインド]\n${message}`);
        }
      });

      // Clean up keys for items that are no longer taken out
      const takenOutIds = new Set(overdue.map(i => `${i.id}_${intervalDays}`));
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
