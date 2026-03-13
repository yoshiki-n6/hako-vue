import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { UserProvider } from './contexts/UserContext';
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
import ChannelCreateScreen from './pages/ChannelCreate';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/channel-create" element={<ProtectedRoute requireChannel={false}><ChannelCreateScreen /></ProtectedRoute>} />

              <Route path="/camera" element={<ProtectedRoute><CameraScreen /></ProtectedRoute>} />
              <Route path="/confirm" element={<ProtectedRoute><ConfirmScreen /></ProtectedRoute>} />
              <Route path="/location-select" element={<ProtectedRoute><LocationSelectScreen /></ProtectedRoute>} />
              <Route path="/location-new" element={<ProtectedRoute><LocationNewScreen /></ProtectedRoute>} />
              <Route path="/items/:id" element={<ProtectedRoute><ItemDetailScreen /></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute><QRScannerScreen /></ProtectedRoute>} />

              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="search" element={<SearchScreen />} />
                <Route path="locations" element={<LocationsScreen />} />
                <Route path="locations/:id" element={<LocationDetailScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
