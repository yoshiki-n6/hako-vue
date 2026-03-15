import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Box, MapPin, QrCode, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export default function LocationDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, items, updateLocation, deleteLocation, deleteItem } = useData();
  const [showQR, setShowQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMarkerText, setEditMarkerText] = useState('');
  const [saving, setSaving] = useState(false);

  // Find the current location
  const location = locations.find(loc => loc.id === id);
  // Find all items in this location
  const locationItems = items.filter(item => item.locationId === id);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <p>場所が見つかりません</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 underline">戻る</button>
      </div>
    );
  }

  // The URL to open when the QR code is scanned (points to this location detailed page)
  const qrUrl = `${window.location.origin}/locations/${location.id}`;

  const handleOpenEdit = () => {
    setEditName(location.name);
    setEditDescription(location.description || '');
    setEditMarkerText(location.markerText || '');
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateLocation(location.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        markerText: editMarkerText.trim()
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating location:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      // Delete all items in this location first
      for (const item of locationItems) {
        await deleteItem(item.id);
      }
      // Then delete the location
      await deleteLocation(location.id);
      navigate('/locations');
    } catch (err) {
      console.error('Error deleting location:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative pb-20">
      <header className="fixed top-0 inset-x-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-2 text-gray-900 line-clamp-1">{location.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowQR(true)}
            className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
          >
            <QrCode size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
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
        </div>
      </header>

      <main className="flex-1 pt-20 px-4">
        {/* Landscape Context */}
        <div className="w-full aspect-video bg-gray-200 rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
          <img 
            src={location.landscapePhoto} 
            alt={location.name}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-4 pb-3">
             <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-bold uppercase tracking-wider mb-1">
                <MapPin size={12} /> 目印
             </div>
             <p className="text-white font-medium text-sm drop-shadow-sm">{location.markerText || '未設定'}</p>
          </div>
        </div>

        {location.description && (
          <div className="mb-6 px-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">説明</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{location.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-gray-800">保管されているアイテム</h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{locationItems.length}</span>
        </div>

        {locationItems.length === 0 ? (
           <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm">
             <Box size={24} className="mx-auto text-gray-300 mb-2" />
             <p className="text-sm font-bold text-gray-500 mb-1">アイテムがありません</p>
             <p className="text-xs text-gray-400">アイテムを登録してここに追加しましょう</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {locationItems.map(item => (
              <Link to={`/items/${item.id}`} key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group active:scale-[0.98] transition-transform">
                <div className="aspect-square bg-gray-100 w-full relative">
                  <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
                  {item.status === 'taken_out' && (
                    <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                        持ち出し中
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-snug">{item.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowQR(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 animate-fade-in-up">
            <div className="p-6 text-center">
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">{location.name}</h2>
              <p className="text-xs text-gray-500 font-medium mb-8">このQRコードを印刷して、実際の収納場所に<br/>貼り付けると便利です</p>
              
              <div className="bg-white border-2 border-gray-100 p-4 rounded-3xl inline-block mx-auto mb-6 shadow-sm">
                <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin={false} />
              </div>
              
              <div className="w-full space-y-3">
                 <button 
                  onClick={() => setShowQR(false)}
                  className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                 >
                   閉じる
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-gray-900">場所を編集</h2>
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
                    placeholder="例: リビングの棚"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">目印</label>
                  <input
                    type="text"
                    value={editMarkerText}
                    onChange={(e) => setEditMarkerText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 窓の近くの白い棚"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">説明（任意）</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="メモや説明を入力"
                  />
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
              <h2 className="text-lg font-extrabold text-gray-900 mb-2">この場所を削除しますか？</h2>
              <p className="text-sm text-gray-500 mb-6">
                {locationItems.length > 0 
                  ? `この場所には${locationItems.length}個のアイテムが登録されています。場所を削除すると、これらのアイテムも一緒に削除されます。`
                  : 'この操作は取り消せません。'}
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
