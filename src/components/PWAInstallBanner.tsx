import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAppSettings } from '../contexts/AppSettingsContext';

export function PWAInstallBanner() {
  const { installPrompt, isInstalled, isIOS, install } = usePWAInstall();
  const { settings } = useAppSettings();
  const [dismissed, setDismissed] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const dark = settings.darkMode;

  // インストール済み or 非表示 or どちらのプロンプトも不要 → 表示しない
  if (isInstalled || dismissed) return null;
  if (!installPrompt && !isIOS) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setIosGuideOpen(true);
      return;
    }
    await install();
  };

  return (
    <>
      {/* インストールバナー（モバイル: 下部 / PC: 上部） */}
      <div className={`fixed bottom-20 left-0 right-0 z-50 px-4 pb-safe sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:w-80`}>
        <div className={`rounded-2xl shadow-2xl border p-4 flex items-center gap-3 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm">
            <img src="/pwa-192x192.jpg" alt="Hako-Vueアイコン" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${dark ? 'text-slate-100' : 'text-gray-900'}`}>Hako-Vueをインストール</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>アプリとして使えます</p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            追加
          </button>
          <button
            onClick={() => setDismissed(true)}
            className={`shrink-0 p-1 rounded-full transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS向けガイドモーダル */}
      {iosGuideOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4 pb-8">
          <div className={`rounded-3xl w-full max-w-sm shadow-2xl p-6 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>ホーム画面に追加</h3>
              <button onClick={() => setIosGuideOpen(false)} className={`p-1.5 rounded-full ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-4">
              <li className={`flex items-start gap-3 text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Safariの下部にある<Share size={16} className="inline mx-1 text-blue-500" />共有ボタンをタップ</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><Plus size={16} className="inline mr-1 text-blue-500" />「ホーム画面に追加」をタップ</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>右上の「追加」をタップして完了</span>
              </li>
            </ol>
            <button
              onClick={() => { setIosGuideOpen(false); setDismissed(true); }}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors"
            >
              わかった
            </button>
          </div>
        </div>
      )}
    </>
  );
}
