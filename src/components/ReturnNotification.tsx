import { AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ReturnNotificationData {
  id: string;
  itemName: string;
  days: number;
}

interface ReturnNotificationProps {
  notification: ReturnNotificationData;
  onDismiss: (id: string) => void;
}

export function ReturnNotification({ notification, onDismiss }: ReturnNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-6 right-6 max-w-sm mx-auto z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Color bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">返却の確認</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              「<span className="font-semibold">{notification.itemName}</span>」を返却しましたか？
              <br />
              {notification.days}日以上持ち出し中です。
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(notification.id), 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 animate-pulse"
            style={{
              animation: 'shrink 5s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export function ReturnNotificationContainer() {
  const [notifications, setNotifications] = useState<ReturnNotificationData[]>([]);

  // グローバルから通知を受け取るためのリスナー
  useEffect(() => {
    const handleReturnNotification = (event: CustomEvent<ReturnNotificationData>) => {
      const newNotification = event.detail;
      setNotifications((prev) => [...prev, newNotification]);
    };

    window.addEventListener('return-reminder-notification', handleReturnNotification as EventListener);
    return () => {
      window.removeEventListener('return-reminder-notification', handleReturnNotification as EventListener);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <ReturnNotification
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </>
  );
}
