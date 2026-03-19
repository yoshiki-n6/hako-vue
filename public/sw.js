/* hako Service Worker - FCM & バックグラウンド通知対応 */
const CACHE_NAME = 'hako-sw-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// FCM: バックグラウンド通知受信
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[sw] Push payload received:', payload);

    const { title = '通知', body = '', icon = '/pwa-192x192.jpg', data = {} } = payload.notification || {};
    // OSの通知センターでまとめられてポップアップが出なくなるのを防ぐため、必ずユニークなタグにする
    const tag = payload.notification?.tag || payload.messageId || String(Date.now());

    // iOS Web Push (PWA) の非常に厳格な仕様対策：
    // 1つの event.waitUntil 内で、一番最初に showNotification を呼び出してPromiseチェーンとしてつなぎます。
    const promiseChain = self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag,
      data,
    }).then(() => {
      // ブラウザの通知表示に成功した後、フォアグラウンドのReactアプリにデータを送信 (トースト用)
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: 'FCM_PUSH_RECEIVED',
          payload: payload
        });
      }
    }).catch((e) => {
      console.error('[sw] Error in push handling chain:', e);
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

    for (const item of items) {
      if (item.status !== 'taken_out') continue;
      if (item.takenOutBy !== currentUserId) continue;
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
    }
  } catch (e) {
    // ignore
  }
}
