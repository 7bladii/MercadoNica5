import React, { lazy, Suspense } from 'react';
// ✅ Se importa 'useLocation' para saber en qué página estamos
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout and common components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNavBar from './components/layout/BottomNavBar';
import ProtectedRoute from './components/common/ProtectedRoute';
// ✅ Se importa el nuevo componente BackButton
import BackButton from './components/common/BackButton';


// Lazy Loading of pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const PublishPage = lazy(() => import('./pages/PublishPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const MyListings = lazy(() => import('./pages/MyListings'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotificationPreferences = lazy(() => import('./pages/NotificationPreferences'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const PhoneSignInPage = lazy(() => import('./pages/PhoneSignInPage'));

const PageLoader = () => (
    <div className="flex items-center justify-center p-10">
        <div className="text-xl font-semibold text-gray-700">Cargando...</div>
    </div>
);

function AppLayout() {
    // ✅ Se obtiene la ubicación actual para saber si mostrar el botón
    const location = useLocation();
    
    return (
        <div className="min-h-screen font-sans bg-gray-100">
            <Header />
            <main className="container mx-auto pb-24 md:pb-8 p-4">
                {/* ✅ El botón de regresar se muestra si NO estamos en la página de inicio ('/') */}
                {location.pathname !== '/' && <BackButton />}
                
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/listings/:type" element={<ListingsPage />} />
                        <Route path="/listings" element={<ListingsPage />} />
                        <Route path="/listing/:listingId" element={<ListingDetailPage />} />
                        <Route path="/profile/:userId" element={<PublicProfilePage />} />
                        <Route path="/login-phone" element={<PhoneSignInPage />} />

                        {/* Protected Routes */}
                        <Route path="/publish" element={<ProtectedRoute><PublishPage /></ProtectedRoute>} />
                        <Route path="/edit-listing/:listingId" element={<ProtectedRoute><PublishPage /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                        <Route path="/messages/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                        <Route path="/account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                        <Route path="/account/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
                        <Route path="/account/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                        <Route path="/account/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                        
                        {/* Admin Route */}
                        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        
                        {/* Catch-all route */}
                        <Route path="*" element={<HomePage />} />
                    </Routes>
                </Suspense>
            </main>
            <BottomNavBar />
            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppLayout />
            </Router>
        </AuthProvider>
    );
}