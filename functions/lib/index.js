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
        // インデックスエラーを回避するため、whereを使わずにすべてのアイテムを一旦取得します
        const itemsSnapshot = await db.collectionGroup('items').get();
        const notificationsToSend = {};
        const now = Date.now();
        // 返却期限超過のアイテムを抽出
        itemsSnapshot.forEach((doc) => {
            const item = doc.data();
            // ★ここで「持ち出し中」以外のデータをスキップ（ここで絞り込みを行う）
            if (item.status !== 'taken_out')
                return;
            const userId = item.takenOutBy;
            if (!userId)
                return;
            const takenOutAt = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
            const elapsedDays = (now - takenOutAt) / (24 * 60 * 60 * 1000);
            // 【テスト用】ステータスがtaken_outなら、経過時間に関係なく全て送る！
            const intervalDays = 0;
            if (elapsedDays >= 0) {
                const key = `${userId}_${intervalDays}`;
                if (!notificationsToSend[key]) {
                    notificationsToSend[key] = {
                        userId,
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
        }); // ← ★余分な }); を消して、forEachを正しく閉じました
        let sentCount = 0;
        for (const data of Object.values(notificationsToSend)) {
            const userDoc = await db.collection('users').doc(data.userId).get();
            if (!userDoc.exists)
                continue;
            const userData = userDoc.data();
            const fcmTokens = userData?.fcmTokens || [];
            const notificationsEnabled = userData?.notificationsEnabled !== false;
            if (!notificationsEnabled || fcmTokens.length === 0)
                continue;
            for (const item of data.items) {
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
                                userId: data.userId,
                            },
                        });
                        sentCount++;
                    }
                    catch (error) {
                        // 無効なトークンを削除
                        if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
                            await db.collection('users').doc(data.userId).update({
                                fcmTokens: FieldValue.arrayRemove(tokenInfo),
                            });
                        }
                        logger.error(`[FCM] Failed to send to ${data.userId}:`, error.message);
                    }
                }
            }
        }
        logger.log(`[FCM] Sent ${sentCount} notifications`);
    }
    catch (error) {
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
