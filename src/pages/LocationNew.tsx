import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera as CameraIcon, CheckCircle2, MapPin } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/storage';

export default function LocationNewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  // State from previous step (item registration flow)
  const { itemName, itemPhotoUrl } = location.state || { itemName: null, itemPhotoUrl: null };
  const isFromItemFlow = Boolean(itemName);

  const { addLocation, addItem } = useData();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [markerText, setMarkerText] = useState('');
  const [landscapePhoto, setLandscapePhoto] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Starts the camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraOpen) {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied or error", err);
          alert("カメラへアクセスできませんでした。");
          setIsCameraOpen(false);
        }
      };
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  // Captures the photo from video
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setLandscapePhoto(dataUrl);
        setIsCameraOpen(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name || (!landscapePhoto && !isFromItemFlow)) {
      alert('場所の名前と風景写真は必須です');
      return;
    }

    try {
      setIsSaving(true);
      
      let landscapeUrl = "";
      if (landscapePhoto) {
         landscapeUrl = await uploadImage(landscapePhoto, 'locations', currentUser?.uid || 'anonymous');
      } else {
         landscapeUrl = "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop"; // Default placeholder
      }

      const locationId = await addLocation({
        name,
        description,
        markerText,
        landscapePhoto: landscapeUrl
      });

      // If we came from the item registration flow, also save the item
      if (isFromItemFlow && itemPhotoUrl && itemName) {
        const itemImageUrl = await uploadImage(itemPhotoUrl, 'items', currentUser?.uid || 'anonymous');
        await addItem({
          locationId,
          name: itemName,
          tags: [],
          itemPhotoUrl: itemImageUrl,
          status: 'stored'
        });
        alert(`${name}を新しく登録し、アイテムを保存しました！`);
      } else {
        alert(`${name}を新しく登録しました！`);
      }

      navigate('/');
    } catch (error) {
       console.error("Error creating location", error);
       alert("保存に失敗しました");
       setIsSaving(false);
    }
  };

  // If Camera is Active, Show Fullscreen Camera UI
  if (isCameraOpen) {
    return (
      <div className="relative h-screen bg-black text-white overflow-hidden max-w-md mx-auto">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover bg-gray-900" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/70 to-transparent flex justify-between z-10">
          <button onClick={() => setIsCameraOpen(false)} className="p-2 bg-black/40 rounded-full text-white">戻る</button>
          <div className="font-bold mt-2">場所の風景を撮影</div>
          <div className="w-[44px]"></div>
        </div>
        
        <div className="absolute bottom-0 inset-x-0 p-8 pb-12 flex justify-center z-10">
          <button onClick={capturePhoto} className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center p-1">
             <div className="w-full h-full bg-white rounded-full"></div>
          </button>
        </div>
      </div>
    );
  }

  // Normal Form UI
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative pb-24">
      <header className="bg-white/90 backdrop-blur-md px-4 py-4 flex items-center border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2 text-gray-900">新しい場所の登録</h1>
      </header>

      <main className="p-5 flex-1 space-y-6">
        {/* Context info if arriving from item flow */}
        {isFromItemFlow && (
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
               <img src={itemPhotoUrl} className="w-full h-full object-cover" alt="item" />
            </div>
            <p className="text-xs text-blue-800 font-bold">
              <span className="text-blue-600 block text-[10px] uppercase mb-0.5">保存するアイテム</span>
              {itemName} の新しい収納場所を作成します
            </p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="space-y-5">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">場所の名前 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例: リビングのクローゼット"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-sm"
                />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                  <span>場所の風景写真 <span className="text-red-500">*</span></span>
                  <span className="text-gray-400 font-medium">記憶の呼び起こしに使用</span>
                </label>
                
                {landscapePhoto ? (
                  <div className="relative w-full aspect-video bg-gray-100 rounded-2xl overflow-hidden group">
                    <img src={landscapePhoto} className="w-full h-full object-cover" alt="landscape" />
                    <button 
                      onClick={() => setIsCameraOpen(true)}
                      className="absolute inset-0 bg-black/40 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      撮り直す
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full aspect-video bg-gray-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-colors active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-blue-600">
                      <CameraIcon size={20} />
                    </div>
                    <span className="font-bold text-sm">風景を撮影する</span>
                    <span className="text-[10px] text-gray-400 mt-1">棚の全体像など、少し引いた構図がおすすめ</span>
                  </button>
                )}
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MapPin size={12} /> 目印 (Optional)
                </label>
                <input 
                  type="text" 
                  value={markerText}
                  onChange={e => setMarkerText(e.target.value)}
                  placeholder="例: 3段目の手前、青い箱の隣 など"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-sm"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">説明・メモ (Optional)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="文房具、ガジェット などのざっくりした用途"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-sm h-24 resize-none"
                />
             </div>
          </div>
        </div>
      </main>

      {/* Action Button */}
      <div className="fixed bottom-0 inset-x-0 w-full max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-10 pb-8 flex gap-3">
        <button 
          onClick={handleSave}
          disabled={!name || (!landscapePhoto && !isFromItemFlow) || isSaving}
          className="flex-1 bg-primary-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSaving ? '保存中...' : (isFromItemFlow ? 'ここに保存する' : '場所を登録')}
          {!isSaving && <CheckCircle2 size={20} />}
        </button>
      </div>
    </div>
  );
}
