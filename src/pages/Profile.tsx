import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Code, ChevronRight, User as UserIcon, Plus, KeyRound, Star, Copy, Check, RefreshCw, Edit2, Users, X, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChannel } from '../contexts/ChannelContext';
import type { Channel, ChannelMember } from '../contexts/ChannelContext';

// Pre-defined avatar icons using DiceBear API
const AVATAR_OPTIONS = [
  { id: 'adventurer-1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { id: 'adventurer-2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
  { id: 'adventurer-3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo' },
  { id: 'adventurer-4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia' },
  { id: 'avataaars-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha' },
  { id: 'avataaars-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala' },
  { id: 'avataaars-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby' },
  { id: 'avataaars-4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily' },
  { id: 'bottts-1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1' },
  { id: 'bottts-2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2' },
  { id: 'bottts-3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot3' },
  { id: 'bottts-4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot4' },
  { id: 'lorelei-1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sophie' },
  { id: 'lorelei-2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Max' },
  { id: 'lorelei-3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Emma' },
  { id: 'lorelei-4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jack' },
  { id: 'fun-emoji-1', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy' },
  { id: 'fun-emoji-2', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool' },
  { id: 'fun-emoji-3', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star' },
  { id: 'fun-emoji-4', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Heart' },
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { channels, currentChannel, userProfile, switchChannel, setDefaultChannel, updateProfile, getChannelMembers } = useChannel();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Member modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || currentUser?.displayName || '');
      setPhotoURL(userProfile.photoURL || currentUser?.photoURL || '');
    }
  }, [userProfile, currentUser]);

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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(nickname, photoURL);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShowMembers = async (channel: Channel) => {
    setSelectedChannel(channel);
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const memberList = await getChannelMembers(channel.id);
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Get user initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const displayName = userProfile?.nickname || currentUser?.displayName || 'User';
  const displayPhoto = userProfile?.photoURL || currentUser?.photoURL || '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white/95 backdrop-blur-md px-4 py-6 sticky top-0 z-10 border-b border-gray-100 mb-4">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">マイページ</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* User Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0 overflow-hidden relative">
              {displayPhoto ? (
                <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1 truncate">
                {displayName}
              </h2>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 truncate">
                <UserIcon size={14} className="shrink-0" /> 
                {currentUser?.email || 'user@example.com'}
              </p>
            </div>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Edit2 size={18} className="text-gray-600" />
            </button>
          </div>
        </section>

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">プロフィール編集</h3>
                <button onClick={() => setIsEditingProfile(false)} className="p-1">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {/* Current Avatar Preview */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-4 ring-blue-100">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(nickname)
                  )}
                </div>
              </div>
              
              {/* Avatar Selection Grid */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-3">アイコンを選択</label>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setPhotoURL(avatar.url)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                        photoURL === avatar.url
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={avatar.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoURL('')}
                  className={`mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                    !photoURL
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  アイコンなし（イニシャル表示）
                </button>
              </div>
              
              {/* Nickname Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">ニックネーム</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ニックネームを入力"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleSaveProfile}
                disabled={saving || !nickname.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存する'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedChannel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{selectedChannel.name} のメンバー</h3>
                <button onClick={() => setShowMembersModal(false)} className="p-1">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(member.nickname)
                        )}
                      </div>
                      <span className="font-bold text-gray-900">{member.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Channel */}
        {currentChannel && (
          <section className={`rounded-3xl p-5 border shadow-sm ${
            currentChannel.type === 'solo'
              ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${currentChannel.type === 'solo' ? 'text-purple-900' : 'text-blue-900'}`}>
                  現在のチャンネル
                </h3>
                {currentChannel.type === 'solo' && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Home size={10} /> 一人暮らし用
                  </span>
                )}
              </div>
              {userProfile?.defaultChannelId === currentChannel.id && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> デフォルト
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{currentChannel.name}</p>
            <div className="flex items-center justify-between">
              {/* 共有用チャンネルのみ招待コードを表示 */}
              {currentChannel.type === 'shared' ? (
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
              ) : (
                <span className="text-sm text-purple-600">自分専用チャンネル</span>
              )}
              {/* 共有用チャンネルのみメンバー表示 */}
              {currentChannel.type === 'shared' && (
                <button
                  onClick={() => handleShowMembers(currentChannel)}
                  className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-white px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <Users size={14} />
                  {currentChannel.memberIds.length}人
                </button>
              )}
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
                className={`p-4 ${currentChannel?.id === channel.id ? (channel.type === 'solo' ? 'bg-purple-50/50' : 'bg-blue-50/50') : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handleSwitchChannel(channel)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    <span className={`font-bold truncate ${currentChannel?.id === channel.id ? (channel.type === 'solo' ? 'text-purple-600' : 'text-blue-600') : 'text-gray-900'}`}>
                      {channel.name}
                    </span>
                    {channel.type === 'solo' && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                        <Home size={10} />
                      </span>
                    )}
                    {currentChannel?.id === channel.id && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        channel.type === 'solo' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100'
                      }`}>
                        使用中
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Member count - 共有用のみ表示 */}
                    {channel.type === 'shared' && (
                      <button
                        onClick={() => handleShowMembers(channel)}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                          channel.memberIds.length >= 2 
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                            : 'text-gray-500 bg-gray-100'
                        }`}
                      >
                        <Users size={12} />
                        {channel.memberIds.length}
                      </button>
                    )}
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
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {/* 共有用チャンネルのみ招待コードを表示 */}
                {channel.type === 'shared' ? (
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
                ) : (
                  <div className="text-xs text-purple-500">
                    一人暮らし用チャンネル
                  </div>
                )}
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
          <p className="text-[10px] font-bold text-gray-400 tracking-wider">HAKO-VUE PROTOTYPE v1.2</p>
        </div>
      </main>
    </div>
  );
}
