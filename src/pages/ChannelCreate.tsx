import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Package, Users, Home as HomeIcon } from 'lucide-react';

export default function ChannelCreateScreen() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState<'single' | 'shared'>('single');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { createChannel } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('チャンネル名を入力してください');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await createChannel(name, description, mode);
            navigate('/'); // 成功したらホームへ
        } catch (err: any) {
            console.error("Error creating channel:", err);
            setError('チャンネルの作成に失敗しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full mx-auto space-y-8">
                <div>
                    <div className="flex justify-center text-blue-500 mb-4">
                        <Package size={48} />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        最初のチャンネルを作成
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        あなたのアイテムを管理するスペースを作成しましょう
                    </p>
                </div>

                <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                チャンネル名
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border"
                                placeholder="例: 自分の部屋"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                説明 (任意)
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border"
                                placeholder="一人暮らし用の管理スペースです"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                モード選択
                            </label>
                            <div className="grid grid-cols-1 gap-4">
                                {/* 一人暮らし用 */}
                                <div
                                    className={`relative flex items-start p-4 cursor-pointer rounded-lg border-2 ${mode === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                    onClick={() => setMode('single')}
                                >
                                    <div className="flex items-center h-5">
                                        <input
                                            type="radio"
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                            checked={mode === 'single'}
                                            onChange={() => setMode('single')}
                                        />
                                    </div>
                                    <div className="ml-3 flex flex-col">
                                        <span className="block text-sm font-medium text-gray-900 flex items-center gap-2">
                                            <HomeIcon size={16} className="text-blue-500" /> 一人暮らし用
                                        </span>
                                        <span className="block text-sm text-gray-500 mt-1">
                                            自分だけのアイテムを管理するパーソナルスペースです。今まで通りの機能が利用できます。
                                        </span>
                                    </div>
                                </div>

                                {/* 共有用 (Disabled) */}
                                <div
                                    className="relative flex items-start p-4 rounded-lg border-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                >
                                    <div className="flex items-center h-5">
                                        <input
                                            type="radio"
                                            disabled
                                            className="h-4 w-4 text-gray-300 border-gray-300"
                                            checked={mode === 'shared'}
                                            readOnly
                                        />
                                    </div>
                                    <div className="ml-3 flex flex-col">
                                        <span className="block text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Users size={16} /> 共有用 <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-2">近日公開</span>
                                        </span>
                                        <span className="block text-sm text-gray-400 mt-1">
                                            研究室や家族など、複数人でアイテムを管理・共有するためのスペースです。
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '作成中...' : 'チャンネルを作成して始める'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
