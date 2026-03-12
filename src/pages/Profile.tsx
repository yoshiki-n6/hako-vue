import { Settings, LogOut, Code, ChevronRight, User as UserIcon, Users } from 'lucide-react';

export default function ProfileScreen() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white/95 backdrop-blur-md px-4 py-6 sticky top-0 z-10 border-b border-gray-100 mb-4">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">マイページ</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* User Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
             U
           </div>
           <div>
             <h2 className="text-xl font-extrabold text-gray-900 mb-1">User Name</h2>
             <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
               <UserIcon size={14} /> user@example.com
             </p>
           </div>
        </section>

        {/* Group / Shared Mode Box */}
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
           <div className="absolute -right-6 -bottom-6 text-blue-200/40">
             <Users size={120} />
           </div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
               <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                 <Users size={16} /> グループ共有 (Phase 2)
               </h3>
               <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full shadow-sm">Pro機能</span>
             </div>
             <p className="text-xs text-blue-700/80 mb-4 pr-10 font-medium leading-relaxed">
               家族や研究室のメンバーと収納場所を共有し、履歴を管理できます。
             </p>
             <button className="bg-white text-blue-600 font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-shadow active:scale-95">
               グループを作成する
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

             <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
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
          <p className="text-[10px] font-bold text-gray-400 tracking-wider">HAKO-VUE PROTOTYPE v1.0</p>
        </div>
      </main>
    </div>
  );
}
