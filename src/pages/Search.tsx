import { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

type FilterType = 'all' | 'taken_out' | 'stored';
type SortType = 'newest' | 'oldest';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortType>('newest');
  const { items, locations } = useData();
  const { currentChannel, getChannelMembers } = useChannel();
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
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
  
  // Helper function to get user nickname
  const getUserNickname = (userId: string | undefined) => {
    if (!userId) return '不明なユーザー';
    const member = channelMembers.find(m => m.userId === userId);
    return member?.nickname || '不明なユーザー';
  };

  // Combine items with their location data and filter by query
  let searchResults = items.map(item => {
    const loc = locations.find(l => l.id === item.locationId);
    return {
      ...item,
      locationName: loc?.name || '不明な場所',
      landscapePhoto: loc?.landscapePhoto || '',
      markerText: loc?.markerText || '未設定'
    };
  }).filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.locationName.toLowerCase().includes(query.toLowerCase())
  );

  // Apply filter based on activeFilter
  if (activeFilter === 'taken_out') {
    searchResults = searchResults.filter(item => item.status === 'taken_out');
  } else if (activeFilter === 'stored') {
    searchResults = searchResults.filter(item => item.status === 'stored');
  }

  // Apply sorting
  searchResults = searchResults.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
  });

  const filterOptions = [
    { value: 'all' as FilterType, label: 'すべて' },
    { value: 'taken_out' as FilterType, label: '持ち出し中' },
    { value: 'stored' as FilterType, label: '保管中' }
  ];

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto pb-20 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`backdrop-blur-md px-4 py-5 sticky top-0 z-10 border-b ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="アイテム名、場所で検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base border border-transparent focus:border-blue-400 ${dark ? 'bg-slate-700 text-slate-100 placeholder:text-slate-400' : 'bg-gray-100 text-gray-900 focus:bg-white'}`}
            />
            <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-400' : 'text-gray-400'}`} size={18} />
          </div>

          <div className="flex gap-2 items-center overflow-x-auto pb-1">
            <div className="flex gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                    activeFilter === option.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className={`ml-auto shrink-0 px-3 py-2 rounded-full transition-all flex items-center gap-1 ${dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <ArrowUpDown size={16} />
              <span className="text-xs font-semibold">{sortOrder === 'newest' ? '新' : '古'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className={`text-sm font-bold ${dark ? 'text-slate-200' : 'text-gray-800'}`}>
            {activeFilter === 'all' && (query ? '検索結果' : 'すべてのアイテム')}
            {activeFilter === 'taken_out' && '持ち出し中'}
            {activeFilter === 'stored' && '保管中'}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${dark ? 'text-slate-400 bg-slate-700' : 'text-gray-500 bg-gray-200'}`}>{searchResults.length}</span>
          </p>
        </div>

        {searchResults.length === 0 ? (
          <div className={`border rounded-2xl p-8 text-center shadow-sm mt-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <SearchIcon size={32} className="mx-auto text-blue-400 mb-3" />
            <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-300' : 'text-gray-600'}`}>見つかりませんでした</p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>別のキーワードを試すか、<br/>新しくアイテムを登録してください</p>
          </div>
        ) : (
          <div className="space-y-6">
            {searchResults.map(item => (
              <Link to={`/items/${item.id}`} key={item.id} className={`rounded-2xl overflow-hidden shadow-sm border flex flex-col group cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] block ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="relative w-full h-56 bg-gray-200">
                  <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {!isSoloChannel && item.status === 'taken_out' && (
                    <div className="absolute inset-0 backdrop-blur-[1px]">
                      <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm ${item.takenOutBy === currentUser?.uid ? 'bg-amber-600' : 'bg-red-600'}`}>
                        {item.takenOutBy === currentUser?.uid ? '持ち出し中' : `${getUserNickname(item.takenOutBy)}が持ち出し中`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex gap-4 items-start">
                  <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 shadow-sm relative z-10 transition-transform group-hover:scale-105 ${dark ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'}`}>
                    <img src={item.landscapePhoto} alt="location context" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 pt-1 min-w-0">
                    <h3 className={`font-extrabold text-base leading-tight mb-1 group-hover:text-blue-500 transition-colors line-clamp-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{item.name}</h3>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="text-blue-500 shrink-0" strokeWidth={2.5} />
                      <span className={`text-xs font-bold truncate ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{item.locationName}</span>
                    </div>
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
