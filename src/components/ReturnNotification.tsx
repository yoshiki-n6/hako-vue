import { AlertCircle, Bell, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../contexts/AppSettingsContext';

export interface ReturnNotificationData {
  id: string;
  itemId: string;
  itemName: string;
  days: number;
  receivedAt?: number;
}

interface ReturnNotificationProps {
  notification: ReturnNotificationData;
  onDismiss: (id: string) => void;
  index: number;
}

export function ReturnNotification({ notification, onDismiss, index }: ReturnNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { settings } = useAppSettings();
  const dark = settings.darkMode;

  useEffect(() => {
    // Slight delay for staggered entrance
    const enterTimer = setTimeout(() => setIsVisible(true), index * 80);
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 6000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification.id, onDismiss, index]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-100'}`}>
        {/* Top color bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 to-red-500" />

        <div className="px-4 py-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-amber-900/40' : 'bg-amber-50'}`}>
            <AlertCircle size={18} className={dark ? 'text-amber-400' : 'text-amber-600'} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${dark ? 'text-slate-400' : 'text-gray-400'}`}>返却の確認</p>
            <p className={`text-sm font-bold truncate ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              「{notification.itemName}」を返却しましたか？
            </p>
          </div>
          <button
            onClick={dismiss}
            className={`p-1.5 rounded-full shrink-0 transition-colors ${dark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Shrinking progress bar */}
        <div className={`h-0.5 ${dark ? 'bg-slate-700' : 'bg-gray-100'} overflow-hidden`}>
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-red-500"
            style={{ animation: 'notif-shrink 6s linear forwards' }}
          />
        </div>
      </div>
    </div>
  );
}

export function ReturnNotificationContainer() {
  const [notifications, setNotifications] = useState<ReturnNotificationData[]>([]);

  useEffect(() => {
    const handler = (event: CustomEvent<ReturnNotificationData>) => {
      const n = { ...event.detail, receivedAt: Date.now() };
      setNotifications(prev => {
        // 重複排除
        if (prev.some(p => p.id === n.id)) return prev;
        return [n, ...prev];
      });
    };
    window.addEventListener('return-reminder-notification', handler as EventListener);
    return () => window.removeEventListener('return-reminder-notification', handler as EventListener);
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <>
      <style>{`
        @keyframes notif-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {/* Top of screen, below safe area */}
      <div className="fixed top-4 inset-x-0 mx-auto max-w-sm px-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto">
            <ReturnNotification
              notification={notification}
              onDismiss={handleDismiss}
              index={index}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// Bell button badge component for Home
export function NotificationBell() {
  const [history, setHistory] = useState<ReturnNotificationData[]>([]);
  const [open, setOpen] = useState(false);
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const dark = settings.darkMode;

  // localStorageから初期化
  useEffect(() => {
    const saved = localStorage.getItem('hako-notification-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.log('[v0] Failed to load notification history:', e);
      }
    }
  }, []);

  // 履歴をlocalStorageに保存（変更検知）
  useEffect(() => {
    localStorage.setItem('hako-notification-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const handler = (event: CustomEvent<ReturnNotificationData>) => {
      const n = { ...event.detail, receivedAt: Date.now() };
      setHistory(prev => {
        if (prev.some(p => p.id === n.id)) return prev;
        return [n, ...prev].slice(0, 20); // 最大20件
      });
    };
    window.addEventListener('return-reminder-notification', handler as EventListener);
    return () => window.removeEventListener('return-reminder-notification', handler as EventListener);
  }, []);

  const unreadCount = history.length;

  const handleItemClick = (itemId: string) => {
    navigate(`/items/${itemId}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-400' : 'bg-white border-gray-100 text-gray-600 hover:text-amber-600 hover:border-amber-200'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <Bell size={16} className={dark ? 'text-slate-400' : 'text-gray-500'} />
                <span className={`text-sm font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>返却リマインド履歴</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => { setHistory([]); setOpen(false); }}
                  className={`text-xs font-bold transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  全削除
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle2 size={28} className={`mx-auto mb-2 ${dark ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`text-sm font-bold ${dark ? 'text-slate-400' : 'text-gray-400'}`}>通知はありません</p>
                </div>
              ) : (
                history.map(n => (
                  <button
                    key={`${n.id}_${n.receivedAt}`}
                    onClick={() => handleItemClick(n.itemId)}
                    className={`w-full px-4 py-3 border-b last:border-b-0 flex items-center gap-3 transition-colors ${dark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-50 hover:bg-gray-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-amber-900/40' : 'bg-amber-50'}`}>
                      <AlertCircle size={16} className={dark ? 'text-amber-400' : 'text-amber-600'} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-sm font-bold truncate ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{n.itemName}</p>
                      <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {n.receivedAt ? new Date(n.receivedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className={dark ? 'text-slate-600' : 'text-gray-300'} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setHistory(prev => prev.filter(p => !(p.id === n.id && p.receivedAt === n.receivedAt))); }}
                      className={`p-1 rounded-full transition-colors ${dark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      <X size={14} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
