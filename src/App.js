import React, { useState, useEffect, lazy, Suspense } from 'react';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getToken } from "firebase/messaging";

// --- RUTAS DE IMPORTACIÓN CORREGIDAS ---
import { auth, db, googleProvider, facebookProvider, messaging } from './firebase/config';
import PleaseLogIn from './components/common/PleaseLogIn';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNavBar from './components/layout/BottomNavBar';
import BackButton from './components/common/BackButton';

// --- Carga Perezosa (Lazy Loading) de todas las páginas ---
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
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));

// Componente que se muestra mientras carga una página
const PageLoader = () => (
    <div className="flex items-center justify-center p-10">
        <div className="text-xl font-semibold text-gray-700">Cargando...</div>
    </div>
);

// --- Componente Principal de la Aplicación ---
export default function App() {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([{ page: 'home' }]);
    const [activeChat, setActiveChat] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [unreadChats, setUnreadChats] = useState({});
    const currentView = history[history.length - 1];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                } else {
                    const newUserProfile = {
                        displayName: currentUser.displayName || "Usuario Anónimo",
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        createdAt: serverTimestamp(),
                        location: "Ubicación no especificada",
                        followersCount: 0,
                        followingCount: 0,
                        rating: 0,
                        ratingCount: 0,
                        boughtCount: 0,
                        soldCount: 0,
                        isVerified: false,
                        isPremium: false,
                        notifications: { newMessages: true, newJobs: true }
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser({ uid: currentUser.uid, ...newUserProfile });
                }

                try {
                    const currentToken = await getToken(messaging, { vapidKey: "BEmZeqVU-Ew145_Qg7BTHXm-Tj1e2lLgs2nRFLPICC_R8ul_PfXjVrIIfn9VHnUf4ycOYblQQMQLKEA55Kn4aX0" });
                    if (currentToken) {
                        await updateDoc(doc(db, "users", currentUser.uid), { fcmToken: currentToken });
                    }
                } catch (err) {
                    console.log("Ocurrió un error al obtener el token de notificación.", err);
                }

            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const setView = (newView) => setHistory(prev => [...prev, newView]);
    const goBack = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };
    const goHome = () => setHistory([{ page: 'home' }]);

    const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error("Error al iniciar sesión con Google:", error); } };
    const handleFacebookLogin = async () => { try { await signInWithPopup(auth, facebookProvider); } catch (error) { console.error("Error al iniciar sesión con Facebook:", error); if (error.code === 'auth/account-exists-with-different-credential') { alert('Ya tienes una cuenta con este correo electrónico usando otro método.'); } } };
    const handleLogout = () => { auth.signOut(); goHome(); };

    // --- FUNCIÓN CORREGIDA: Ahora espera un objeto y construye el chatId ---
    const navigateToMessages = async (messageData) => { // Cambiado para recibir un objeto
        if (!user) {
            alert("Necesitas iniciar sesión para enviar mensajes."); // Mensaje más claro
            return;
        }
        if (!messageData || !messageData.recipientId) {
            console.error("navigateToMessages: Datos de destinatario incompletos.", messageData);
            alert("No se pudo iniciar el chat: información del destinatario faltante.");
            return;
        }

        const currentUserId = user.uid;
        const recipientId = String(messageData.recipientId); // Asegura que sea una cadena
        
        // Construye un chatId consistente ordenando los UIDs
        const sortedIds = [currentUserId, recipientId].sort();
        const chatId = sortedIds.join('_');

        const chatRef = doc(db, "chats", chatId);
        
        try {
            const docSnap = await getDoc(chatRef);

            if (docSnap.exists()) {
                // Si el chat ya existe, lo activamos
                const chatData = docSnap.data();
                const recipientInfo = chatData.participantInfo?.[recipientId] || {
                    displayName: messageData.recipientName,
                    photoURL: messageData.recipientPhotoURL
                };
                setActiveChat({ id: docSnap.id, ...chatData, recipientInfo });
                setView({ page: 'messages' });
            } else {
                // Si el chat no existe, lo creamos
                const newChatData = {
                    participants: sortedIds,
                    participantInfo: {
                        [currentUserId]: {
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                        },
                        [recipientId]: {
                            displayName: messageData.recipientName,
                            photoURL: messageData.recipientPhotoURL,
                        }
                    },
                    lastMessage: null, // Inicialmente sin mensajes
                    createdAt: serverTimestamp(),
                    listingInfo: messageData.listingId ? {
                        id: messageData.listingId,
                        title: messageData.listingTitle,
                        photoURL: messageData.listingPhotoURL
                    } : null
                };
                await setDoc(chatRef, newChatData);
                setActiveChat({ id: chatId, ...newChatData });
                setView({ page: 'messages' });
            }
        } catch (error) {
            console.error("Error al navegar o crear chat:", error);
            alert("Ocurrió un problema al cargar o iniciar el chat.");
        }
    };

    const renderContent = () => {
        const { page } = currentView;
        const protectedPages = ['account', 'accountSettings', 'myListings', 'favorites', 'messages', 'publish', 'adminDashboard', 'notificationPreferences'];

        if (protectedPages.includes(page) && !user) {
            return <PleaseLogIn onLogin={handleLogin} onFacebookLogin={handleFacebookLogin} />;
        }

        switch (page) {
            case 'listings': return <ListingsPage type={currentView.type} setView={setView} user={user} />;
            case 'listingDetail': return <ListingDetailPage listingId={currentView.listingId} currentUser={user} navigateToMessages={navigateToMessages} setView={setView} />;
            case 'publish': return <PublishPage type={currentView.type} setView={setView} user={user} listingId={currentView.listingId} />;
            case 'messages': return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} setUnreadChats={setUnreadChats} />;
            case 'account': return <AccountPage user={user} setView={setView} handleLogout={handleLogout} />;
            case 'accountSettings': return <AccountSettings user={user} setUser={setUser} />;
            case 'myListings': return <MyListings user={user} setView={setView} />;
            case 'favorites': return <FavoritesPage user={user} setView={setView} />;
            case 'adminDashboard': return <AdminDashboard />;
            case 'notificationPreferences': return <NotificationPreferences user={user} setUser={setUser} />;
            case 'publicProfile': return <PublicProfilePage userId={currentView.userId} setView={setView} user={user} navigateToMessages={navigateToMessages} />;
            case 'companyProfile': return <CompanyProfilePage userId={currentView.userId} setView={setView} user={user} />;
            default: return <HomePage setView={setView} />;
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Cargando aplicación...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-gray-100">
            <Header user={user} onLogin={handleLogin} onFacebookLogin={handleFacebookLogin} onLogout={handleLogout} setView={setView} goHome={goHome} notificationCount={Object.values(unreadChats).filter(Boolean).length} />
            <main className="container mx-auto pb-24 md:pb-8">
                {history.length > 1 && currentView.page !== 'account' && (
                    <div className="px-4 md:px-0">
                        <BackButton onClick={goBack} />
                    </div>
                )}
                <div className={currentView.page !== 'account' ? 'p-4 md:p-0' : ''}>
                    <Suspense fallback={<PageLoader />}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
            <BottomNavBar setView={setView} currentView={currentView} goHome={goHome} hasUnreadMessages={Object.values(unreadChats).filter(Boolean).length > 0} />
            <Footer />
        </div>
    );
}
