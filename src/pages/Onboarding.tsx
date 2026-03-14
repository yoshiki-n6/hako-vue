import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, User, Users, Plus, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

type Step = 'mode' | 'shared-choice' | 'create' | 'join' | 'migrating';

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createChannel, joinChannelByCode, completeOnboarding, migrateExistingData } = useChannel();
  
  const [step, setStep] = useState<Step>('mode');
  const [channelName, setChannelName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState('');

  // Check if user has existing data
  const checkExistingData = async () => {
    if (!currentUser) return false;
    const locationsSnap = await getDocs(collection(db, `users/${currentUser.uid}/locations`));
    const itemsSnap = await getDocs(collection(db, `users/${currentUser.uid}/items`));
    return !locationsSnap.empty || !itemsSnap.empty;
  };

  const handleSoloMode = async () => {
    setLoading(true);
    setError('');
    try {
      const hasExistingData = await checkExistingData();
      
      if (hasExistingData) {
        setStep('migrating');
        await migrateExistingData();
      } else {
        const channel = await createChannel('マイチャンネル', true);
        await completeOnboarding('solo', channel.id);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      setError('チャンネル名を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const channel = await createChannel(channelName.trim(), true);
      await completeOnboarding('shared', channel.id);
      setCreatedInviteCode(channel.inviteCode);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async () => {
    if (!inviteCode.trim()) {
      setError('招待コードを入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const channel = await joinChannelByCode(inviteCode.trim());
      await completeOnboarding('shared', channel.id);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '招待コードが無効です');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishCreation = () => {
    navigate('/');
  };

  // Migrating state
  if (step === 'migrating') {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">データを移行中...</h2>
        <p className="text-sm text-gray-500 text-center">
          既存のデータを「マイチャンネル」に移行しています。<br />
          しばらくお待ちください。
        </p>
      </div>
    );
  }

  // Created channel - show invite code
  if (createdInviteCode) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-500/30 mb-6">
            <Users size={40} />
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 mb-2">チャンネルを作成しました</h1>
          <p className="text-gray-500 text-center mb-8">
            以下の招待コードを共有して<br />メンバーを招待しましょう
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-xs text-center mb-6">
            <p className="text-xs font-bold text-gray-500 mb-2">招待コード</p>
            <p className="text-3xl font-black tracking-widest text-blue-600">{createdInviteCode}</p>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(createdInviteCode)}
            className="text-blue-600 font-bold text-sm mb-8 hover:underline"
          >
            コードをコピー
          </button>

          <button
            onClick={handleFinishCreation}
            className="w-full max-w-xs bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            はじめる
            <ArrowRight size={18} />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/4 -translate-x-1/4"></div>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-6">
          <Box size={32} strokeWidth={2.5} />
        </div>

        {/* Mode Selection */}
        {step === 'mode' && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2">ようこそ!</h1>
            <p className="text-gray-500 text-center mb-8">利用スタイルを選んでください</p>

            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={handleSoloMode}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">一人暮らし用</h3>
                    <p className="text-sm text-gray-500">自分だけで使う</p>
                  </div>
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setStep('shared-choice')}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">共有用</h3>
                    <p className="text-sm text-gray-500">家族やメンバーと共有</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Shared Mode Choice */}
        {step === 'shared-choice' && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2">共有モード</h1>
            <p className="text-gray-500 text-center mb-8">チャンネルを作成するか、招待コードで参加</p>

            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={() => setStep('create')}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">チャンネルを作成する</h3>
                    <p className="text-sm text-gray-500">新しいチャンネルを作成して招待</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setStep('join')}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    <KeyRound size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">招待コードを入力</h3>
                    <p className="text-sm text-gray-500">既存のチャンネルに参加</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setStep('mode')}
                className="w-full text-gray-500 font-medium py-3 hover:text-gray-700"
              >
                戻る
              </button>
            </div>
          </>
        )}

        {/* Create Channel */}
        {step === 'create' && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2">チャンネルを作成</h1>
            <p className="text-gray-500 text-center mb-8">チャンネル名を入力してください</p>

            <div className="w-full max-w-sm space-y-4">
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="例: 家族の収納、研究室"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-colors"
              />

              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}

              <button
                onClick={handleCreateChannel}
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

              <button
                onClick={() => { setStep('shared-choice'); setError(''); }}
                className="w-full text-gray-500 font-medium py-3 hover:text-gray-700"
              >
                戻る
              </button>
            </div>
          </>
        )}

        {/* Join Channel */}
        {step === 'join' && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2">チャンネルに参加</h1>
            <p className="text-gray-500 text-center mb-8">6桁の招待コードを入力</p>

            <div className="w-full max-w-sm space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none transition-colors uppercase"
              />

              {error && (
                <p className="text-red-500 text-sm font-medium text-center">{error}</p>
              )}

              <button
                onClick={handleJoinChannel}
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

              <button
                onClick={() => { setStep('shared-choice'); setError(''); }}
                className="w-full text-gray-500 font-medium py-3 hover:text-gray-700"
              >
                戻る
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
