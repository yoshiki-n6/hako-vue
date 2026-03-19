import { Outlet, NavLink } from 'react-router-dom';
import { Home, Camera, Search, User, MapPin } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';

export default function Layout() {
  const { settings } = useAppSettings();
  const dark = settings.darkMode;

  return (
    <div className={`flex flex-col min-h-screen pb-16 font-sans ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 w-full max-w-md mx-auto inset-x-0 shadow-[0_-4px_10px_rgba(0,0,0,0.08)] border-t flex justify-around items-center h-16 px-2 z-50 rounded-t-2xl ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-blue-500' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={22} className="mb-1" strokeWidth={2.5} />
          <span>ホーム</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-blue-500' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search size={22} className="mb-1" strokeWidth={2.5} />
          <span>さがす</span>
        </NavLink>

        <NavLink to="/camera" className="relative flex flex-col items-center justify-center w-full h-full group">
          <div className={`absolute -top-7 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full p-4 shadow-xl flex items-center justify-center border-4 group-hover:scale-105 transition-transform duration-200 ${dark ? 'border-slate-900' : 'border-gray-50'}`}>
            <Camera size={26} strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink to="/locations" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 pt-[2px] ${isActive ? 'text-blue-500' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <MapPin size={22} className="mb-1" strokeWidth={2.5} />
          <span>場所</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-blue-500' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={22} className="mb-1" strokeWidth={2.5} />
          <span>マイページ</span>
        </NavLink>
      </nav>
    </div>
  );
}
