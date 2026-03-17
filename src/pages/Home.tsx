import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { MapPin, QrCode } from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();
  const { items, locations } = useData();
  const { currentChannel } = useChannel();
  
  // 一人暮らし用チャンネルかどうか
  const isSoloChannel = currentChannel?.type === 'solo';

  // Get up to 4 most recently updated items
  const recentItems = [...items]
    .sort((a, b) => b.updatedAt?.toMillis?.() - a.updatedAt?.toMillis?.() || 0)
    .slice(0, 4);

  return (
    <div className="max-w-md mx-auto p-5 pb-20">
      <header className="mb-8 pt-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 tracking-tight">Hako-Vue</h1>
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
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link to="/search" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 hover:shadow-md transition-all group active:scale-[0.98]">
          <span className="text-gray-500 text-xs font-semibold mb-1 group-hover:text-blue-600 transition-colors">登録アイテム数</span>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{items.length}</span>
            <span className="text-xs text-gray-400 font-medium mb-1">個</span>
          </div>
        </Link>
        <Link to="/locations" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 hover:shadow-md transition-all group active:scale-[0.98]">
          <span className="text-gray-500 text-xs font-semibold mb-1 group-hover:text-blue-600 transition-colors">収納場所</span>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{locations.length}</span>
            <span className="text-xs text-gray-400 font-medium mb-1">箇所</span>
          </div>
        </Link>
      </div>

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-800">最近のアイテム</h2>
          <Link to="/search" className="text-xs font-semibold text-primary-500 hover:text-blue-600 transition-colors">すべて見る</Link>
        </div>
        
        {recentItems.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-gray-500 mb-1">まだアイテムがありません</p>
            <p className="text-xs text-gray-400">下の撮影ボタンから最初のアイテムを登録しましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map(item => {
              const location = locations.find(loc => loc.id === item.locationId);
              return (
                <Link to={`/items/${item.id}`} key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col group cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 overflow-hidden relative">
                    <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {/* 共有用チャンネルのみ持ち出し中を表示 */}
                    {!isSoloChannel && item.status === 'taken_out' && (
                       <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px]">
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">持ち出し中</span>
                       </div>
                    )}
                  </div>
                  <p className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                    <MapPin size={10} className="text-gray-400 shrink-0" />
                    {location?.name || '不明な場所'}
                  </p>
                </Link>
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
