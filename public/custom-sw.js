/* hako Service Worker - FCM & バックグラウンド通知対応 */
const CACHE_NAME = 'hako-sw-v4';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// FCM: バックグラウンド通知受信
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[sw] Push payload received:', payload);

    const { title = '通知', body = '', icon = '/pwa-192x192.jpg', data = {} } = payload.notification || {};
    const tag = payload.notification?.tag || payload.messageId || String(Date.now());

    // アプリがフォアグラウンド（最前面）で開かれているかチェック
    const promiseChain = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        let isFocused = false;
        for (const client of clients) {
          if (client.visibilityState === 'visible') {
            isFocused = true;
            break;
          }
        }

        // フォーカスされている場合はネイティブ通知をスキップ（アプリ内トーストのみにするため）
        if (isFocused) {
          console.log('[sw] App is focused. Skipping native notification.');
          return Promise.resolve();
        }

        // バックグラウンドの場合はネイティブ通知を表示
        return self.registration.showNotification(title, {
          body,
          icon,
          tag,
          data,
        });
      })
      .catch((e) => {
        console.error('[sw] showNotification failed on iOS:', e);
      })
      .finally(() => {
        // ネイティブ通知の有無に関わらず、画面側にデータをブロードキャスト送信（アプリ内トースト用）
        try {
          const channel = new BroadcastChannel('fcm-push-channel');
          channel.postMessage({
            type: 'FCM_PUSH_RECEIVED',
            payload: payload
          });
          channel.close();
        } catch (e) {
          console.error('[sw] BroadcastChannel error:', e);
        }
      });

    event.waitUntil(promiseChain);
  } catch (e) {
    console.error('[sw] Error parsing push message:', e);
  }
});

// アプリからのメッセージで通知（フォアグラウンド時）
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, itemId } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.jpg',
        badge: '/pwa-192x192.jpg',
        tag,
        requireInteraction: false,
        data: { url: itemId ? `/items/${itemId}` : '/' },
      })
    );
  }

  // アプリが開いていない時のチェック用データを保存
  if (event.data?.type === 'SYNC_DATA') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.put('/sw-reminder-data', new Response(JSON.stringify(event.data.payload)));
      })
    );
  }
});

// 通知クリック: 該当アイテム詳細へ
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 既に開いているウィンドウがあればそこへ
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          client.navigate?.(targetUrl);
          return;
        }
      }
      // なければ新しいウィンドウを開く
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Periodic Background Sync（対応ブラウザのみ: Chrome Android）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'hako-reminder-check') {
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/sw-reminder-data');
    if (!response) return;

    const data = await response.json();
    const { items, intervalDays, currentUserId, notifiedKeys } = data;
    if (!items || !currentUserId) return;

    const now = Date.now();
    let threshold = intervalDays;
    const isDebug = threshold === 0.000347 || threshold === 0.0347;
    if (isDebug) threshold = 30 / (24 * 60 * 60);
    const thresholdMs = threshold * 24 * 60 * 60 * 1000;

    const notified = notifiedKeys || [];
    const newlyNotified = [];

    for (const item of items) {
      if (item.status !== 'taken_out') continue;
      if (item.takenOutBy !== currentUserId) continue;
      if (item.returnReminded) continue;

      const takenOutAt = item.takenOutAt || 0;
      if (now - takenOutAt < thresholdMs) continue;

      const key = `${item.id}_${intervalDays}`;
      if (notified.includes(key)) continue;

      await self.registration.showNotification('返却の確認', {
        body: `「${item.name}」を返却しましたか？`,
        icon: '/pwa-192x192.jpg',
        badge: '/pwa-192x192.jpg',
        tag: key,
        data: { url: `/items/${item.id}` },
      });
      newlyNotified.push(key);
    }

    if (newlyNotified.length > 0) {
      data.notifiedKeys = [...notified, ...newlyNotified];
      await cache.put('/sw-reminder-data', new Response(JSON.stringify(data)));
    }
  } catch (e) {
    // ignore
  }
}
