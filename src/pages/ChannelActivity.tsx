import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Box, CheckCircle2, UserPlus, UserMinus, Package, RefreshCw, Search, X } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

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
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateGroups, setDateGroups] = useState<string[]>([]);

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
        
        // Get unique date groups
        const groupedLogs: Record<string, typeof activityLogs> = {};
        activityLogs.forEach(log => {
          const dateGroup = formatDateGroup(log.createdAt);
          if (!groupedLogs[dateGroup]) {
            groupedLogs[dateGroup] = [];
          }
          groupedLogs[dateGroup].push(log);
        });

        // Get date groups in order: 今日 → 昨日 → 古い順
        const sortedDateGroups = Object.keys(groupedLogs).sort((a, b) => {
          const order = ['今日', '昨日'];
          const aIndex = order.indexOf(a);
          const bIndex = order.indexOf(b);
          
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          
          // For other dates, sort by actual date (newer first)
          const logA = groupedLogs[a][0];
          const logB = groupedLogs[b][0];
          const dateA = logA.createdAt.toDate ? logA.createdAt.toDate() : new Date(logA.createdAt);
          const dateB = logB.createdAt.toDate ? logB.createdAt.toDate() : new Date(logB.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setDateGroups(sortedDateGroups);
        // Set first date as default
        if (sortedDateGroups.length > 0) {
          setSelectedDate(sortedDateGroups[0]);
        }
      } catch (err) {
        console.error('Failed to load activity logs:', err);
        setError('ログの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [channelId, getActivityLogs]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateGroup = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return '今日';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  const formatDateGroupFull = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return `今日（${date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}）`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return `昨日（${date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}）`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit'
      });
    }
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

  const getLogMessage = (log: ActivityLog, dark: boolean) => {
    switch (log.type) {
      case 'item_taken_out':
        return (
          <>
            <span className={`font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{log.userNickname}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>が</span>
            <span className={`font-bold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{log.itemName || 'アイテム'}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>を持ち出しました</span>
          </>
        );
      case 'item_stored':
        return (
          <>
            <span className={`font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{log.userNickname}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>が</span>
            <span className={`font-bold ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>{log.itemName || 'アイテム'}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>を返却しました</span>
          </>
        );
      case 'member_joined':
        return (
          <>
            <span className={`font-bold ${dark ? 'text-blue-400' : 'text-blue-600'}`}>{log.userNickname}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>がチャンネルに参加しました</span>
          </>
        );
      case 'member_left':
        return (
          <>
            <span className={`font-bold ${dark ? 'text-red-400' : 'text-red-600'}`}>{log.userNickname}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>がチャンネルから脱退しました</span>
          </>
        );
      case 'item_added':
        return (
          <>
            <span className={`font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{log.userNickname}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>が</span>
            <span className={`font-bold ${dark ? 'text-purple-400' : 'text-purple-600'}`}>{log.itemName || 'アイテム'}</span>
            <span className={dark ? 'text-slate-400' : 'text-gray-600'}>を登録しました</span>
          </>
        );
      default:
        return <span className={dark ? 'text-slate-400' : 'text-gray-600'}>不明なアクティビティ</span>;
    }
  };

  const getLogBgColor = (type: ActivityLog['type'], dark: boolean) => {
    if (dark) {
      switch (type) {
        case 'item_taken_out':
          return 'bg-amber-900/30 border-amber-700/50';
        case 'item_stored':
          return 'bg-emerald-900/30 border-emerald-700/50';
        case 'member_joined':
          return 'bg-blue-900/30 border-blue-700/50';
        case 'member_left':
          return 'bg-red-900/30 border-red-700/50';
        case 'item_added':
          return 'bg-purple-900/30 border-purple-700/50';
        default:
          return 'bg-slate-800/50 border-slate-700/50';
      }
    } else {
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
    }
  };

  if (!channel) {
    return (
      <div className={`flex flex-col min-h-screen max-w-md mx-auto ${dark ? 'bg-slate-900' : 'bg-white'}`}>
        <header className={`backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 font-medium transition-colors ${dark ? 'text-slate-300 hover:text-slate-100' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft size={20} />
            戻る
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center p-8">
          <p className={dark ? 'text-slate-400' : 'text-gray-500'}>チャンネルが見つかりません</p>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 font-medium transition-colors ${dark ? 'text-slate-300 hover:text-slate-100' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft size={20} />
            戻る
          </button>
        </div>
        <div className="mt-3 mb-3">
          <h1 className={`text-xl font-black ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{channel.name}</h1>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>アクティビティログ</p>
        </div>

        {/* Date tabs */}
        {dateGroups.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {dateGroups.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedDate === date
                    ? 'bg-blue-500 text-white'
                    : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {formatDateGroupFull(logs.find(log => formatDateGroup(log.createdAt) === date)?.createdAt)}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-slate-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="アイテム名・ユーザー名で検索"
            className={`w-full rounded-xl pl-9 pr-9 py-2.5 text-sm placeholder:placeholder:transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-slate-700 border border-slate-600 text-slate-100 placeholder:text-slate-400' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400 focus:bg-white'}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Box size={32} className={dark ? 'text-slate-500' : 'text-gray-400'} />
            </div>
            <p className={`font-medium ${dark ? 'text-slate-300' : 'text-gray-500'}`}>まだアクティビティがありません</p>
            <p className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>アイテムの持ち出しや登録がここに表示されます</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Search size={32} className={dark ? 'text-slate-500' : 'text-gray-400'} />
            </div>
            <p className={`font-medium ${dark ? 'text-slate-300' : 'text-gray-500'}`}>「{searchQuery}」の検索結果はありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              // Filter logs by selected date
              const logsForSelectedDate = selectedDate
                ? filteredLogs.filter(log => formatDateGroup(log.createdAt) === selectedDate)
                : filteredLogs;

              if (logsForSelectedDate.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <Box size={32} className={dark ? 'text-slate-500' : 'text-gray-400'} />
                    </div>
                    <p className={`font-medium ${dark ? 'text-slate-300' : 'text-gray-500'}`}>この日のアクティビティはありません</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {logsForSelectedDate.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border ${getLogBgColor(log.type, dark)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${dark ? 'bg-slate-700' : 'bg-white'}`}>
                          {getLogIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                            {getLogMessage(log, dark)}
                          </p>
                          <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                            {formatTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
