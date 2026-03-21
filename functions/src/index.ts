import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

// Firebase Admin SDK の初期化
initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * 定期実行で返却期限超過ユーザーにFCM通知を送信
 * v2 の onSchedule を使用
 */
export const sendReturnReminders = onSchedule({
  schedule: 'every 1 hours',
  timeZone: 'Asia/Tokyo',
  memory: '256MiB', // 必要に応じて調整
}, async (event) => {
  logger.log(`[FCM] Running return reminder check at ${event.scheduleTime}`);

  try {
    // インデックスエラーを避けるため、一旦全部のアイテムを取得
    const itemsSnapshot = await db.collectionGroup('items').get();

    // ユーザーごとにアイテムをまとめる
    const userItemsMap: {
      [userId: string]: { id: string; name: string; takenOutAt: number; returnReminded?: boolean; ref: any }[];
    } = {};

    const now = Date.now();

    // 返却期限超過の可能性があるアイテムを抽出
    itemsSnapshot.forEach((doc) => {
      const item = doc.data();
      if (item.status !== 'taken_out') return;
      if (item.returnReminded) return;

      const userId = item.takenOutBy;
      if (!userId) return;

      const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;

      if (!userItemsMap[userId]) {
        userItemsMap[userId] = [];
      }
      userItemsMap[userId].push({
        id: doc.id,
        name: item.name,
        takenOutAt,
        returnReminded: item.returnReminded,
        ref: doc.ref
      });
    });

    let sentCount = 0;

    // 各ユーザーの設定を確認し、必要に応じて通知を送信
    for (const [userId, items] of Object.entries(userItemsMap)) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];
      const notificationsEnabled = userData?.notificationsEnabled !== false;

      // ユーザーが設定した通知タイミング（デフォルト1日）
      const intervalDays = userData?.notificationIntervalDays || 1;

      if (!notificationsEnabled || fcmTokens.length === 0) continue;

      for (const item of items) {
        if (item.returnReminded) continue;

        let interval = intervalDays;
        const isDebug = interval === 0.000347 || interval === 0.0347;
        if (isDebug) interval = 30 / (24 * 60 * 60);

        const elapsedDays = (now - item.takenOutAt) / (24 * 60 * 60 * 1000);

        if (elapsedDays >= interval) {
          let sentForThisItem = false;
          // トークンごとに送信
          for (const tokenInfo of fcmTokens) {
            try {
              await messaging.send({
                token: tokenInfo.token,
                notification: {
                  title: '返却の確認',
                  body: `「${item.name}」を返却しましたか？`,
                },
                data: {
                  itemId: item.id,
                  itemName: item.name,
                  userId: userId,
                },
              });
              sentCount++;
              sentForThisItem = true;
            } catch (error: any) {
              // 無効なトークンを削除
              if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
                await db.collection('users').doc(userId).update({
                  fcmTokens: FieldValue.arrayRemove(tokenInfo),
                });
              }
              logger.error(`[FCM] Failed to send to ${userId}:`, error.message);
            }
          }

          if (sentForThisItem) {
            await item.ref.update({
              returnReminded: true,
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        }
      }
    }

    logger.log(`[FCM] Sent ${sentCount} notifications`);
  } catch (error) {
    logger.error('[FCM] Error in sendReturnReminders:', error);
  }
});

/**
 * ユーザーの通知設定変更を監視
 * v2 の onDocumentWritten を使用
 */
export const onNotificationSettingChange = onDocumentWritten('users/{userId}', (event) => {
  const userId = event.params.userId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (afterData?.notificationsEnabled !== beforeData?.notificationsEnabled) {
    logger.log(`[FCM] Notification setting changed for user ${userId}: ${afterData?.notificationsEnabled}`);
  }
});