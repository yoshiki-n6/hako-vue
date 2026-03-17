import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/storage';

export default function LocationSelectScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemName, itemPhotoUrl } = location.state || { itemName: 'アイテム', itemPhotoUrl: '' };
  
  const { locations, items, addItem, loading } = useData();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showExistingLocations, setShowExistingLocations] = useState(false);

  // Calculate items count currently stored at each location
  const locationsWithCounts = locations.map(loc => ({
    ...loc,
    itemsCount: items.filter(item => item.locationId === loc.id).length
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <header className="bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-2 text-gray-900">場所の選択</h1>
        </div>
        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          ステップ 2/2
        </div>
      </header>

      <main className="flex-1 p-5 pb-20">
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">しまうアイテム</h2>
             <p className="text-base font-extrabold text-gray-800">{itemName}</p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 flex justify-center items-center">
             {itemPhotoUrl ? (
               <img src={itemPhotoUrl} className="w-full h-full object-cover" alt="thumb" />
             ) : (
               <span className="text-[10px] text-gray-400 font-bold">No Image</span>
             )}
          </div>
        </div>

        {/* 1. QRで指定 */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/qr-location-select', { state: { itemName, itemPhotoUrl } })}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
              <QrCode size={28} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-base">QRコードで場所を指定</h4>
              <p className="text-xs font-medium text-blue-100 mt-1">
                場所に貼ってあるQRを読み取るだけで保存
              </p>
            </div>
          </button>
        </div>

        {/* 2. 新しい場所を登録 */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/location-new', { state: { itemName, itemPhotoUrl } })}
            className="w-full bg-white border-2 border-dashed border-gray-300 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-gray-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
              <Plus size={28} className="group-hover:text-blue-600 text-gray-400" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-base">新しい場所を登録する</h4>
              <p className="text-xs font-medium text-gray-500 mt-1">
                風景写真と一緒に場所を分かりやすく記録
              </p>
            </div>
          </button>
        </div>

        {/* 3. 既存の場所から選ぶ（折りたたみ式） */}
        <div className="mt-6">
          <button 
            onClick={() => setShowExistingLocations(!showExistingLocations)}
            className="w-full bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin size={20} className="text-gray-500" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800 text-sm">既存の場所から選ぶ</h4>
                <p className="text-xs text-gray-400">{locations.length}件の場所が登録済み</p>
              </div>
            </div>
            {showExistingLocations ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </button>

          {showExistingLocations && (
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-center p-8 text-gray-500 font-bold text-sm">読み込み中...</div>
              ) : locations.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
                  <p className="text-sm font-bold text-gray-600 mb-1">場所が登録されていません</p>
                  <p className="text-xs text-gray-400">上のボタンから新しい場所を登録してください</p>
                </div>
              ) : (
                locationsWithCounts.map((loc) => (
                  <button 
                    key={loc.id}
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        
                        const imageUrl = await uploadImage(itemPhotoUrl, 'items', currentUser?.uid || 'anonymous');

                        await addItem({
                          locationId: loc.id,
                          name: itemName,
                          tags: [],
                          itemPhotoUrl: imageUrl,
                          status: 'stored'
                        });

                        alert(`${loc.name}に保存しました！`);
                        navigate('/');
                      } catch (error) {
                        console.error("Failed to save item", error);
                        alert("保存に失敗しました");
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className={`w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${
                      isSaving 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900 text-sm">{loc.name}</h4>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{loc.itemsCount}個</span>
                      </div>
                      <p className="text-xs font-medium text-gray-500 mt-1">
                        目印: {loc.markerText || '未設定'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
