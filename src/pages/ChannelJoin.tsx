import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, KeyRound, Check } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

export default function ChannelJoinScreen() {
  const navigate = useNavigate();
  const { joinChannelByCode } = useChannel();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [joinedChannelName, setJoinedChannelName] = useState('');

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('招待コードを入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const channel = await joinChannelByCode(inviteCode.trim());
      setJoinedChannelName(channel.name);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '招待コードが無効です');
    } finally {
      setLoading(false);
    }
  };

  // Show success screen
  if (success) {
    return (
      <div className={`flex flex-col min-h-screen max-w-md mx-auto ${dark ? 'bg-slate-900' : 'bg-white'}`}>
        <header className={`backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
          <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 font-medium transition-colors ${dark ? 'text-slate-300 hover:text-slate-100' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft size={20} />
            マイページに戻る
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-500/30 mb-6">
            <Check size={40} />
          </div>
          
          <h1 className={`text-2xl font-black mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>参加しました</h1>
          <p className={`text-center mb-8 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            「{joinedChannelName}」に参加しました。<br />
            マイページからチャンネルを切り替えられます。
          </p>

          <button
            onClick={() => navigate('/profile')}
            className={`w-full max-w-xs font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${dark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            完了
            <ArrowRight size={18} />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto ${dark ? 'bg-slate-900' : 'bg-white'}`}>
      <header className={`backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
        <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 font-medium transition-colors ${dark ? 'text-slate-300 hover:text-slate-100' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft size={20} />
          戻る
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-6">
          <KeyRound size={32} />
        </div>
        
        <h1 className={`text-2xl font-black mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>チャンネルに参加</h1>
        <p className={`text-center mb-8 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>6桁の招待コードを入力</p>

        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            maxLength={6}
            className={`w-full border-2 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest uppercase outline-none transition-colors focus:ring-2 focus:ring-blue-500/50 ${dark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`}
          />

          {error && (
            <p className="text-red-500 text-sm font-medium text-center">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || inviteCode.length < 6}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                参加する
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
