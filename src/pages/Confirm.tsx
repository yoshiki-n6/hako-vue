import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Edit2, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ConfirmScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemPhotoUrl, suggestedNames, initialName } = location.state || { 
    itemPhotoUrl: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80', // default fallback 
    suggestedNames: ['アイテム名1', 'アイテム名2'], 
    initialName: 'アイテム名' 
  };

  const [itemName, setItemName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative pb-28">
      <header className="fixed top-0 inset-x-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2 text-gray-900">アイテムの確認</h1>
      </header>

      <main className="flex-1 pt-20 px-4">
        {/* Photo Preview */}
        <div className="w-full aspect-square bg-gray-200 rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-2 relative">
          <img 
            src={itemPhotoUrl} 
            alt="Captured item" 
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop';
            }}
          />
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 shadow-sm flex items-center gap-1.5 border border-blue-100">
            <Check size={14} strokeWidth={3} /> AI認識完了
          </div>
        </div>

        {/* Name Input/Confirm */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">アイテム名</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-full transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <Edit2 size={16} />
            </button>
          </div>
          
          {isEditing ? (
            <input 
              type="text" 
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full text-2xl font-black border-b-2 border-primary-500 focus:outline-none py-1 bg-transparent text-gray-900"
              autoFocus
              onBlur={() => setIsEditing(false)}
            />
          ) : (
            <div className="text-2xl font-black text-gray-900">{itemName}</div>
          )}

          {/* Suggestions */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
              <RefreshCw size={12} /> AIの別候補
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              {suggestedNames.map((name: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setItemName(name)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    itemName === name 
                      ? 'bg-blue-50 border-2 border-primary-500 text-primary-600' 
                      : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100/50">
          <p className="text-sm border-l-2 border-blue-400 pl-3 leading-relaxed text-blue-900 font-medium">
            このアイテムが正しければ、次に <strong className="font-extrabold text-blue-700">「どこにしまうか」</strong> 記録しましょう。
          </p>
        </div>
      </main>

      {/* Action Button */}
      <div className="fixed bottom-0 inset-x-0 w-full max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-10 pb-8">
        <button 
          onClick={() => navigate('/location-select', { state: { itemPhotoUrl, itemName } })}
          className="w-full bg-primary-500 text-white font-bold text-lg py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] hover:bg-blue-600 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          場所を記録する
        </button>
      </div>
    </div>
  );
}
