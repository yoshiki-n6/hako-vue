import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraIcon, X, Zap } from 'lucide-react';
import { analyzeItemImage } from '../utils/gemini';

export default function CameraScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied or error", err);
        // Fallback for demo purposes if camera not available
        setHasPermission(true); // Allow proceeding in demo without actual camera
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(async () => {
    setIsAnalyzing(true);
    
    let imageDataUrl = '';
    
    // Try to get actual video frame, else use placeholder
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    }

    if (!imageDataUrl) {
      setIsAnalyzing(false);
      alert('写真の撮影に失敗しました');
      return;
    }

    try {
      // Analyze with Gemini
      const analysisResult = await analyzeItemImage(imageDataUrl);
      
      setIsAnalyzing(false);
      navigate('/confirm', { 
        state: { 
          itemPhotoUrl: imageDataUrl,
          suggestedNames: analysisResult.suggestedNames,
          initialName: analysisResult.initialName
        } 
      });
    } catch (error) {
       console.error("Gemini API Error", error);
       setIsAnalyzing(false);
       navigate('/confirm', { 
        state: { 
          itemPhotoUrl: imageDataUrl,
          suggestedNames: ['エラー発生', '手動で入力'],
          initialName: 'アイテム名を入力'
        } 
      });
    }
  }, [navigate]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 max-w-md mx-auto relative">
        <CameraIcon size={48} className="mb-4 text-gray-500" />
        <h2 className="text-xl font-bold mb-2">カメラアクセスが必要です</h2>
        <p className="text-center text-sm text-gray-400 mb-6">アイテムを撮影するために、カメラへのアクセスを許可してください。</p>
        <button className="bg-primary-500 text-white px-6 py-3 rounded-xl font-bold w-full max-w-xs" onClick={() => window.location.reload()}>
          再試行
        </button>
        <button className="mt-4 text-white p-2" onClick={() => navigate(-1)}>
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden max-w-md mx-auto">
      {/* Camera Viewfinder */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover bg-gray-900"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center z-10">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-black/40 rounded-full backdrop-blur-md text-white border border-white/20 active:scale-95 transition-transform">
          <X size={24} />
        </button>
        <div className="bg-black/60 rounded-full px-5 py-2 backdrop-blur-md text-sm font-bold tracking-wide border border-white/10 shadow-lg">
          アイテムを撮影
        </div>
        <div className="w-[44px]"></div> {/* Placeholder to balance flex-between */}
      </div>

      {/* Guide Box */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-64 h-64 border border-white/30 rounded-3xl relative">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 p-8 pb-12 flex justify-center items-center z-10 pointer-events-none">
        {/* We use a gradient background panel */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        
        <button 
          onClick={capturePhoto}
          disabled={isAnalyzing}
          className="relative w-24 h-24 bg-transparent border-4 border-white/80 rounded-full flex items-center justify-center active:scale-90 transition-all pointer-events-auto"
        >
          <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
        </button>
      </div>

      {/* Analysing Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.8)] animate-pulse">
              <Zap size={32} className="text-white fill-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">AIが解析中...</h2>
          <p className="text-sm font-medium text-gray-400">アイテムの特徴から名前を特定しています</p>
        </div>
      )}
    </div>
  );
}
