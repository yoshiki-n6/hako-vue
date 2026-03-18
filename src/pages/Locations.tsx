import { useState } from 'react';
import { MapPin, Search, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function LocationsScreen() {
  const { locations, items } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  // Create an array with item counts
  const locationsWithCounts = locations.map(loc => ({
    ...loc,
    itemsCount: items.filter(item => item.locationId === loc.id).length
  }));

  // Filter locations by query
  const filteredLocations = locationsWithCounts.filter(loc =>
    loc.name.toLowerCase().includes(query.toLowerCase()) ||
    loc.description?.toLowerCase().includes(query.toLowerCase()) ||
    loc.markerText?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      <header className="bg-white/95 backdrop-blur-md px-4 py-5 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">収納場所</h1>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="場所や目印で検索..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-100 text-gray-900 rounded-2xl py-3.5 pl-11 pr-10 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all font-medium text-sm border border-transparent focus:border-blue-200"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 pt-6 space-y-5">
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-sm font-bold text-gray-800">
             {query ? '検索結果' : 'すべての場所'}
           </h2>
           <span className="text-xs font-bold text-gray-500">{filteredLocations.length} {query ? '件' : '箇所'}</span>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
            <MapPin size={32} className="mx-auto text-blue-200 mb-3" />
            <p className="text-sm font-bold text-gray-600 mb-1">
              {query ? '見つかりませんでした' : '場所が登録されていません'}
            </p>
            <p className="text-xs text-gray-400">
              {query ? '別のキーワードを試してください' : '右下の＋ボタンから新しい収納場所を追加してください'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLocations.map((loc) => (
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
                    <span>目印: {loc.markerText || '未設定'}</span>
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
      <button
        onClick={() => navigate('/location-new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-20"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
