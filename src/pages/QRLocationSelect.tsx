import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, ScanLine, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/storage';

export default function QRLocationSelectScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemName, itemPhotoUrl } = location.state || { itemName: 'アイテム', itemPhotoUrl: '' };
  
  const { locations, addItem } = useData();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingLocationName, setSavingLocationName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [quantityInputMethod, setQuantityInputMethod] = useState<'slider' | 'input'>('slider');

  const handleScan = async (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length === 0 || isSaving) return;
    
    const result = detectedCodes[0].rawValue;
    setError(null);
    
    try {
      const url = new URL(result);
      
      // Extract location ID from URL path like /locations/{id}
      const pathMatch = url.pathname.match(/\/locations\/([^/]+)/);
      if (!pathMatch) {
        setError('場所のQRコードではありません');
        return;
      }
      
      const locationId = pathMatch[1];
      const matchedLocation = locations.find(loc => loc.id === locationId);
      
      if (!matchedLocation) {
        setError('この場所は登録されていません');
        return;
      }
      
      // Show quantity modal instead of saving directly
      setSelectedLocationId(locationId);
      setShowQuantityModal(true);
      
    } catch (err) {
      console.error('QR scan error:', err);
      setError('QRコードの読み取りに失敗しました');
    }
  };

  const handleConfirmQuantity = async () => {
    if (!selectedLocationId) return;
    
    try {
      setIsSaving(true);
      const matchedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (!matchedLocation) return;
      
      setSavingLocationName(matchedLocation.name);
      
      const imageUrl = await uploadImage(itemPhotoUrl, 'items', currentUser?.uid || 'anonymous');
      
      await addItem({
        locationId: matchedLocation.id,
        name: itemName,
        itemPhotoUrl: imageUrl,
        quantity: itemQuantity,
        takenOutQuantity: 0,
        status: 'stored'
      });
      
      alert(`${matchedLocation.name}に${itemQuantity}個保存しました！`);
      navigate('/');
      
    } catch (err) {
      console.error('Save error:', err);
      setError('保存に失敗しました');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative max-w-md mx-auto">
      <header className="absolute top-0 inset-x-0 w-full z-10 px-4 py-8 flex items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center font-bold">QRで場所を指定</div>
        <div className="w-10"></div>
      </header>

      {/* Item info bar */}
      <div className="absolute top-24 inset-x-4 z-10 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/20">
        <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden shrink-0">
          {itemPhotoUrl ? (
            <img src={itemPhotoUrl} className="w-full h-full object-cover" alt="item" />
          ) : (
            <div className="w-full h-full bg-gray-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 font-bold uppercase">保存するアイテム</p>
          <p className="text-sm font-bold text-white truncate">{itemName}</p>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Full screen scanner - ライブラリデフォルトUIを非表示 */}
        <div className="absolute inset-0 z-0 [&_svg]:hidden [&_.qr-scanner-region]:hidden">
          <Scanner 
            onScan={handleScan}
            onError={(err) => console.log(err)}
            components={{ finder: false }}
          />
        </div>

        {/* Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
          <div className="w-64 h-64 relative rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 flex items-center justify-center text-white/30 animate-pulse">
              <ScanLine size={64} strokeWidth={1} />
            </div>
          </div>
          
          <p className="mt-8 text-sm font-bold text-white text-center drop-shadow-md">
            収納場所に貼られたQRコードを<br/>枠内に合わせてください
          </p>
          
          {error && (
            <div className="mt-6 bg-red-500/90 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse">
              {error}
            </div>
          )}
        </div>

        {/* Saving overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">保存中...</h2>
            <p className="text-sm text-gray-400">
              {savingLocationName}に保存しています
            </p>
          </div>
        )}

        {/* Quantity Modal */}
        {showQuantityModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-end z-50">
            <div className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900">個数を選択</h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setQuantityInputMethod('slider')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                    quantityInputMethod === 'slider'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  スライダー
                </button>
                <button
                  onClick={() => setQuantityInputMethod('input')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                    quantityInputMethod === 'input'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  数値入力
                </button>
              </div>

              {quantityInputMethod === 'slider' ? (
                <div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={itemQuantity}
                    onChange={e => setItemQuantity(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center mt-2 text-blue-700 font-bold text-lg">{itemQuantity}個</div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-bold hover:bg-blue-200"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={itemQuantity}
                    onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-gray-50 border border-blue-200 rounded-lg px-3 py-2 text-center font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setItemQuantity(Math.min(999, itemQuantity + 1))}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-bold hover:bg-blue-200"
                  >
                    +
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowQuantityModal(false);
                    setItemQuantity(1);
                    setSelectedLocationId(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmQuantity}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
