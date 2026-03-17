import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Box, CheckCircle2, UserPlus, UserMinus, Package, RefreshCw, Search, X } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';

// Define ActivityLog type locally to avoid export issues
interface ActivityLog {
  id: string;
  channelId: string;
  type: 'item_taken_out' | 'item_stored' | 'member_joined' | 'member_left' | 'item_added';
  userId: string;
  userNickname: string;
  itemId?: string;
  itemName?: string;
  createdAt: any;
}

export default function ChannelActivityScreen() {
  const navigate = useNavigate();
  const { id: channelId } = useParams<{ id: string }>();
  const { channels, getActivityLogs } = useChannel();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const channel = channels.find(c => c.id === channelId);

  const filteredLogs = searchQuery.trim()
    ? logs.filter(log => {
        const q = searchQuery.toLowerCase();
        return (
          (log.itemName?.toLowerCase().includes(q)) ||
          (log.userNickname?.toLowerCase().includes(q))
        );
      })
    : logs;

  useEffect(() => {
    const loadLogs = async () => {
      if (!channelId) return;
      
      setLoading(true);
      setError('');
      try {
        const activityLogs = await getActivityLogs(channelId);
        setLogs(activityLogs);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
        setError('ログの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [channelId, getActivityLogs]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'item_taken_out':
        return <Box size={18} className="text-amber-500" />;
      case 'item_stored':
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'member_joined':
        return <UserPlus size={18} className="text-blue-500" />;
      case 'member_left':
        return <UserMinus size={18} className="text-red-500" />;
      case 'item_added':
        return <Package size={18} className="text-purple-500" />;
      default:
        return <Box size={18} className="text-gray-400" />;
    }
  };

  const getLogMessage = (log: ActivityLog) => {
    switch (log.type) {
      case 'item_taken_out':
        return (
          <>
            <span className="font-bold text-gray-900">{log.userNickname}</span>
            <span className="text-gray-600">が</span>
            <span className="font-bold text-amber-600">{log.itemName || 'アイテム'}</span>
            <span className="text-gray-600">を持ち出しました</span>
          </>
        );
      case 'item_stored':
        return (
          <>
            <span className="font-bold text-gray-900">{log.userNickname}</span>
            <span className="text-gray-600">が</span>
            <span className="font-bold text-emerald-600">{log.itemName || 'アイテム'}</span>
            <span className="text-gray-600">を返却しました</span>
          </>
        );
      case 'member_joined':
        return (
          <>
            <span className="font-bold text-blue-600">{log.userNickname}</span>
            <span className="text-gray-600">がチャンネルに参加しました</span>
          </>
        );
      case 'member_left':
        return (
          <>
            <span className="font-bold text-red-600">{log.userNickname}</span>
            <span className="text-gray-600">がチャンネルから脱退しました</span>
          </>
        );
      case 'item_added':
        return (
          <>
            <span className="font-bold text-gray-900">{log.userNickname}</span>
            <span className="text-gray-600">が</span>
            <span className="font-bold text-purple-600">{log.itemName || 'アイテム'}</span>
            <span className="text-gray-600">を登録しました</span>
          </>
        );
      default:
        return <span className="text-gray-600">不明なアクティビティ</span>;
    }
  };

  const getLogBgColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'item_taken_out':
        return 'bg-amber-50 border-amber-100';
      case 'item_stored':
        return 'bg-emerald-50 border-emerald-100';
      case 'member_joined':
        return 'bg-blue-50 border-blue-100';
      case 'member_left':
        return 'bg-red-50 border-red-100';
      case 'item_added':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  if (!channel) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="bg-white/95 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
            <ArrowLeft size={20} />
            戻る
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-gray-500">チャンネルが見つかりません</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto">
      <header className="bg-white/95 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
            <ArrowLeft size={20} />
            戻る
          </button>
        </div>
        <div className="mt-3 mb-3">
          <h1 className="text-xl font-black text-gray-900">{channel.name}</h1>
          <p className="text-sm text-gray-500">アクティビティログ</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="アイテム名・ユーザー名で検索"
            className="w-full bg-gray-100 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 font-bold hover:underline"
            >
              再読み込み
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">まだアクティビティがありません</p>
            <p className="text-sm text-gray-400 mt-1">アイテムの持ち出しや登録がここに表示されます</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">「{searchQuery}」の検索結果はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border ${getLogBgColor(log.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      {getLogMessage(log)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
