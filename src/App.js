import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';

// Layout and common components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNavBar from './components/layout/BottomNavBar';
import BackButton from './components/common/BackButton';

// Componentes de rutas protegidas (Guards)
import { ProtectedRoute, PublicOnlyRoute } from './components/common/Guards'; // Asegúrate que la ruta sea correcta

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
const TermsPage = lazy(() => import('./pages/TermsPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));


const PageLoader = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-700">Cargando...</div>
    </div>
);

function AppLayout() {
    const location = useLocation();
    const showBackButton = location.pathname !== '/';
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    
    return (
        <div className="min-h-screen font-sans bg-gray-100">
            <Header />
            <main className="container mx-auto pb-24 md:pb-8 p-4">
                {showBackButton && (
                    <div className="mb-4">
                        <BackButton />
                    </div>
                )}
                
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* --- Rutas Públicas (visibles para todos) --- */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/listings/:type" element={<ListingsPage />} />
                        <Route path="/listings" element={<ListingsPage />} />
                        <Route path="/listing/:listingId" element={<ListingDetailPage />} />
                        <Route path="/profile/:userId" element={<PublicProfilePage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/help" element={<HelpCenterPage />} />
                        <Route path="/publish" element={<PublishPage />} />

                        {/* --- Rutas Solo Públicas (para usuarios NO autenticados) --- */}
                        <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/login-phone" element={<PhoneSignInPage />} />
                        </Route>

                        {/* --- Rutas Protegidas (requieren autenticación) --- */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/account" element={<AccountPage />} />
                            <Route path="/account/settings" element={<AccountSettings />} />
                            <Route path="/account/my-listings" element={<MyListings />} />
                            <Route path="/account/favorites" element={<FavoritesPage />} />
                            <Route path="/account/notifications" element={<NotificationPreferences />} />
                            <Route path="/messages" element={<ChatPage />} />
                            <Route path="/messages/:chatId" element={<ChatPage />} />
                            <Route path="/edit-listing/:listingId" element={<PublishPage />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Route>
                        
                        {/* --- Ruta para contenido no encontrado --- */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </main>
            <BottomNavBar hasUnreadMessages={hasUnreadMessages} />
            <Footer />
        </div>
    );
}

// El componente principal que envuelve todo con el Router y el AuthProvider.
// Esta estructura es correcta y no necesita cambios.
export default function App() {
    return (
        <Router>
            <AuthProvider>
                <AppLayout />
            </AuthProvider>
        </Router>
    );
}