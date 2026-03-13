import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireChannel = true }: { children: React.ReactNode, requireChannel?: boolean }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const location = useLocation();

  if (authLoading || (currentUser && requireChannel && userLoading)) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If the route requires a channel, but the user doesn't have one, redirect to creation.
  if (requireChannel && userProfile && !userProfile.currentChannelId) {
    if (location.pathname !== '/channel-create') {
      return <Navigate to="/channel-create" replace />;
    }
  }

  // If the user has a channel but is trying to access channel-create, optionally redirect them to home?
  // (Assuming we want to prevent them from creating multiple channels via this screen for now)
  if (!requireChannel && userProfile?.currentChannelId && location.pathname === '/channel-create') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
