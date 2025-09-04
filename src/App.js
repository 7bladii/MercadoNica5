import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import { db } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Layout and common components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNavBar from './components/layout/BottomNavBar';
import BackButton from './components/common/BackButton';

// Guards
import { ProtectedRoute, PublicOnlyRoute } from './components/common/Guards'; 

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
const CreateBusinessPage = lazy(() => import('./pages/CreateBusinessPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const EditBusinessPage = lazy(() => import('./pages/EditBusinessPage'));
const LeaveReviewPage = lazy(() => import('./pages/LeaveReviewPage'));


// --- Componentes Auxiliares ---

const PageLoader = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const AdminRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader />; 
    if (!user || !user.isAdmin) return <Navigate to="/" replace />;
    return <Outlet />;
};

// --- Layout Principal ---

function AppLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    
    const showBackButton = location.pathname !== '/';

    useEffect(() => {
        let unsubscribe;
        if (user) {
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, where('participants', 'array-contains', user.uid), where(`unreadCount.${user.uid}`, '>', 0));
            unsubscribe = onSnapshot(q, (snapshot) => {
                setHasUnreadMessages(!snapshot.empty);
            }, (error) => {
                console.error("Error al escuchar chats:", error);
            });
        } else {
            setHasUnreadMessages(false);
        }
        return () => unsubscribe && unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen font-sans bg-gray-100">
            <Helmet>
                <title>MercadoNica - Compra, Venta y Empleo en Nicaragua</title>
                <meta name="description" content="Tu plataforma para comprar, vender y encontrar empleo en Nicaragua. Explora artículos recientes y publica tus anuncios gratis." />
            </Helmet>
            
            <Header />
            <main className="container mx-auto pb-24 md:pb-8 p-4">
                {showBackButton && <div className="mb-4"><BackButton /></div>}
                
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* --- Rutas Públicas --- */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/listings/:type" element={<ListingsPage />} />
                        <Route path="/listings" element={<ListingsPage />} />
                        <Route path="/listing/:listingId" element={<ListingDetailPage />} />
                        <Route path="/profile/:userId" element={<PublicProfilePage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/help" element={<HelpCenterPage />} />
                        <Route path="/tienda/:slug" element={<BusinessProfilePage />} />

                        {/* --- Rutas Solo para Invitados --- */}
                        <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/login-phone" element={<PhoneSignInPage />} />
                        </Route>

                        {/* --- Rutas Protegidas para Usuarios --- */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/account" element={<AccountPage />} />
                            <Route path="/crear-tienda" element={<CreateBusinessPage />} />
                            <Route path="/account/business/edit" element={<EditBusinessPage />} />
                            <Route path="/account/settings" element={<AccountSettings />} />
                            <Route path="/account/my-listings" element={<MyListings />} />
                            <Route path="/account/favorites" element={<FavoritesPage />} />
                            <Route path="/account/notifications" element={<NotificationPreferences />} />
                            <Route path="/messages" element={<ChatPage />} />
                            <Route path="/messages/:chatId" element={<ChatPage />} />
                            <Route path="/publish" element={<PublishPage />} />
                            <Route path="/edit-listing/:listingId" element={<PublishPage />} />
                            <Route path="/profile/:userId/review" element={<LeaveReviewPage />} />
                            
                            <Route element={<AdminRoute />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                            </Route>
                        </Route>
                        
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </main>
            <BottomNavBar hasUnreadMessages={hasUnreadMessages} />
            <Footer />
        </div>
    );
}

// --- Componente Raíz de la Aplicación ---

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                <AuthProvider>
                    <ScrollToTop />
                    <AppLayout />
                </AuthProvider>
            </Router>
        </HelmetProvider>
    );
}

