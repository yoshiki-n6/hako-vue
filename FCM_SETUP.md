# Firebase Cloud Messaging (FCM) 導入ガイド

## セットアップ手順

### 1. Firebase Console の設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. **プロジェクト設定** > **Cloud Messaging** タブ
4. **サーバーキー** の横に表示される **VAPID キー** をコピー
5. 環境変数 `VITE_FIREBASE_VAPID_KEY` に設定

### 2. Cloud Scheduler の設定（バックグラウンド通知用）

1. Firebase Console > **Cloud Scheduler**
2. **ジョブを作成**
   - **名前**: `hako-return-reminders`
   - **頻度**: `0 * * * *` (毎時間0分)
   - **タイムゾーン**: `Asia/Tokyo`
   - **実行内容**: Cloud Pub/Sub
   - **Pub/Sub トピック**: `return-reminders-trigger`
   - **メッセージボディ**: `{}`

### 3. Cloud Functions のデプロイ

```bash
# プロジェクトルートから
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Firestoreユーザースキーマ

```
users/{userId}
├── uid: string                     // Firebase Auth UID
├── notificationsEnabled: boolean   // 返却リマインド通知ON/OFF
├── notificationIntervalDays: number // 通知タイミング (1, 3, 7)
├── fcmTokens: array<{
│   ├── token: string               // FCMトークン
│   ├── createdAt: string (ISO)     // トークン作成日時
│   └── userAgent: string           // デバイス情報
├── fcmToken: string (推奨廃止)
└── lastFCMTokenUpdate: string (ISO)

```

## クライアント側の動作フロー

1. ユーザーがマイページで「返却リマインド通知」をON
   ↓
2. ブラウザの通知許可ダイアログが表示
   ↓
3. ユーザーが「許可」をクリック
   ↓
4. `useFCM` フックが FCM トークンを取得
   ↓
5. トークンを Firestore の `users/{userId}/fcmTokens` に保存
   ↓
6. Service Worker が `push` イベントを受け取り通知を表示

## バックエンド側の動作フロー

1. Cloud Scheduler が毎時間トリガー
   ↓
2. `sendReturnReminders()` Cloud Function が実行
   ↓
3. すべての「持ち出し中」アイテムを検索
   ↓
4. 返却期限超過ユーザーを判定
   ↓
5. Firestore から FCM トークンを取得
   ↓
6. `firebase-admin` で FCM メッセージを送信
   ↓
7. ユーザーのデバイスで通知が表示

## トラブルシューティング

### 通知がこない

- [ ] VAPID キーが正しく設定されているか確認
- [ ] ユーザーが通知許可を与えているか確認
- [ ] Cloud Functions がデプロイされているか確認
- [ ] FCM トークンが Firestore に保存されているか確認
- [ ] Firebase Console > Messaging > Logs を確認

### トークンエラー

- Invalid registration token: 古いトークンは自動削除されます
- Authentication error: VAPID キーを再確認してください

## 次のステップ

- [ ] Firestore セキュリティルール の設定（fcmTokens の保護）
- [ ] FCM トークンの定期的な更新ポリシー
- [ ] ユーザーがトークンを無効化できる機能
