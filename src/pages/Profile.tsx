import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Code, ChevronRight, User as UserIcon, Plus, KeyRound, Star, Copy, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChannel } from '../contexts/ChannelContext';
import type { Channel } from '../contexts/ChannelContext';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { channels, currentChannel, userProfile, switchChannel, setDefaultChannel } = useChannel();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSetDefault = async (channelId: string) => {
    setSettingDefault(channelId);
    try {
      await setDefaultChannel(channelId);
    } catch (error) {
      console.error('Failed to set default:', error);
    } finally {
      setSettingDefault(null);
    }
  };

  const handleSwitchChannel = async (channel: Channel) => {
    await switchChannel(channel.id);
  };

  // Get user initials
  const getInitials = () => {
    if (!currentUser?.displayName) return 'U';
    return currentUser.displayName.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white/95 backdrop-blur-md px-4 py-6 sticky top-0 z-10 border-b border-gray-100 mb-4">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">マイページ</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* User Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0 overflow-hidden">
             {currentUser?.photoURL ? (
               <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
             ) : (
               getInitials()
             )}
           </div>
           <div className="min-w-0 flex-1">
             <h2 className="text-xl font-extrabold text-gray-900 mb-1 truncate">
               {currentUser?.displayName || 'User'}
             </h2>
             <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 truncate">
               <UserIcon size={14} className="shrink-0" /> 
               {currentUser?.email || 'user@example.com'}
             </p>
           </div>
        </section>

        {/* Current Channel */}
        {currentChannel && (
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-blue-900">現在のチャンネル</h3>
              {userProfile?.defaultChannelId === currentChannel.id && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> デフォルト
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{currentChannel.name}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">招待コード:</span>
              <code className="bg-white px-2 py-1 rounded font-mono font-bold text-blue-600">
                {currentChannel.inviteCode}
              </code>
              <button
                onClick={() => handleCopyCode(currentChannel.inviteCode)}
                className="text-blue-600 hover:text-blue-700"
              >
                {copiedCode === currentChannel.inviteCode ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </section>
        )}

        {/* Channels List */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 px-1">チャンネル一覧</h3>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
            {channels.map((channel) => (
              <div 
                key={channel.id}
                className={`p-4 ${currentChannel?.id === channel.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handleSwitchChannel(channel)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    <span className={`font-bold truncate ${currentChannel?.id === channel.id ? 'text-blue-600' : 'text-gray-900'}`}>
                      {channel.name}
                    </span>
                    {currentChannel?.id === channel.id && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        使用中
                      </span>
                    )}
                  </button>
                  {userProfile?.defaultChannelId === channel.id ? (
                    <span className="text-amber-500 shrink-0">
                      <Star size={16} fill="currentColor" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(channel.id)}
                      disabled={settingDefault === channel.id}
                      className="text-xs font-medium text-gray-400 hover:text-blue-600 shrink-0 flex items-center gap-1"
                    >
                      {settingDefault === channel.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Star size={14} />
                          デフォルトに設定
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>招待コード:</span>
                  <code className="bg-gray-50 px-1.5 py-0.5 rounded font-mono font-bold">
                    {channel.inviteCode}
                  </code>
                  <button
                    onClick={() => handleCopyCode(channel.inviteCode)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    {copiedCode === channel.inviteCode ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Channel Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/channel/create')}
              className="flex-1 bg-blue-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              チャンネルを作成
            </button>
            <button
              onClick={() => navigate('/channel/join')}
              className="flex-1 bg-white text-blue-600 border-2 border-blue-200 font-bold text-sm py-3 px-4 rounded-xl hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              招待コードで参加
            </button>
          </div>
        </section>

        {/* Settings Menu */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 px-1 pt-2">設定・その他</h3>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
             <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
               <div className="flex items-center gap-3 text-gray-700 text-sm font-bold group-hover:text-blue-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                     <Settings size={16} />
                  </div>
                  アプリ設定
               </div>
               <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
             </button>

             <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
               <div className="flex items-center gap-3 text-gray-700 text-sm font-bold group-hover:text-blue-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                     <Code size={16} />
                  </div>
                  開発者情報
               </div>
               <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
             </button>

             <button 
               onClick={handleLogout}
               className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
             >
               <div className="flex items-center gap-3 text-red-600 text-sm font-bold">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                     <LogOut size={16} />
                  </div>
                  ログアウト
               </div>
             </button>
          </div>
        </section>

        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] font-bold text-gray-400 tracking-wider">HAKO-VUE PROTOTYPE v1.1</p>
        </div>
      </main>
    </div>
  );
}
