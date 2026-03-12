import { ArrowLeft, Box, CheckCircle2, Clock, MapPin, Tag, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function ItemDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, locations, updateItemStatus } = useData();

  const itemData = items.find(i => i.id === id);
  const locationData = itemData ? locations.find(l => l.id === itemData.locationId) : null;

  if (!itemData || !locationData) {
    return <div className="p-8 text-center text-gray-500">アイテムが見つかりません</div>;
  }

  const item = {
    ...itemData,
    locationName: locationData.name,
    markerText: locationData.markerText || '未設定',
    landscapePhoto: locationData.landscapePhoto,
    registeredBy: 'あなた', // Mock user for now
    registeredAt: itemData.createdAt?.toDate ? itemData.createdAt.toDate().toLocaleDateString('ja-JP') : '最近'
  };

  const handleStatusToggle = async () => {
    const newStatus = item.status === 'stored' ? 'taken_out' : 'stored';
    await updateItemStatus(item.id, newStatus);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-24 relative">
      {/* Dynamic Header based on Scroll could go here, for now absolute back button */}
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors">
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      {/* Hero Item Image */}
      <div className="relative w-full aspect-square bg-gray-200">
        <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
        
        {/* Status Badge Over Image */}
        <div className="absolute top-4 right-4 z-10">
          {item.status === 'stored' ? (
            <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-400">
              <CheckCircle2 size={14} /> 保管中
            </span>
          ) : (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-400">
              <Box size={14} /> 持ち出し中
            </span>
          )}
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">{item.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {item.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[10px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/30">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 p-5 -mt-4 relative z-10 bg-gray-50 rounded-t-3xl border-t border-gray-100">
        {/* Context Location Card (CRITICAL FUNCTION) */}
        <section className="mb-6">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <MapPin size={14} /> 収納場所の風景
           </h2>
           <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer active:scale-[0.98] transition-transform">
              <div className="relative h-40 w-full bg-gray-200">
                 <img src={item.landscapePhoto} alt="場所の風景" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                 <div className="absolute bottom-3 left-4 text-white z-10">
                   <p className="text-[10px] text-white/80 font-bold tracking-wider mb-0.5 uppercase drop-shadow-md">目印</p>
                   <p className="font-extrabold text-lg flex items-center gap-1.5 drop-shadow-md">
                     <span className="w-2 h-2 rounded-full bg-blue-400"></span> {item.markerText}
                   </p>
                 </div>
              </div>
              <div className="p-4 flex justify-between items-center bg-white relative z-20">
                 <h3 className="font-bold text-gray-900 text-base">{item.locationName}</h3>
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm cursor-pointer active:scale-95">場所を見る</span>
              </div>
           </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-3 mb-8">
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                <User size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">登録者</span>
              </div>
              <p className="font-bold text-gray-800">{item.registeredBy}</p>
           </div>
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                <Clock size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">登録日</span>
              </div>
              <p className="font-bold text-gray-800 text-sm">{item.registeredAt}</p>
           </div>
        </section>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 inset-x-0 w-full max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-20 pb-8 flex justify-center gap-3">
        <button 
          onClick={handleStatusToggle}
          className={`flex-1 font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 border-2 ${
            item.status === 'stored' 
              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 active:scale-95' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 active:scale-95'
          }`}
        >
          {item.status === 'stored' ? (
            <><Box size={18} /> 持ち出し中にする</>
          ) : (
            <><CheckCircle2 size={18} /> しまった (保管中にする)</>
          )}
        </button>
      </div>
    </div>
  );
}
