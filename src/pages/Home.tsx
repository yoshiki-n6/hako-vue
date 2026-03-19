import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { MapPin, QrCode, Box, ChevronRight, Home as HomeIcon, Users, RotateCcw, History, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateDefaultAvatarDataURL, getAvatarColorFromUserId } from '../utils/avatarUtils';

export default function Home() {
  const { currentUser } = useAuth();
  const { items, locations, updateItemStatus, getUserFavoriteItems } = useData();
  const { currentChannel, getChannelMembers, userProfile } = useChannel();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  const [channelMembers, setChannelMembers] = useState<{ userId: string; nickname: string; photoURL?: string }[]>([]);
  
  useEffect(() => {
    if (currentChannel && currentChannel.type === 'shared') {
      getChannelMembers(currentChannel.id).then(members => {
        setChannelMembers(members.map(m => ({ userId: m.userId, nickname: m.nickname, photoURL: m.photoURL })));
      }).catch(err => console.error('Failed to load channel members:', err));
    }
  }, [currentChannel]);
  
  const isSoloChannel = currentChannel?.type === 'solo';
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

  const favoriteItems = getUserFavoriteItems();

  const getUserNickname = (userId: string | undefined) => {
    if (!userId) return '不明なユーザー';
    const member = channelMembers.find(m => m.userId === userId);
    return member?.nickname || '不明なユーザー';
  };

  const defaultAvatarColor = currentUser?.uid ? getAvatarColorFromUserId(currentUser.uid) : '#45B7D1';
  const displayPhoto = userProfile?.photoURL || generateDefaultAvatarDataURL(defaultAvatarColor);

  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-slate-100' : 'text-gray-900';
  const subtext = dark ? 'text-slate-400' : 'text-gray-500';
  const divider = dark ? 'divide-slate-700' : 'divide-gray-50';
  const hover = dark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  const inputBg = dark ? 'bg-slate-700 text-slate-100' : 'bg-gray-100 text-gray-900';

  return (
    <div className={`max-w-md mx-auto p-5 pb-20 ${dark ? 'bg-slate-900' : ''}`}>
      <header className="mb-6 pt-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400 tracking-tight">Hako-Vue</h1>
          {currentChannel && (
            <div className="flex items-center gap-2 mt-3">
              {currentChannel.type === 'solo' ? (
                <span className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  <HomeIcon size={12} />一人暮らし用
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  <Users size={12} />共有用
                </span>
              )}
              <h2 className={`text-lg font-extrabold truncate ${text}`}>{currentChannel.name}</h2>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/scan" className={`w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-blue-400' : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-200'}`}>
            <QrCode size={20} />
          </Link>
          <Link to="/profile">
            <div className={`w-10 h-10 rounded-full overflow-hidden shadow-sm border-2 ${dark ? 'border-slate-700' : 'border-white'}`}>
              <img src={displayPhoto} alt="User profile" className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>
      </header>

      {!isSoloChannel && (
        <button
          onClick={() => setShowTakenOut(!showTakenOut)}
          className={`w-full border p-4 rounded-2xl mb-6 flex items-center justify-between transition-colors active:scale-[0.98] ${dark ? 'bg-amber-900/30 border-amber-700/50 hover:bg-amber-900/50' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <Box size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>自分が持ち出し中のアイテム</p>
              <p className={`text-xs ${dark ? 'text-amber-500' : 'text-amber-600'}`}>{myTakenOutItems.length}個のアイテム</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-amber-500 transition-transform ${showTakenOut ? 'rotate-90' : ''}`} />
        </button>
      )}

      {!isSoloChannel && showTakenOut && myTakenOutItems.length > 0 && (
        <div className={`mb-6 rounded-2xl border shadow-sm overflow-hidden ${card}`}>
          <div className={`divide-y ${divider}`}>
            {myTakenOutItems.map(item => {
              const location = locations.find(loc => loc.id === item.locationId);
              const isReturning = returningId === item.id;
              return (
                <Link to={`/items/${item.id}`} key={item.id} className={`flex items-center gap-3 p-3 transition-colors min-w-0 ${hover}`}>
                  <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${text}`}>{item.name}</p>
                    <p className={`text-xs truncate flex items-center gap-1 ${subtext}`}>
                      <MapPin size={10} className={dark ? 'text-slate-500 shrink-0' : 'text-gray-400 shrink-0'} />
                      {location?.name || '不明な場所'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleReturn(e, item.id)}
                    disabled={isReturning}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 hover:bg-emerald-100 transition-colors disabled:opacity-50 active:scale-95"
                  >
                    <RotateCcw size={11} className={isReturning ? 'animate-spin' : ''} />返却
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!isSoloChannel && showTakenOut && myTakenOutItems.length === 0 && (
        <div className={`mb-6 border rounded-2xl p-6 text-center ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-sm font-bold ${subtext}`}>持ち出し中のアイテムはありません</p>
        </div>
      )}

      {!isSoloChannel && currentChannel && (
        <Link to={`/channel/${currentChannel.id}/activity`} className={`w-full border p-4 rounded-2xl mb-6 flex items-center justify-between transition-colors active:scale-[0.98] ${card} ${hover}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <History size={20} className={dark ? 'text-slate-300' : 'text-gray-600'} />
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold ${text}`}>アクティビティログ</p>
              <p className={`text-xs ${subtext}`}>アイテムとメンバーの履歴</p>
            </div>
          </div>
          <ChevronRight size={20} className={dark ? 'text-slate-500' : 'text-gray-400'} />
        </Link>
      )}

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className={`text-lg font-bold ${text}`}>よく使うアイテム</h2>
          <Link to="/search" className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">すべてのアイテムを見る</Link>
        </div>

        {favoriteItems.length === 0 ? (
          <div className={`border rounded-2xl p-6 text-center ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-sm font-bold mb-1 ${subtext}`}>よく使うアイテムはまだありません</p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>アイテムを開いて「よく使うアイテムに登録」を押しましょう</p>
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
                    ? card
                    : isMyTakeOut
                    ? dark ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'
                    : dark ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'
                }`}>
                  <Link to={`/items/${item.id}`} className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col flex-1">
                    <div className={`w-full aspect-square rounded-t-2xl flex items-center justify-center overflow-hidden relative ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {!isSoloChannel && item.status === 'taken_out' && (
                        <div className="absolute inset-0 backdrop-blur-[1px]">
                          <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm ${isMyTakeOut ? 'bg-amber-600' : 'bg-red-500'}`}>
                            {isMyTakeOut ? '持ち出し中' : `${getUserNickname(item.takenOutBy)}が持ち出し中`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col min-w-0">
                      <p className={`font-bold text-sm truncate group-hover:text-blue-500 transition-colors ${text}`}>{item.name}</p>
                      <p className={`text-xs truncate mt-0.5 flex items-center gap-1 min-w-0 ${subtext}`}>
                        <MapPin size={10} className={`${dark ? 'text-slate-500' : 'text-gray-400'} shrink-0`} />
                        {location?.name || '不明な場所'}
                      </p>
                    </div>
                  </Link>
                  {(showButton || showReturnButton) && (
                    <div className="px-3 pb-3">
                      {showButton && (
                        <button onClick={async (e) => { e.preventDefault(); try { await updateItemStatus(item.id, 'taken_out'); } catch (err) { console.error(err); } }}
                          className="w-full bg-blue-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-1">
                          <ArrowUp size={14} />持ち出す
                        </button>
                      )}
                      {showReturnButton && (
                        <button onClick={(e) => handleReturn(e, item.id)} disabled={returningId === item.id}
                          className="w-full bg-green-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                          <RotateCcw size={14} />{returningId === item.id ? '返却中...' : '返却する'}
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

      <section className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${dark ? 'bg-blue-900/30 border-blue-800/50' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50'}`}>
        <div className="relative z-10 flex flex-col items-start gap-3">
          <h3 className={`text-md font-bold mb-1 ${dark ? 'text-blue-300' : 'text-blue-900'}`}>新しいアイテムを登録</h3>
          <Link to="/camera" className={`text-blue-600 text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm border transition-colors inline-block active:scale-95 ${dark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-blue-400' : 'bg-white border-black/5 hover:bg-blue-50'}`}>
            撮影ページを開く
          </Link>
        </div>
      </section>
    </div>
  );
}
