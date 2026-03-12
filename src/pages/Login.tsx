import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      console.log("[v0] Login button clicked");
      await loginWithGoogle();
      console.log("[v0] Login completed, navigating to home");
      navigate('/');
    } catch (error: any) {
      console.error("[v0] Failed to log in:", error);
      console.error("[v0] Error code:", error.code);
      console.error("[v0] Error message:", error.message);
      alert(`ログインに失敗しました: ${error.code || error.message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/4 -translate-x-1/4"></div>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-8 mt-10">
          <Box size={48} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Hako-Vue</h1>
        <p className="text-gray-500 font-medium text-center mb-12">
          撮影するだけでAIが自動登録。<br/>
          直感的な収納・所在管理アプリ。
        </p>

        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={handleLogin}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Googleでログイン / 新規登録
          </button>
        </div>
      </main>
      
      <footer className="p-6 text-center text-xs font-bold text-gray-400">
        By continuing, you agree to our Terms of Service.
      </footer>
    </div>
  );
}
