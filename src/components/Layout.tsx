import { Outlet, NavLink } from 'react-router-dom';
import { Home, Camera, Search, User, MapPin } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md mx-auto inset-x-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 flex justify-around items-center h-16 px-2 z-50 rounded-t-2xl">
        <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={22} className="mb-1" strokeWidth={2.5} />
          <span>ホーム</span>
        </NavLink>
        
        <NavLink to="/search" className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search size={22} className="mb-1" strokeWidth={2.5} />
          <span>さがす</span>
        </NavLink>

        <NavLink to="/camera" className="relative flex flex-col items-center justify-center w-full h-full group">
          <div className="absolute -top-7 bg-gradient-to-tr from-primary-500 to-blue-400 text-white rounded-full p-4 shadow-xl flex items-center justify-center border-4 border-gray-50 group-hover:scale-105 transition-transform duration-200 group-hover:shadow-blue-500/30">
            <Camera size={26} strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink to="/locations" className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 pt-[2px] ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
          <MapPin size={22} className="mb-1" strokeWidth={2.5} />
          <span>場所</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={22} className="mb-1" strokeWidth={2.5} />
          <span>マイページ</span>
        </NavLink>
      </nav>
    </div>
  );
}
