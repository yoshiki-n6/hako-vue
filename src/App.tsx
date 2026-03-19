import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChannelProvider, useChannel } from './contexts/ChannelContext';
import { DataProvider } from './contexts/DataContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { useReturnReminder } from './hooks/useReturnReminder';
import { ReturnNotificationContainer } from './components/ReturnNotification';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import CameraScreen from './pages/Camera';
import ConfirmScreen from './pages/Confirm';
import LocationSelectScreen from './pages/LocationSelect';
import LocationNewScreen from './pages/LocationNew';
import SearchScreen from './pages/Search';
import LocationsScreen from './pages/Locations';
import LocationDetailScreen from './pages/LocationDetail';
import ItemDetailScreen from './pages/ItemDetail';
import ProfileScreen from './pages/Profile';
import LoginScreen from './pages/Login';
import QRScannerScreen from './pages/QRScanner';
import QRLocationSelectScreen from './pages/QRLocationSelect';
import OnboardingScreen from './pages/Onboarding';
import ChannelCreateScreen from './pages/ChannelCreate';
import ChannelJoinScreen from './pages/ChannelJoin';
import ChannelActivityScreen from './pages/ChannelActivity';

// Wrapper component to check onboarding status
function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, loading } = useChannel();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Activates return reminder notifications globally
function NotificationRunner() {
  useReturnReminder();
  return null;
}

// Wrapper to prevent onboarding access if already completed
function OnboardingRoute() {
  const { needsOnboarding, loading } = useChannel();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!needsOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <OnboardingScreen />;
}

function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <ChannelProvider>
          <DataProvider>
            <NotificationRunner />
            <ReturnNotificationContainer />
            <PWAInstallBanner />
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingRoute /></ProtectedRoute>} />
              
              <Route path="/camera" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <CameraScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/confirm" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <ConfirmScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/location-select" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <LocationSelectScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/location-new" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <LocationNewScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/items/:id" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <ItemDetailScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/scan" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <QRScannerScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/qr-location-select" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <QRLocationSelectScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              
              {/* Channel Management Routes */}
              <Route path="/channel/create" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <ChannelCreateScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/channel/join" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <ChannelJoinScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              <Route path="/channel/:id/activity" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <ChannelActivityScreen />
                  </OnboardingCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <OnboardingCheck>
                    <Layout />
                  </OnboardingCheck>
                </ProtectedRoute>
              }>
                <Route index element={<Home />} />
                <Route path="search" element={<SearchScreen />} />
                <Route path="locations" element={<LocationsScreen />} />
                <Route path="locations/:id" element={<LocationDetailScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
              </Route>
            </Routes>
          </BrowserRouter>
          </DataProvider>
        </ChannelProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

export default App;
