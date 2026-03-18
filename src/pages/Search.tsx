import { useState } from 'react';
import { Search as SearchIcon, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { items, locations } = useData();

  // Combine items with their location data and filter by query
  const searchResults = items.map(item => {
    const loc = locations.find(l => l.id === item.locationId);
    return {
      ...item,
      locationName: loc?.name || '不明な場所',
      landscapePhoto: loc?.landscapePhoto || '',
      markerText: loc?.markerText || '未設定'
    };
  }).filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
    item.locationName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      <header className="bg-white/95 backdrop-blur-md px-4 py-5 sticky top-0 z-10 border-b border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="アイテム名、場所、タグで検索..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-100 text-gray-900 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all font-medium text-base border border-transparent focus:border-blue-200"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </header>

      <main className="flex-1 p-4 pt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-bold text-gray-800">
            {query ? '検索結果' : 'すべてのアイテム'}
            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{searchResults.length}</span>
          </p>
        </div>
        
        {searchResults.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm mt-4">
            <SearchIcon size={32} className="mx-auto text-blue-200 mb-3" />
            <p className="text-sm font-bold text-gray-600 mb-1">見つかりませんでした</p>
            <p className="text-xs text-gray-400">別のキーワードを試すか、<br/>新しくアイテムを登録してください</p>
          </div>
        ) : (
          <div className="space-y-6">
            {searchResults.map(item => (
            <Link to={`/items/${item.id}`} key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] block">
              {/* Item Photo - Highly Emphasized */}
              <div className="relative w-full h-56 bg-gray-200">
                <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              
              {/* Location Context */}
              <div className="p-4 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-gray-200 shadow-sm bg-gray-50 relative z-10 transition-transform group-hover:scale-105">
                  <img src={item.landscapePhoto} alt="location context" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-extrabold text-base text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={14} className="text-blue-600" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-gray-600">{item.locationName}</span>
                  </div>
                  {item.tags && item.tags.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      <Tag size={10} /> タグなし
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}
      </main>
    </div>
  );
}
