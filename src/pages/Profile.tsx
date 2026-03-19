import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Plus, KeyRound, Star, Copy, Check, RefreshCw, Edit2, Users, X, Home, History, MoreVertical, Trash2, Pencil, AlertTriangle, Upload, Moon, Bell, BellOff, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChannel } from '../contexts/ChannelContext';
import type { Channel, ChannelMember } from '../contexts/ChannelContext';
import { generateDefaultAvatarDataURL, getAvatarColorFromUserId } from '../utils/avatarUtils';
import { useAppSettings } from '../contexts/AppSettingsContext';
import type { NotificationInterval } from '../contexts/AppSettingsContext';
import { requestAndSaveFCMToken, removeFCMToken } from '../hooks/useFCM';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { channels, currentChannel, userProfile, switchChannel, setDefaultChannel, updateProfile, getChannelMembers, leaveChannel, updateChannelName } = useChannel();
  const { settings, toggleDarkMode, toggleNotifications, setNotificationInterval } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [nickname, setNickname] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Member modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Channel action states
  const [showChannelMenu, setShowChannelMenu] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<Channel | null>(null);
  const [leavingChannel, setLeavingChannel] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState<Channel | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [savingChannelName, setSavingChannelName] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setPhotoPreview(userProfile.photoURL || '');
    }
  }, [userProfile]);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルのみアップロード可能です');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(nickname, photoPreview);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('プロフィールの保存に失敗しました');
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

  const handleLeaveChannel = async () => {
    if (!showLeaveConfirm) return;
    setLeavingChannel(true);
    try {
      await leaveChannel(showLeaveConfirm.id);
      setShowLeaveConfirm(null);
    } catch (error) {
      console.error('Failed to leave channel:', error);
    } finally {
      setLeavingChannel(false);
    }
  };

  const handleOpenEditChannel = (channel: Channel) => {
    setEditingChannelName(channel.name);
    setShowEditChannelModal(channel);
    setShowChannelMenu(null);
  };

  const handleSaveChannelName = async () => {
    if (!showEditChannelModal || !editingChannelName.trim()) return;
    setSavingChannelName(true);
    try {
      await updateChannelName(showEditChannelModal.id, editingChannelName.trim());
      setShowEditChannelModal(null);
    } catch (error) {
      console.error('Failed to update channel name:', error);
    } finally {
      setSavingChannelName(false);
    }
  };

  const displayName = userProfile?.nickname || 'User';
  const defaultAvatarColor = currentUser?.uid ? getAvatarColorFromUserId(currentUser.uid) : '#45B7D1';
  const displayPhoto = userProfile?.photoURL || generateDefaultAvatarDataURL(defaultAvatarColor);
  const dark = settings.darkMode;
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-slate-100' : 'text-gray-900';
  const subtext = dark ? 'text-slate-400' : 'text-gray-500';
  const hover = dark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  const inputCls = dark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-400' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500';

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto pb-24 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`backdrop-blur-md px-4 py-6 sticky top-0 z-10 border-b mb-4 ${dark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
        <h1 className={`text-xl font-extrabold tracking-tight ${text}`}>マイページ</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* User Card */}
        <section className={`rounded-3xl p-6 shadow-sm border ${card}`}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full shadow-md shrink-0 overflow-hidden">
              <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`text-xl font-extrabold mb-1 truncate ${text}`}>
                {displayName}
              </h2>
              <p className={`text-sm font-medium flex items-center gap-1.5 truncate ${subtext}`}>
                <UserIcon size={14} className="shrink-0" />
                {currentUser?.email || 'user@example.com'}
              </p>
            </div>
            <button
              onClick={() => {
                setPhotoPreview(userProfile?.photoURL || '');
                setPhotoFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsEditingProfile(true);
              }}
              className={`p-2 rounded-full transition-colors ${dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <Edit2 size={18} className={dark ? 'text-slate-300' : 'text-gray-600'} />
            </button>
          </div>
        </section>
        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`rounded-3xl p-6 w-full max-w-sm ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${text}`}>プロフィール編集</h3>
                <button onClick={() => setIsEditingProfile(false)} className="p-1">
                  <X size={20} className={dark ? 'text-slate-400' : 'text-gray-500'} />
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-100 shadow-md">
                  <img src={photoPreview || generateDefaultAvatarDataURL(defaultAvatarColor)} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-bold mb-3 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>アイコン画像</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold ${dark ? 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400' : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                >
                  <Upload size={18} />画像を選択
                </button>
                <p className={`text-xs mt-2 ${subtext}`}>JPG、PNG など最大5MBまで</p>
                {photoFile && <p className="text-xs text-green-500 font-medium mt-1">✓ {photoFile.name} を選択</p>}
                <button
                  type="button"
                  onClick={() => {
                    const color = currentUser?.uid ? getAvatarColorFromUserId(currentUser.uid) : '#45B7D1';
                    setPhotoFile(null);
                    setPhotoPreview(generateDefaultAvatarDataURL(color));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className={`mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors ${dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  デフォルトアバターに戻す
                </button>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-bold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>ニックネーム</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ニックネームを入力"
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ${inputCls}`}
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || !nickname.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <><RefreshCw size={16} className="animate-spin" />保存中...</> : '保存する'}
              </button>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedChannel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`rounded-3xl p-6 w-full max-w-sm max-h-[80vh] overflow-auto ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${text}`}>{selectedChannel.name} のメンバー</h3>
                <button onClick={() => setShowMembersModal(false)} className="p-1">
                  <X size={20} className={dark ? 'text-slate-400' : 'text-gray-500'} />
                </button>
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.userId} className={`flex items-center gap-3 p-3 rounded-xl ${dark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <img src={member.photoURL || generateDefaultAvatarDataURL('#45B7D1')} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className={`font-bold ${text}`}>{member.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Channel Menu Modal */}
        {showChannelMenu && (
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowChannelMenu(null)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto p-4">
              <div
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const channel = channels.find(c => c.id === showChannelMenu);
                  if (!channel) return null;
                  return (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{channel.name}</p>
                      </div>
                      <button
                        onClick={() => handleOpenEditChannel(channel)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50"
                      >
                        <Pencil size={18} className="text-gray-400" />
                        名前を編集
                      </button>
                      <button
                        onClick={() => {
                          setShowLeaveConfirm(channel);
                          setShowChannelMenu(null);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-medium text-red-600 flex items-center gap-3 ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
                      >
                        <Trash2 size={18} className="text-red-400" />
                        脱退する
                      </button>
                    </>
                  );
                })()}
                <button
                  onClick={() => setShowChannelMenu(null)}
                  className={`w-full px-4 py-3 text-center text-sm font-bold border-t ${dark ? 'text-slate-400 hover:bg-slate-700 border-slate-700' : 'text-gray-500 hover:bg-gray-50 border-gray-100'}`}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Channel Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`rounded-3xl p-6 w-full max-w-sm ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
              </div>
              <h3 className={`text-lg font-bold text-center mb-2 ${text}`}>チャンネルを脱退</h3>
              <p className={`text-sm text-center mb-2 ${subtext}`}>「{showLeaveConfirm.name}」から脱退しますか？</p>
              {showLeaveConfirm.memberIds.length === 1 && (
                <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl text-center mb-2">あなたが最後のメンバーです。脱退するとチャンネ���は削除されます。</p>
              )}
              {channels.length === 1 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl text-center mb-4">これが最後のチャンネルです。脱退後は新しいチャンネルを作成または参加してください。</p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowLeaveConfirm(null)} className={`flex-1 font-bold py-3 rounded-xl transition-colors ${dark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  キャンセル
                </button>
                <button onClick={handleLeaveChannel} disabled={leavingChannel}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {leavingChannel ? <><RefreshCw size={16} className="animate-spin" />処理中...</> : '脱退する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Channel Name Modal */}
        {showEditChannelModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`rounded-3xl p-6 w-full max-w-sm ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${text}`}>チャンネル名を編集</h3>
                <button onClick={() => setShowEditChannelModal(null)} className="p-1">
                  <X size={20} className={dark ? 'text-slate-400' : 'text-gray-500'} />
                </button>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-bold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>チャンネル名</label>
                <input
                  type="text"
                  value={editingChannelName}
                  onChange={(e) => setEditingChannelName(e.target.value)}
                  placeholder="チャンネル名を入力"
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ${inputCls}`}
                />
              </div>

              <button
                onClick={handleSaveChannelName}
                disabled={savingChannelName || !editingChannelName.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingChannelName ? (
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

        {/* Current Channel */}
        {currentChannel && (
          <section className={`rounded-3xl p-5 border shadow-sm ${currentChannel.type === 'solo'
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${channel.type === 'solo' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100'
                        }`}>
                        使用中
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Activity Log - 共有用のみ表示 */}
                    {channel.type === 'shared' && (
                      <button
                        onClick={() => navigate(`/channel/${channel.id}/activity`)}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors text-gray-500 bg-gray-100 hover:bg-gray-200"
                        title="アクティビティログ"
                      >
                        <History size={12} />
                      </button>
                    )}
                    {/* Member count - 共有用のみ表示 */}
                    {channel.type === 'shared' && (
                      <button
                        onClick={() => handleShowMembers(channel)}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors ${channel.memberIds.length >= 2
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
                    {/* Channel Menu */}
                    <button
                      onClick={() => setShowChannelMenu(showChannelMenu === channel.id ? null : channel.id)}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                {/* 共有用チャンネルのみ招待コードを表示 */}
                {channel.type === 'shared' ? (
                  <div className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span>招待コード:</span>
                    <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${dark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      {channel.inviteCode}
                    </code>
                    <button onClick={() => handleCopyCode(channel.inviteCode)} className={dark ? 'text-slate-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'}>
                      {copiedCode === channel.inviteCode ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-purple-500">一人暮らし用チャンネル</div>
                )}
              </div>
            ))}
          </div>

          {/* Channel Actions */}
          <div className="flex gap-3">
            <button onClick={() => navigate('/channel/create')}
              className="flex-1 bg-blue-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} />チャンネルを作成
            </button>
            <button onClick={() => navigate('/channel/join')}
              className={`flex-1 border-2 font-bold text-sm py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${dark ? 'bg-slate-800 text-blue-400 border-blue-500/50 hover:border-blue-400' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}`}>
              <KeyRound size={16} />招待コードで参加
            </button>
          </div>
        </section>

        {/* Settings Menu */}
        <section className="space-y-3">
          <h3 className={`text-sm font-bold px-1 pt-2 ${text}`}>設定・その他</h3>

          <div className={`rounded-3xl overflow-hidden shadow-sm border divide-y ${dark ? 'bg-slate-800 border-slate-700 divide-slate-700' : 'bg-white border-gray-100 divide-gray-50'}`}>
            <button onClick={() => setShowAppSettings(true)} className={`w-full p-4 flex items-center justify-between transition-colors group ${hover}`}>
              <div className={`flex items-center gap-3 text-sm font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <Settings size={16} />
                </div>
                アプリ設定
              </div>
            </button>

            <button onClick={handleLogout} className={`w-full p-4 flex items-center justify-between transition-colors group ${hover}`}>
              <div className="flex items-center gap-3 text-red-500 text-sm font-bold">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut size={16} />
                </div>
                ログアウト
              </div>
            </button>
          </div>
        </section>

        <div className="text-center pt-8 pb-4">
          <p className={`text-[10px] font-bold tracking-wider ${dark ? 'text-slate-600' : 'text-gray-400'}`}>HAKO-VUE PROTOTYPE v1.2</p>
        </div>
      </main>

      {/* App Settings Modal */}
      {showAppSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4 pb-24">
          <div className={`rounded-3xl w-full max-w-sm shadow-2xl ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
              <h3 className={`text-lg font-bold ${text}`}>アプリ設定</h3>
              <button onClick={() => setShowAppSettings(false)} className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {/* Dark Mode */}
              <div className={`flex items-center justify-between p-4 rounded-2xl ${dark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Moon size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${text}`}>ダークモード</p>
                    <p className={`text-xs mt-0.5 ${subtext}`}>画面を暗くして目への負担を軽減</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${settings.darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Notifications */}
              <div className={`flex items-center justify-between p-4 rounded-2xl ${dark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${settings.notificationsEnabled ? 'bg-blue-100' : dark ? 'bg-slate-600' : 'bg-gray-100'}`}>
                    {settings.notificationsEnabled
                      ? <Bell size={18} className="text-blue-600" />
                      : <BellOff size={18} className={dark ? 'text-slate-400' : 'text-gray-400'} />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${text}`}>返却リマインド通知</p>
                    <p className={`text-xs mt-0.5 ${subtext}`}>持ち出し中アイテムの返却を通知</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!settings.notificationsEnabled) {
                      // 通知をONにする場合、まず許可を取得
                      if ('Notification' in window) {
                        if (Notification.permission === 'default') {
                          const permission = await Notification.requestPermission();
                          if (permission !== 'granted') return;
                        } else if (Notification.permission === 'denied') {
                          alert('通知が拒否されています。ブラウザの設定から通知を許可してください。');
                          return;
                        }

                        // 許可された場合（すでにgrantedの場合も含む）、即座にトークンを取得して保存
                        if (currentUser && Notification.permission === 'granted') {
                          await requestAndSaveFCMToken(currentUser);
                        }
                      }
                    } else {
                      // 通知をOFFにする場合、Firestoreから現在のトークンを削除する
                      if (currentUser) {
                        await removeFCMToken(currentUser);
                      }
                    }
                    toggleNotifications();
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Notification Interval */}
              {settings.notificationsEnabled && (
                <div className={`p-4 rounded-2xl ${dark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-bold mb-3 ${text}`}>通知タイミング</p>
                  <p className={`text-xs mb-3 ${subtext}`}>持ち出してから何日後に通知するか</p>
                  <div className="flex flex-wrap gap-2">
                    {([1, 3, 7] as NotificationInterval[]).map((days) => (
                      <button
                        key={days}
                        onClick={async () => {
                          setNotificationInterval(days);
                          if (currentUser) {
                            try {
                              const { db } = await import('../firebase');
                              const { doc, updateDoc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'users', currentUser.uid), {
                                notificationIntervalDays: days
                              });
                            } catch (e) {
                              console.error('Failed to update interval:', e);
                            }
                          }
                        }}
                        className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold transition-all ${settings.notificationIntervalDays === days
                          ? 'bg-blue-600 text-white shadow-md'
                          : dark ? 'bg-slate-600 text-slate-300 border border-slate-500 hover:border-blue-400' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        {days === 1 ? '1日後' : days === 3 ? '3日後' : '1週間後'}
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                        setNotificationInterval(0.000347);
                        if (currentUser) {
                          try {
                            const { db } = await import('../firebase');
                            const { doc, updateDoc } = await import('firebase/firestore');
                            await updateDoc(doc(db, 'users', currentUser.uid), {
                              notificationIntervalDays: 0.000347
                            });
                          } catch (e) {
                            console.error('Failed to update interval:', e);
                          }
                        }
                      }}
                      className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-[11px] font-bold transition-all ${settings.notificationIntervalDays === 0.000347
                        ? 'bg-amber-600 text-white shadow-md'
                        : dark ? 'bg-amber-900/40 text-amber-400 border border-amber-700 hover:bg-amber-900/60' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                        }`}
                      title="デバッグ用: 30秒後"
                    >
                      30秒後<span className={`text-[9px] block ${dark ? 'text-amber-500' : 'text-amber-500'}`}>（デバッグ）</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
