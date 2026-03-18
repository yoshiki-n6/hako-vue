import { ArrowLeft, Box, CheckCircle2, Clock, MapPin, User, MoreVertical, Edit2, Trash2, X, ChevronDown, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ItemDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, locations, updateItemStatus, updateItem, deleteItem, toggleItemFavorite, isItemFavorite } = useData();
  const { currentChannel, getChannelMembers } = useChannel();
  const { currentUser } = useAuth();
  
  // 一人暮らし用チャンネルかどうか
  const isSoloChannel = currentChannel?.type === 'solo';

  // 登録者ニックネームのマップ (userId -> nickname)
  const [memberNicknameMap, setMemberNicknameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentChannel) return;
    getChannelMembers(currentChannel.id).then(members => {
      const map: Record<string, string> = {};
      members.forEach(m => { map[m.userId] = m.nickname; });
      setMemberNicknameMap(map);
    });
  }, [currentChannel, getChannelMembers]);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocationId, setEditLocationId] = useState('');
  const [saving, setSaving] = useState(false);

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
    registeredBy: memberNicknameMap[itemData.userId] || (itemData.userId === currentUser?.uid ? 'あなた' : '名称未設定'),
    registeredAt: itemData.createdAt?.toDate ? itemData.createdAt.toDate().toLocaleDateString('ja-JP') : '最近'
  };

  const handleStatusToggle = async () => {
    const newStatus = item.status === 'stored' ? 'taken_out' : 'stored';
    await updateItemStatus(item.id, newStatus);
  };

  const handleOpenEdit = () => {
    setEditName(item.name);
    setEditLocationId(item.locationId);
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: editName.trim(),
        locationId: editLocationId
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteItem(item.id);
      navigate(-1);
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-24 relative">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors">
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      {/* Menu button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors"
        >
          <MoreVertical size={20} strokeWidth={3} />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 min-w-[140px]">
              <button 
                onClick={handleOpenEdit}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 size={16} /> 編集
              </button>
              <button 
                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> 削除
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hero Item Image */}
      <div className="relative w-full aspect-square bg-gray-200">
        <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
        
        {/* Status Badge Over Image - 共有用チャンネルのみ表示 */}
        {!isSoloChannel && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            {item.status === 'stored' ? (
              <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-400">
                <CheckCircle2 size={14} /> 保管中
              </span>
            ) : item.takenOutBy === currentUser?.uid ? (
              <span className="bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-400">
                <Box size={14} /> 持ち出し中
              </span>
            ) : (
              <span className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-red-500">
                <Box size={14} /> {memberNicknameMap[item.takenOutBy || ''] || '不明なユーザー'}が持ち出し中
              </span>
            )}
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">{item.name}</h1>
        </div>
      </div>

      <main className="flex-1 p-5 -mt-4 relative z-10 bg-gray-50 rounded-t-3xl border-t border-gray-100">
        {/* Context Location Card */}
        <section className="mb-6">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <MapPin size={14} /> 収納場所の風景
           </h2>
           <div 
             onClick={() => navigate(`/locations/${item.locationId}`)}
             className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer active:scale-[0.98] transition-transform"
           >
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

      {/* Favorite Button Section */}
      <div className="px-5 pb-4">
        <button 
          onClick={async () => {
            try {
              if (id) await toggleItemFavorite(id);
            } catch (err) {
              console.error('Error toggling favorite:', err);
            }
          }}
          className={`w-full font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 border-2 ${
            isItemFavorite(itemData.id)
              ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 active:scale-95'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 active:scale-95'
          }`}
        >
          <Star size={18} fill={isItemFavorite(itemData.id) ? 'currentColor' : 'none'} />
          {isItemFavorite(itemData.id) ? 'よく使うアイテムから削除' : 'よく使うアイテムに登録'}
        </button>
      </div>

      {/* Floating Action Bar - 共有用チャンネルのみ表示 */}
      {!isSoloChannel && (
        <div className="fixed bottom-0 inset-x-0 w-full max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-20 pb-8 flex justify-center gap-3">
          <button 
            onClick={handleStatusToggle}
            disabled={item.status === 'taken_out' && item.takenOutBy !== currentUser?.uid}
            className={`flex-1 font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 border-2 ${
              item.status === 'stored' 
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 active:scale-95' 
                : item.takenOutBy && item.takenOutBy === currentUser?.uid
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 active:scale-95'
                : 'bg-red-50 text-red-600 border-red-200 cursor-not-allowed'
            }`}
          >
            {item.status === 'stored' ? (
              <><Box size={18} /> 持ち出し中にする</>
            ) : item.takenOutBy && item.takenOutBy === currentUser?.uid ? (
              <><CheckCircle2 size={18} /> 返却する</>
            ) : (
              <><Box size={18} /> {memberNicknameMap[item.takenOutBy || ''] || '不明なユーザー'}が持ち出し中</>
            )}
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-gray-900">アイテムを編集</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">名前</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ドライバーセット"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">保管場所</label>
                  <div className="relative">
                    <select
                      value={editLocationId}
                      onChange={(e) => setEditLocationId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editName.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 mb-2">このアイテムを削除しますか？</h2>
              <p className="text-sm text-gray-500 mb-6">
                この操作は取り消せません。
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
