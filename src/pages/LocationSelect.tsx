import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
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

        <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1">既存の場所から選ぶ</h3>
        
        {loading ? (
          <div className="text-center p-8 text-gray-500 font-bold text-sm">読み込み中...</div>
        ) : locations.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm mb-8">
            <p className="text-sm font-bold text-gray-600 mb-1">場所が登録されていません</p>
            <p className="text-xs text-gray-400">下のボタンから新しい場所を登録して、<br />アイテムを保存してください</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {locationsWithCounts.map((loc) => (
              <button 
                key={loc.id}
                onClick={async () => {
                  try {
                    setIsSaving(true);
                    
                    // 1. Upload photo to storage if it's not a URL
                    const imageUrl = await uploadImage(itemPhotoUrl, 'items', currentUser?.uid || 'anonymous');

                    // 2. Add item to Firestore
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
                className={`w-full bg-white p-4 rounded-xl border-2 shadow-sm flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${
                  isSaving 
                    ? 'border-transparent opacity-60 cursor-not-allowed' 
                    : 'border-transparent hover:border-primary-500'
                }`}
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                     <h4 className="font-bold text-gray-900 text-base">{loc.name}</h4>
                     <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{loc.itemsCount}個</span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300 inline-block"></span>
                    目印: {loc.markerText || '未設定'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-xs text-gray-400 font-bold uppercase tracking-widest">or</span>
          </div>
        </div>

        <div>
           <button 
              onClick={() => navigate('/location-new', { state: { itemName, itemPhotoUrl } })}
              className="w-full bg-white border-2 border-dashed border-gray-300 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-blue-50/50 transition-all text-gray-600 group active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gray-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <Plus size={28} className="group-hover:text-primary-600 text-gray-400" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                 <span className="font-bold text-base text-gray-800 block mb-1">新しい場所を登録する</span>
                 <span className="text-xs text-gray-400 font-medium">風景写真と一緒に場所を分かりやすく記録</span>
              </div>
            </button>
        </div>
      </main>
    </div>
  );
}
