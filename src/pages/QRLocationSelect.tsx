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
      
      // Save item to this location
      setIsSaving(true);
      setSavingLocationName(matchedLocation.name);
      
      const imageUrl = await uploadImage(itemPhotoUrl, 'items', currentUser?.uid || 'anonymous');
      
      await addItem({
        locationId: matchedLocation.id,
        name: itemName,
        tags: [],
        itemPhotoUrl: imageUrl,
        status: 'stored'
      });
      
      alert(`${matchedLocation.name}に保存しました！`);
      navigate('/');
      
    } catch (err) {
      console.error('QR scan error:', err);
      setError('QRコードの読み取りに失敗しました');
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
        {/* Full screen scanner */}
        <div className="absolute inset-0 z-0">
          <Scanner 
            onScan={handleScan}
            onError={(err) => console.log(err)}
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
      </main>
    </div>
  );
}
