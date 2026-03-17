import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, ScanLine } from 'lucide-react';

export default function QRScannerScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      try {
        const url = new URL(result);
        
        // Ensure the scanned URL belongs to our app domain (or local network IP during development)
        // If it starts with our origin, we can extract the path and route internally
        if (url.origin === window.location.origin) {
           navigate(url.pathname);
           return;
        }

        // For demo/development purposes: if the URL contains '/locations/', try to parse the ID
        if (url.pathname.includes('/locations/')) {
           navigate(url.pathname);
           return;
        }

        setError('Hako-Vueの場所QRコードではありません');
      } catch (err) {
        setError('無効なQRコードです');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative">
      <header className="absolute top-0 inset-x-0 w-full z-10 px-4 py-8 flex items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center font-bold">QRスキャン</div>
        <div className="w-10"></div>
      </header>

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
      </main>
    </div>
  );
}
