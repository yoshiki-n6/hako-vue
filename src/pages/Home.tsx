import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { MapPin, QrCode, Box, ChevronRight, Home as HomeIcon, Users, RotateCcw, History, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { currentUser } = useAuth();
  const { items, locations, updateItemStatus, getUserFavoriteItems } = useData();
  const { currentChannel, getChannelMembers } = useChannel();
  const [channelMembers, setChannelMembers] = useState<{ userId: string; nickname: string }[]>([]);
  
  // Load channel members
  useEffect(() => {
    if (currentChannel && currentChannel.type === 'shared') {
      getChannelMembers(currentChannel.id).then(members => {
        setChannelMembers(members.map(m => ({ userId: m.userId, nickname: m.nickname })));
      }).catch(err => console.error('Failed to load channel members:', err));
    }
  }, [currentChannel]);
  
  // 一人暮らし用チャンネルかどうか
  const isSoloChannel = currentChannel?.type === 'solo';

  // Get only items taken out by current user
  const myTakenOutItems = items.filter(item => item.status === 'taken_out' && item.takenOutBy === currentUser?.uid);
  const [showTakenOut, setShowTakenOut] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const handleReturn = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setReturningId(itemId);
    try {
      await updateItemStatus(itemId, 'stored');
    } catch (error) {
      console.error('Failed to return item:', error);
    } finally {
      setReturningId(null);
    }
  };

  // Get user's favorite items
  const favoriteItems = getUserFavoriteItems();

  // Helper function to get user nickname
  const getUserNickname = (userId: string | undefined) => {
    if (!userId) return '不明なユーザー';
    const member = channelMembers.find(m => m.userId === userId);
    return member?.nickname || '不明なユーザー';
  };

  return (
    <div className="max-w-md mx-auto p-5 pb-20">
      <header className="mb-6 pt-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 tracking-tight">Hako-Vue</h1>
          {currentChannel && (
            <div className="flex items-center gap-2 mt-3">
              {currentChannel.type === 'solo' ? (
                <span className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  <HomeIcon size={12} />
                  一人暮らし用
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  <Users size={12} />
                  共有用
                </span>
              )}
              <h2 className="text-lg font-extrabold text-gray-900 truncate">
                {currentChannel.name}
              </h2>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/scan" className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <QrCode size={20} />
          </Link>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm overflow-hidden border-2 border-white">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 font-bold">{currentUser?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
          </Link>
        </div>
      </header>
      
      {/* 持ち出し中のアイテムボタン（共有チャンネルのみ） */}
      {!isSoloChannel && (
        <button
          onClick={() => setShowTakenOut(!showTakenOut)}
          className="w-full bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center justify-between hover:bg-amber-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <Box size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-amber-800">自分が持ち出し中のアイテム</p>
              <p className="text-xs text-amber-600">{myTakenOutItems.length}個のアイテム</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-amber-500 transition-transform ${showTakenOut ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* 自分が持ち出し中のアイテム一覧 */}
      {!isSoloChannel && showTakenOut && myTakenOutItems.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {myTakenOutItems.map(item => {
              const location = locations.find(loc => loc.id === item.locationId);
              const isReturning = returningId === item.id;
              return (
                <Link 
                  to={`/items/${item.id}`} 
                  key={item.id} 
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors min-w-0"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <MapPin size={10} className="text-gray-400 shrink-0" />
                      {location?.name || '不明な場所'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleReturn(e, item.id)}
                    disabled={isReturning}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 hover:bg-emerald-100 transition-colors disabled:opacity-50 active:scale-95"
                  >
                    <RotateCcw size={11} className={isReturning ? 'animate-spin' : ''} />
                    返却
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!isSoloChannel && showTakenOut && myTakenOutItems.length === 0 && (
        <div className="mb-6 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-bold text-gray-500">持ち出し中のアイテムはありません</p>
        </div>
      )}

      {/* アクティビティログボタン（共有チャンネル���������み） */}
      {!isSoloChannel && currentChannel && (
        <Link
          to={`/channel/${currentChannel.id}/activity`}
          className="w-full bg-white border border-gray-200 p-4 rounded-2xl mb-6 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <History size={20} className="text-gray-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">アクティビティログ</p>
              <p className="text-xs text-gray-500">アイテムとメンバーの履歴</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      )}

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-800">よく使うアイテム</h2>
          <Link to="/search" className="text-xs font-semibold text-primary-500 hover:text-blue-600 transition-colors">すべてのアイテムを見る</Link>
        </div>
        
        {favoriteItems.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-gray-500 mb-1">よく使うアイテムはまだありません</p>
            <p className="text-xs text-gray-400">アイテムを開いて「よく使うアイテムに登録」を押しましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favoriteItems.map(item => {
              const location = locations.find(loc => loc.id === item.locationId);
              const isMyTakeOut = item.status === 'taken_out' && item.takenOutBy === currentUser?.uid;
              const showButton = !isSoloChannel && item.status === 'stored';
              const showReturnButton = !isSoloChannel && isMyTakeOut;
              
              return (
                <div key={item.id} className={`rounded-2xl shadow-sm border flex flex-col overflow-hidden group ${
                  item.status === 'stored' 
                    ? 'bg-white border-gray-100' 
                    : isMyTakeOut 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <Link to={`/items/${item.id}`} className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col flex-1">
                    <div className="w-full aspect-square bg-gray-100 rounded-t-2xl flex items-center justify-center text-gray-400 overflow-hidden relative">
                      <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {/* 共有用チャンネルのみ持ち出し中を表示 */}
                      {!isSoloChannel && item.status === 'taken_out' && (
                         <div className={`absolute inset-0 backdrop-blur-[1px] ${isMyTakeOut ? 'bg-amber-500/20' : 'bg-red-900/40'}`}>
                            <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm ${isMyTakeOut ? 'bg-amber-600' : 'bg-red-500'}`}>
                              {isMyTakeOut ? '持ち出し中' : `${getUserNickname(item.takenOutBy)}が持ち出し中`}
                            </span>
                         </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1 min-w-0">
                        <MapPin size={10} className="text-gray-400 shrink-0" />
                        {location?.name || '不明な場所'}
                      </p>
                    </div>
                  </Link>
                  
                  {/* Take Out / Return Button */}
                  {(showButton || showReturnButton) && (
                    <div className="px-3 pb-3">
                      {showButton && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              await updateItemStatus(item.id, 'taken_out');
                            } catch (err) {
                              console.error('Failed to take out item:', err);
                            }
                          }}
                          className="w-full bg-blue-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <ArrowUp size={14} /> 持ち出す
                        </button>
                      )}
                      {showReturnButton && (
                        <button
                          onClick={(e) => handleReturn(e, item.id)}
                          disabled={returningId === item.id}
                          className="w-full bg-green-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={14} /> {returningId === item.id ? '返却中...' : '返却する'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommended Action */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
        <div className="relative z-10 flex flex-col items-start gap-3">
          <h3 className="text-md font-bold text-blue-900 mb-1">新しいアイテムを登録</h3>
          <Link to="/camera" className="bg-white text-blue-600 text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm border border-black/5 hover:bg-blue-50 transition-colors inline-block active:scale-95">
            撮影ページを開く
          </Link>
        </div>
      </section>
    </div>
  );
}
