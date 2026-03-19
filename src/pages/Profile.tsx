import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Code, ChevronRight, User as UserIcon, Plus, KeyRound, Star, Copy, Check, RefreshCw, Edit2, Users, X, Home, History, MoreVertical, Trash2, Pencil, AlertTriangle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChannel } from '../contexts/ChannelContext';
import type { Channel, ChannelMember } from '../contexts/ChannelContext';

// Pre-defined avatar icons using DiceBear API - 削除（写真アップロードのみにする）

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { channels, currentChannel, userProfile, switchChannel, setDefaultChannel, updateProfile, getChannelMembers, leaveChannel, updateChannelName } = useChannel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
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
      setNickname(userProfile.nickname || currentUser?.displayName || '');
      setPhotoURL(userProfile.photoURL || currentUser?.photoURL || '');
      setPhotoPreview(userProfile.photoURL || currentUser?.photoURL || '');
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
      // photoFileがある場合、それをアップロード、なければ既存のPhotoURLを使用
      const finalPhotoURL = photoFile ? photoPreview : photoURL;
      await updateProfile(nickname, finalPhotoURL);
      setPhotoFile(null);
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
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(nickname)
                  )}
                </div>
              </div>
              
              {/* Photo Upload Section */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-3">アイコン画像</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-blue-600 font-semibold"
                >
                  <Upload size={18} />
                  画像を選択
                </button>
                <p className="text-xs text-gray-500 mt-2">JPG、PNG など最大5MBまで</p>
                {photoFile && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✓ {photoFile.name} を選択
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview('');
                  }}
                  className={`mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                    photoPreview
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!photoPreview}
                >
                  画像をリセット
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
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <Trash2 size={18} className="text-red-400" />
                        脱退する
                      </button>
                    </>
                  );
                })()}
                <button
                  onClick={() => setShowChannelMenu(null)}
                  className="w-full px-4 py-3 text-center text-sm font-bold text-gray-500 hover:bg-gray-50 border-t border-gray-100"
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
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">チャンネルを脱退</h3>
              <p className="text-sm text-gray-500 text-center mb-2">
                「{showLeaveConfirm.name}」から脱退しますか？
              </p>
              {showLeaveConfirm.memberIds.length === 1 && (
                <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl text-center mb-2">
                  あなたが最後のメンバーです。脱退するとチャンネルは削除されます。
                </p>
              )}
              {channels.length === 1 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl text-center mb-4">
                  これが最後のチャンネルです。脱退後は新しいチャンネルを作成または参加してください。
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLeaveConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleLeaveChannel}
                  disabled={leavingChannel}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {leavingChannel ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      処理中...
                    </>
                  ) : (
                    '脱退する'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Channel Name Modal */}
        {showEditChannelModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">チャンネル名を編集</h3>
                <button onClick={() => setShowEditChannelModal(null)} className="p-1">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">チャンネル名</label>
                <input
                  type="text"
                  value={editingChannelName}
                  onChange={(e) => setEditingChannelName(e.target.value)}
                  placeholder="チャンネル名を入力"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
