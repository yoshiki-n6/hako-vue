import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * 定期実行で返却期限超過ユーザーにFCM通知を送信
 * Cloud Scheduler または Pub/Sub で毎時間実行
 */
export const sendReturnReminders = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log(`[FCM] Running return reminder check at ${new Date().toISOString()}`);

    try {
      // すべてのアイテムを取得
      const itemsSnapshot = await db.collectionGroup('items').where('status', '==', 'taken_out').get();

      const notificationsToSend: {
        [userId: string]: {
          userIds: string[];
          intervalDays: number;
          items: { id: string; name: string; takenOutAt: number }[];
        };
      } = {};

      const now = Date.now();

      // 返却期限超過のアイテムを抽出
      itemsSnapshot.forEach((doc) => {
        const item = doc.data();
        const userId = item.takenOutBy;
        if (!userId) return;

        // ユーザーの通知設定を取得（別途必要）
        // ここではすべてのユーザーに対して1日後・3日後・7日後の通知を送信するサンプル
        const INTERVAL_OPTIONS = [1, 3, 7]; // 日数
        const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
        const elapsedDays = (now - takenOutAt) / (24 * 60 * 60 * 1000);

        INTERVAL_OPTIONS.forEach((intervalDays) => {
          if (elapsedDays >= intervalDays && elapsedDays < intervalDays + 0.01) {
            // 期限に達したアイテムを記録
            const key = `${userId}_${intervalDays}`;
            if (!notificationsToSend[key]) {
              notificationsToSend[key] = {
                userIds: [],
                intervalDays,
                items: [],
              };
            }
            notificationsToSend[key].items.push({
              id: doc.id,
              name: item.name,
              takenOutAt,
            });
          }
        });
      });

      // ユーザーの通知設定を確認して、FCMトークンが存在する場合のみ送信
      let sentCount = 0;
      for (const [key, data] of Object.entries(notificationsToSend)) {
        const [userId] = key.split('_');

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists()) continue;

        const userData = userDoc.data();
        const fcmTokens = userData?.fcmTokens || [];
        const notificationsEnabled = userData?.notificationsEnabled !== false;

        if (!notificationsEnabled || fcmTokens.length === 0) continue;

        // 各アイテムについて通知を送信
        for (const item of data.items) {
          const payload = {
            notification: {
              title: '返却の確認',
              body: `「${item.name}」を返却しましたか？`,
            },
            data: {
              itemId: item.id,
              userId,
            },
          };

          // すべてのデバイスに送信
          for (const tokenInfo of fcmTokens) {
            try {
              await messaging.send({
                token: tokenInfo.token,
                ...payload,
              });
              sentCount++;
              console.log(`[FCM] Notification sent to ${userId}: ${item.name}`);
            } catch (error: any) {
              // トークンが無効な場合は削除
              if (error.code === 'messaging/invalid-registration-token') {
                await db
                  .collection('users')
                  .doc(userId)
                  .update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(tokenInfo),
                  });
              }
              console.error(`[FCM] Failed to send to ${userId}:`, error.message);
            }
          }
        }
      }

      console.log(`[FCM] Sent ${sentCount} notifications`);
      return { success: true, sentCount };
    } catch (error) {
      console.error('[FCM] Error in sendReturnReminders:', error);
      throw error;
    }
  });

/**
 * ユーザーがアプリ設定で通知をONにしたときのハンドラ
 * notificationsEnabled の更新時に実行
 */
export const onNotificationSettingChange = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData?.notificationsEnabled === oldData?.notificationsEnabled) {
      return;
    }

    console.log(`[FCM] Notification setting changed for user ${userId}`);
    return null;
  });
