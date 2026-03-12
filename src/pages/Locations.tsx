import { MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function LocationsScreen() {
  const { locations, items } = useData();
  
  // Create an array with item counts
  const locationsWithCounts = locations.map(loc => ({
    ...loc,
    itemsCount: items.filter(item => item.locationId === loc.id).length
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      <header className="bg-white/95 backdrop-blur-md px-4 py-5 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">収納場所</h1>
        <button className="text-primary-500 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors">
          <Search size={20} />
        </button>
      </header>

      <main className="flex-1 p-4 pt-6 space-y-5">
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-sm font-bold text-gray-800">すべての場所</h2>
           <span className="text-xs font-bold text-gray-500">{locationsWithCounts.length} 箇所</span>
        </div>

        {locationsWithCounts.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
            <MapPin size={32} className="mx-auto text-blue-200 mb-3" />
            <p className="text-sm font-bold text-gray-600 mb-1">場所が登録されていません</p>
            <p className="text-xs text-gray-400">右下の＋ボタンから新しい収納場所を追加してください</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {locationsWithCounts.map((loc) => (
              <Link 
                key={loc.id} 
                to={`/locations/${loc.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:shadow-md hover:border-blue-200 active:scale-[0.98] block"
              >
                <div className="relative h-32 w-full bg-gray-200 overflow-hidden">
                  <img src={loc.landscapePhoto} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 text-white">
                    <h3 className="font-extrabold text-lg drop-shadow-sm">{loc.name}</h3>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                    <MapPin size={12} className="text-blue-500" />
                    {loc.itemsCount} アイテム
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 font-medium line-clamp-1">{loc.description || '説明なし'}</p>
                  <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>マーカー: {loc.markerText || '未設定'}</span>
                    <span className="text-primary-500 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      詳細を見る &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Floating Action Button for adding a new location */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-20">
        <MapPin size={24} className="mb-0.5" />
        <span className="absolute top-3 right-3 w-3 h-3 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
           <span className="text-[8px] font-black text-blue-600 leading-none">+</span>
        </span>
      </button>
    </div>
  );
}
