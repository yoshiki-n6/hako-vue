import { useEffect, useRef } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// Check interval: every 30 minutes
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

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
      const thresholdMs = settings.notificationIntervalDays * 24 * 60 * 60 * 1000;

      const overdue = items.filter(item => {
        if (item.status !== 'taken_out') return false;
        if (item.takenOutBy !== currentUser.uid) return false;
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        return now - takenOutAt >= thresholdMs;
      });

      overdue.forEach(item => {
        const key = `${item.id}_${settings.notificationIntervalDays}`;
        if (notifiedItemsRef.current.has(key)) return;

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
        if (!takenOutIds.has(key)) notifiedItemsRef.current.delete(key);
      });
    };

    // Run immediately, then on interval
    checkAndNotify();
    const timer = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [settings.notificationsEnabled, settings.notificationIntervalDays, items, currentUser]);
}
