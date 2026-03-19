import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { uploadImage } from '../utils/storage';

export default function LocationSelectScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemName, itemPhotoUrl } = location.state || { itemName: 'アイテム', itemPhotoUrl: '' };
  
  const { locations, items, addItem, loading } = useData();
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  const [isSaving, setIsSaving] = useState(false);
  const [showExistingLocations, setShowExistingLocations] = useState(false);

  // Calculate items count currently stored at each location
  const locationsWithCounts = locations.map(loc => ({
    ...loc,
    itemsCount: items.filter(item => item.locationId === loc.id).length
  }));

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto relative ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`px-4 py-4 flex items-center justify-between border-b sticky top-0 z-10 ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/90 border-gray-100 backdrop-blur-md'}`}>
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className={`p-2 -ml-2 rounded-full transition-colors ${dark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-800 hover:bg-gray-100'}`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-lg font-bold ml-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>場所の選択</h1>
        </div>
        <div className={`text-xs font-bold px-3 py-1 rounded-full ${dark ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'}`}>
          ステップ 2/2
        </div>
      </header>

      <main className="flex-1 p-5 pb-20">
        <div className={`mb-6 p-4 rounded-2xl border shadow-sm flex items-center justify-between ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col">
             <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>しまうアイテム</h2>
             <p className={`text-base font-extrabold ${dark ? 'text-slate-100' : 'text-gray-800'}`}>{itemName}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border flex justify-center items-center ${dark ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-200'}`}>
             {itemPhotoUrl ? (
               <img src={itemPhotoUrl} className="w-full h-full object-cover" alt="thumb" />
             ) : (
               <span className={`text-[10px] font-bold ${dark ? 'text-slate-500' : 'text-gray-400'}`}>No Image</span>
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
            className={`w-full border-2 border-dashed p-4 rounded-2xl flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${dark ? 'border-slate-600 hover:border-blue-400 hover:bg-blue-900/10' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${dark ? 'bg-slate-700 group-hover:bg-blue-900/40' : 'bg-gray-50 group-hover:bg-blue-100'}`}>
              <Plus size={28} className={`${dark ? 'text-slate-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'}`} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-base ${dark ? 'text-slate-200' : 'text-gray-800'}`}>新しい場所を登録する</h4>
              <p className={`text-xs font-medium mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                風景写真と一緒に場所を分かりやすく記録
              </p>
            </div>
          </button>
        </div>

        {/* 3. 既存の場所から選ぶ（折りたたみ式） */}
        <div className="mt-6">
          <button 
            onClick={() => setShowExistingLocations(!showExistingLocations)}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <MapPin size={20} className={dark ? 'text-slate-500' : 'text-gray-500'} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-sm ${dark ? 'text-slate-100' : 'text-gray-800'}`}>既存の場所から選ぶ</h4>
                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{locations.length}件の場所が登録済み</p>
              </div>
            </div>
            {showExistingLocations ? (
              <ChevronUp size={20} className={dark ? 'text-slate-500' : 'text-gray-400'} />
            ) : (
              <ChevronDown size={20} className={dark ? 'text-slate-500' : 'text-gray-400'} />
            )}
          </button>

          {showExistingLocations && (
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className={`text-center p-8 font-bold text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>読み込み中...</div>
              ) : locations.length === 0 ? (
                <div className={`border rounded-2xl p-6 text-center shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                  <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-300' : 'text-gray-600'}`}>場所が登録されていません</p>
                  <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>上のボタンから新しい場所を登録してください</p>
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
                    className={`w-full p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${
                      isSaving 
                        ? 'opacity-60 cursor-not-allowed' 
                        : dark ? 'bg-slate-800 border-slate-700 hover:border-blue-500/40 hover:bg-slate-700' : 'bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${dark ? 'bg-blue-900/40 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className={`font-bold text-sm ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{loc.name}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dark ? 'text-slate-400 bg-slate-700' : 'text-gray-400 bg-gray-100'}`}>{loc.itemsCount}個</span>
                      </div>
                      <p className={`text-xs font-medium mt-1 ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
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
