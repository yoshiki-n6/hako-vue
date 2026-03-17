import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Users, Copy, Check, Home } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';

export default function ChannelCreateScreen() {
  const navigate = useNavigate();
  const { createChannel } = useChannel();
  
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'solo' | 'shared'>('shared');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState('');
  const [createdChannelType, setCreatedChannelType] = useState<'solo' | 'shared'>('shared');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!channelName.trim()) {
      setError('チャンネル名を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const channel = await createChannel(channelName.trim(), false, channelType);
      setCreatedInviteCode(channel.inviteCode);
      setCreatedChannelType(channelType);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(createdInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show success screen with invite code
  if (createdInviteCode) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="bg-white/95 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
            <ArrowLeft size={20} />
            マイページに戻る
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl mb-6 ${
            createdChannelType === 'solo' 
              ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-500/30'
              : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
          }`}>
            {createdChannelType === 'solo' ? <Home size={40} /> : <Users size={40} />}
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 mb-2">チャンネルを作成しました</h1>
          
          {createdChannelType === 'shared' ? (
            <>
              <p className="text-gray-500 text-center mb-8">
                以下の招待コードを共有して<br />メンバーを招待しましょう
              </p>

              <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-xs text-center mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2">招待コード</p>
                <p className="text-3xl font-black tracking-widest text-blue-600">{createdInviteCode}</p>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-8 hover:underline"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    コピーしました
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    コードをコピー
                  </>
                )}
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-center mb-8">
              一人暮らし用チャンネルは<br />あなた専用の収納管理に最適です
            </p>
          )}

          <button
            onClick={() => navigate('/profile')}
            className="w-full max-w-xs bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            完了
            <ArrowRight size={18} />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      <header className="bg-white/95 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft size={20} />
          戻る
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-6">
          <Users size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">チャンネルを作成</h1>
        <p className="text-gray-500 text-center mb-8">チャンネルの種類と名前を設定してください</p>

        <div className="w-full max-w-sm space-y-4">
          {/* Channel Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">チャンネルの種類</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannelType('solo')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  channelType === 'solo'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Home size={24} />
                <span className="font-bold text-sm">一人暮らし用</span>
                <span className="text-[10px] text-gray-500">自分専用</span>
              </button>
              <button
                type="button"
                onClick={() => setChannelType('shared')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  channelType === 'shared'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Users size={24} />
                <span className="font-bold text-sm">共有用</span>
                <span className="text-[10px] text-gray-500">家族・同居人向け</span>
              </button>
            </div>
            {channelType === 'solo' && (
              <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                招待機能や持ち出し管理がシンプルになります
              </p>
            )}
          </div>

          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={channelType === 'solo' ? '例: 自宅、マイルーム' : '例: 家族の収納、研究室'}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-colors"
          />

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                作成する
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
