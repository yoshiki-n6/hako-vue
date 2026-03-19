import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Box, MapPin, QrCode, MoreVertical, Edit2, Trash2, X, Search as SearchIcon, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useChannel } from '../contexts/ChannelContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

export default function LocationDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, items, updateLocation, deleteLocation, deleteItem } = useData();
  const { currentChannel, getChannelMembers } = useChannel();
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  const [showQR, setShowQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMarkerText, setEditMarkerText] = useState('');
  const [saving, setSaving] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
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

  // Find the current location
  const location = locations.find(loc => loc.id === id);
  // Find all items in this location
  const locationItems = items.filter(item => item.locationId === id);
  // Filter items by search query
  const filteredItems = locationItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  if (!location) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${dark ? 'bg-slate-900 text-slate-400' : 'text-gray-500'}`}>
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

  const handleShareQR = async () => {
    console.log("[v0] Share button clicked");
    
    // QRコード要素を取得
    const qrElement = document.getElementById('qr-code-print');
    if (!qrElement) return;

    try {
      // SVGをcanvasに変換してdata URLを取得
      const svg = qrElement.querySelector('svg');
      if (!svg) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return; // ctxがnullの場合は処理を中止
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Web Share APIが利用可能か確認
        if (navigator.share && navigator.canShare) {
          try {
            // data URLをblobに変換
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // canShare でファイル共有が可能か確認
            if (navigator.canShare({ files: [new File([blob], 'qr-code.png')] })) {
              const file = new File([blob], `${location.name}-QR.png`, { type: 'image/png' });
              await navigator.share({
                title: location.name,
                text: `${location.name}の収納場所情報`,
                files: [file],
              });
              console.log("[v0] Share successful");
            } else {
              // ファイル共有が不可の場合は、テキストのみで共有
              await navigator.share({
                title: location.name,
                text: `${location.name}の収納場所情報のQRコード: ${dataUrl}`,
              });
              console.log("[v0] Share successful (text only)");
            }
          } catch (err) {
            console.log("[v0] Share cancelled or failed, falling back to print:", err);
            showPrintDialog(dataUrl);
          }
        } else {
          // フォールバック: 印刷ダイアログを表示
          console.log("[v0] Web Share API not available, showing print dialog");
          showPrintDialog(dataUrl);
        }
      };
      
      // SVGをdata URLに変換
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.src = svgUrl;
    } catch (err) {
      console.error("[v0] Error in handleShareQR:", err);
    }
  };

  const showPrintDialog = (dataUrl: string) => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${location.name}のQRコード</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              color: #111;
            }
            p {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            img {
              width: 250px;
              height: 250px;
              border-radius: 12px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${location.name}</h1>
            <p>この場所の情報QRコード</p>
            <img src="${dataUrl}" alt="QRコード" />
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto relative pb-20 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`fixed top-0 inset-x-0 w-full max-w-md mx-auto backdrop-blur-md z-10 px-4 py-4 flex items-center justify-between border-b ${dark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-gray-100'}`}>
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className={`p-2 -ml-2 rounded-full transition-colors ${dark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-800 hover:bg-gray-100'}`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-lg font-bold ml-2 line-clamp-1 min-w-0 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{location.name}</h1>
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
              className={`p-2 rounded-full transition-colors ${dark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className={`absolute right-0 top-full mt-1 rounded-xl shadow-lg border py-1 z-30 min-w-[140px] ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                  <button onClick={handleOpenEdit} className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2 ${dark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Edit2 size={16} /> 編集
                  </button>
                  <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} className={`w-full px-4 py-2.5 text-left text-sm font-medium text-red-500 flex items-center gap-2 ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                    <Trash2 size={16} /> 削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20 px-4">
        <div className={`w-full aspect-video rounded-2xl shadow-sm border overflow-hidden mb-6 relative ${dark ? 'bg-slate-700 border-slate-700' : 'bg-gray-200 border-gray-100'}`}>
          <img src={location.landscapePhoto} alt={location.name} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-4 pb-3">
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-bold uppercase tracking-wider mb-1">
              <MapPin size={12} /> 目印
            </div>
            <p className="text-white font-medium text-sm drop-shadow-sm">{location.markerText || '未設定'}</p>
          </div>
        </div>

        {location.description && (
          <div className="mb-6 px-1">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>説明</h3>
            <p className={`text-sm leading-relaxed font-medium ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{location.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className={`text-sm font-bold ${dark ? 'text-slate-200' : 'text-gray-800'}`}>保管されているアイテム</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dark ? 'text-slate-400 bg-slate-700' : 'text-gray-500 bg-gray-200'}`}>{filteredItems.length}</span>
        </div>

        {locationItems.length > 0 && (
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="アイテムを検索..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className={`w-full rounded-xl py-2.5 pl-9 pr-9 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm border border-transparent focus:border-blue-400 ${dark ? 'bg-slate-700 text-slate-100 placeholder:text-slate-400' : 'bg-gray-100 text-gray-900 focus:bg-white'}`}
            />
            <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-400' : 'text-gray-400'}`} size={16} />
            {itemSearchQuery && (
              <button onClick={() => setItemSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {locationItems.length === 0 ? (
          <div className={`border text-center rounded-2xl p-6 shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <Box size={24} className={`mx-auto mb-2 ${dark ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>アイテムがありません</p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>アイテムを登録してここに追加しましょう</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`border text-center rounded-2xl p-6 shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <SearchIcon size={24} className={`mx-auto mb-2 ${dark ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>見つかりませんでした</p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>別のキーワードを試してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <Link to={`/items/${item.id}`} key={item.id} className={`rounded-xl overflow-hidden shadow-sm border group active:scale-[0.98] transition-transform ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className={`aspect-square w-full relative ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <img src={item.itemPhotoUrl} alt={item.name} className="w-full h-full object-cover" />
                  {!isSoloChannel && item.status === 'taken_out' && (
                    <div className={`absolute inset-0 backdrop-blur-[2px] flex items-center justify-center ${item.takenOutBy === currentUser?.uid ? 'bg-amber-900/40' : 'bg-red-900/40'}`}>
                      <span className={`text-white font-bold text-[10px] px-2 py-1 rounded-full shadow-sm ${item.takenOutBy === currentUser?.uid ? 'bg-amber-600' : 'bg-red-600'}`}>
                        {item.takenOutBy === currentUser?.uid ? '持ち出し中' : `${getUserNickname(item.takenOutBy)}が持ち出し中`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className={`font-bold text-xs line-clamp-2 leading-snug ${dark ? 'text-slate-200' : 'text-gray-900'}`}>{item.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowQR(false)}></div>
          <div className={`rounded-2xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="p-4 sm:p-6 text-center min-w-0">
              <h2 className={`text-base sm:text-lg font-extrabold mb-0.5 sm:mb-1 line-clamp-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{location.name}</h2>
              <p className={`text-[11px] sm:text-xs font-medium mb-4 sm:mb-6 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>このQRコードを印刷して、実際の収納場所に<br/>貼り付けると便利です</p>
              <div className="bg-white border-2 border-gray-100 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl inline-block mx-auto mb-4 sm:mb-6 shadow-sm" id="qr-code-print">
                <QRCodeSVG value={qrUrl} size={160} level="H" includeMargin={false} />
              </div>
              <div className="w-full space-y-2 sm:space-y-3">
                <button onClick={handleShareQR} className="w-full bg-blue-600 text-white font-bold py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Printer size={16} className="sm:w-[18px] sm:h-[18px]" /> 共有・印刷する
                </button>
                <button onClick={() => setShowQR(false)} className={`w-full font-bold py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl active:scale-95 transition-all ${dark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-extrabold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>場所を編集</h2>
                <button onClick={() => setShowEditModal(false)} className={`p-2 rounded-full transition-colors ${dark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <X size={20} className={dark ? 'text-slate-400' : 'text-gray-500'} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>名前</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 border' : 'bg-gray-50 border border-gray-200'}`}
                    placeholder="例: リビングの棚" />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>目印</label>
                  <input type="text" value={editMarkerText} onChange={(e) => setEditMarkerText(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 border' : 'bg-gray-50 border border-gray-200'}`}
                    placeholder="例: 窓の近くの白い棚" />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>説明（任意）</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 border' : 'bg-gray-50 border border-gray-200'}`}
                    placeholder="メモや説明を入力" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${dark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  キャンセル
                </button>
                <button onClick={handleSaveEdit} disabled={saving || !editName.trim()} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
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
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-6 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-extrabold mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>場所を削除しますか？</h2>
            <p className={`text-sm mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>「{location.name}」を削除します。</p>
            {locationItems.length > 0 && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl mb-4">この場所に登録されている {locationItems.length} 個のアイテムも削除されます。</p>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${dark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                キャンセル
              </button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                {saving ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
