import { useEffect, useRef } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import type { ReturnNotificationData } from '../components/ReturnNotification';

// デバッグ用: 30秒ごとにチェック
// デバッグオプション: window.__DEBUG_REMINDER__ = true でコンソールログ有効化、3秒に短縮
const CHECK_INTERVAL_MS = (window as any).__DEBUG_REMINDER__ === true ? 3 * 1000 : 30 * 1000;

export function useReturnReminder() {
  const { settings } = useAppSettings();
  const { items } = useData();
  const { currentUser } = useAuth();
  const notifiedItemsRef = useRef<Set<string>>(new Set());
  const lastCheckTimeRef = useRef<{ [key: string]: number }>({});

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

      console.log("[v0] Checking for overdue items. Time:", new Date(now).toLocaleTimeString(), "Threshold:", thresholdMs / 1000, "seconds");

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        
        // 最新の日時を使用（更新時刻を優先）
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        const elapsedMs = now - takenOutAt;
        const isOverdue = elapsedMs >= thresholdMs;
        
        console.log("[v0] Item:", item.name, "elapsed:", Math.floor(elapsedMs / 1000), "sec, threshold:", Math.floor(thresholdMs / 1000), "sec, isOverdue:", isOverdue);
        return isOverdue;
      });

      console.log("[v0] Overdue items found:", overdue.length);

      overdue.forEach(item => {
        const key = `${item.id}_${intervalDays}`;
        
        // 既に通知済みかチェック
        if (notifiedItemsRef.current.has(key)) {
          console.log("[v0] Item already notified:", item.name);
          return;
        }

        // 重複通知を防ぐため、5秒以内の再通知は無視
        const lastNotifyTime = lastCheckTimeRef.current[key] || 0;
        if (now - lastNotifyTime < 5000) {
          console.log("[v0] Item notification throttled (too soon):", item.name);
          return;
        }

        console.log("[v0] Sending notification for:", item.name);
        notifiedItemsRef.current.add(key);
        lastCheckTimeRef.current[key] = now;
        
        const notification: ReturnNotificationData = {
          id: key,
          itemName: item.name,
          days: intervalDays,
        };

        // Dispatch custom event to ReturnNotificationContainer
        console.log("[v0] Dispatching event with data:", notification);
        window.dispatchEvent(
          new CustomEvent('return-reminder-notification', { detail: notification })
        );
        console.log("[v0] Event dispatched");
      });

      // Clean up keys for items that are no longer taken out
      const currentTakenOutIds = new Set(
        items
          .filter(item => item.status === 'taken_out' && item.takenOutBy === currentUser.uid)
          .map(i => `${i.id}_${intervalDays}`)
      );
      
      const keysToDelete: string[] = [];
      notifiedItemsRef.current.forEach(key => {
        if (!currentTakenOutIds.has(key)) {
          console.log("[v0] Cleaning up notification key (item returned):", key);
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        notifiedItemsRef.current.delete(key);
        delete lastCheckTimeRef.current[key];
      });
    };

    // Run immediately, then on interval
    console.log("[v0] Return reminder started. Check interval:", CHECK_INTERVAL_MS / 1000, "seconds");
    checkAndNotify();
    const timer = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => {
      console.log("[v0] Return reminder stopped");
      clearInterval(timer);
    };
  }, [settings.notificationsEnabled, settings.notificationIntervalDays, items, currentUser]);
}
