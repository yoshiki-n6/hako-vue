/**
 * 定期実行で返却期限超過ユーザーにFCM通知を送信
 * Cloud Scheduler または Pub/Sub で毎時間実行
 */
export declare const sendReturnReminders: any;
/**
 * ユーザーがアプリ設定で通知をONにしたときのハンドラ
 * notificationsEnabled の更新時に実行
 */
export declare const onNotificationSettingChange: any;
