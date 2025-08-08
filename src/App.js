import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

import { auth, db, googleProvider, facebookProvider, messaging } from './firebase/config';

import PleaseLogIn from './components/common/PleaseLogIn';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNavBar from './components/layout/BottomNavBar';
import BackButton from './components/common/BackButton';

// Usa tu servicio existente con alias
import { createOrGetChat as ensureChatExists } from './services/chatService';

// --- Lazy Pages ---
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

const PageLoader = () => (
  <div className="flex items-center justify-center p-10">
    <div className="text-xl font-semibold text-gray-700">Cargando...</div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([{ page: 'home' }]);
  const [activeChat, setActiveChat] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unreadChats, setUnreadChats] = useState({});
  const currentView = history[history.length - 1];

  // ----- Auth + perfil -----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          setUser({ uid: currentUser.uid, ...snap.data() });
        } else {
          const newUserProfile = {
            displayName: currentUser.displayName || 'Usuario Anónimo',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
            location: 'Ubicación no especificada',
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
          const currentToken = await getToken(messaging, {
            vapidKey: 'BEmZeqVU-Ew145_Qg7BTHXm-Tj1e2lLgs2nRFLPICC_R8ul_PfXjVrIIfn9VHnUf4ycOYblQQMQLKEA55Kn4aX0'
          });
          if (currentToken) {
            await updateDoc(doc(db, 'users', currentUser.uid), { fcmToken: currentToken });
          }
        } catch (err) {
          console.log('Notificaciones bloqueadas o error al obtener token.', err?.message || err);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ----- Navegación simple -----
  const setView = (newView) => setHistory((prev) => [...prev, newView]);
  const goBack = () => { if (history.length > 1) setHistory((prev) => prev.slice(0, -1)); };
  const goHome = () => setHistory([{ page: 'home' }]);

  // ----- Login/Logout -----
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { console.error('Error al iniciar sesión con Google:', error); }
  };
  const handleFacebookLogin = async () => {
    try { await signInWithPopup(auth, facebookProvider); }
    catch (error) {
      console.error('Error al iniciar sesión con Facebook:', error);
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert('Ya tienes una cuenta con este correo electrónico usando otro método.');
      }
    }
  };
  const handleLogout = () => { auth.signOut(); goHome(); };

  // ----- Abrir chat (fail-safe) -----
  const handleNavigateToMessages = useCallback(async (messageData) => {
    if (!user?.uid) {
      alert('Necesitas iniciar sesión para enviar mensajes.');
      setView({ page: 'account' });
      return;
    }
    if (!messageData?.recipientId) {
      alert('No se pudo iniciar el chat: información del destinatario faltante.');
      return;
    }
    if (messageData.recipientId === user.uid) {
      alert('Este anuncio es tuyo.');
      return;
    }

    // Fallback de chatId determinístico (por si el create/update falla)
    const base = [user.uid, messageData.recipientId].sort().join('_');
    const fallbackChatId = `${base}_${messageData.listingId || 'general'}`;

    try {
      // 1) Crear/obtener chat
      const result = await ensureChatExists({
        db,
        currentUser: user,
        recipientId: messageData.recipientId,
        recipientName: messageData.recipientName,
        recipientPhotoURL: messageData.recipientPhotoURL,
        listingId: messageData.listingId,
        listingTitle: messageData.listingTitle,
        listingPrice: messageData.listingPrice ?? null,
        listingThumb: messageData.listingPhotoURL ?? null
      });

      const chatId = typeof result === 'string' ? result : result.chatId;
      const chatRef = doc(db, 'chats', chatId);

      // 2) Actualizar metadatos (si falla, continuamos)
      try {
        const updatePayload = { lastUpdated: serverTimestamp() };
        if (messageData.recipientName) {
          updatePayload[`participantInfo.${messageData.recipientId}.displayName`] = messageData.recipientName;
        }
        if (messageData.recipientPhotoURL) {
          updatePayload[`participantInfo.${messageData.recipientId}.photoURL`] = messageData.recipientPhotoURL;
        }
        if (messageData.listingId) {
          updatePayload.listingInfo = {
            listingId: messageData.listingId,
            title: messageData.listingTitle || '',
            price: messageData.listingPrice ?? null,
            thumb: messageData.listingPhotoURL ?? null,
            sellerId: messageData.recipientId
          };
        }
        await updateDoc(chatRef, updatePayload);
      } catch (innerErr) {
        console.warn('[chat] updateDoc falló (continuo de todos modos):', innerErr?.code || innerErr);
      }

      // 3) Intentar leer chat (si no, uso datos locales)
      let chatData = {};
      try {
        const snap = await getDoc(chatRef);
        if (snap.exists()) chatData = snap.data();
      } catch {}

      const recipientInfo =
        chatData.participantInfo?.[String(messageData.recipientId)] || {
          displayName: messageData.recipientName || 'Usuario',
          photoURL: messageData.recipientPhotoURL || `https://i.pravatar.cc/150?u=${messageData.recipientId}`
        };

      setActiveChat({ id: chatId, ...chatData, recipientInfo });
      setView({ page: 'messages' });

    } catch (error) {
      console.error('Error al iniciar/cargar chat. Navego igual:', error?.code || error);

      // Fallback: navega a Mensajes para no romper UX
      setActiveChat(null); // abre lista de conversaciones
      setView({ page: 'messages' });

      // Si prefieres abrir un chat provisional, descomenta:
      // setActiveChat({
      //   id: fallbackChatId,
      //   participants: [user.uid, messageData.recipientId],
      //   recipientInfo: {
      //     displayName: messageData.recipientName || 'Usuario',
      //     photoURL: messageData.recipientPhotoURL || `https://i.pravatar.cc/150?u=${messageData.recipientId}`
      //   }
      // });
      // setView({ page: 'messages' });
    }
  }, [user, setView, setActiveChat]);

  // ----- Router por estado -----
  const renderContent = () => {
    const { page } = currentView;
    const protectedPages = [
      'account', 'accountSettings', 'myListings', 'favorites',
      'messages', 'publish', 'adminDashboard', 'notificationPreferences'
    ];

    if (protectedPages.includes(page) && !user) {
      return <PleaseLogIn onLogin={handleLogin} onFacebookLogin={handleFacebookLogin} />;
    }

    switch (page) {
      case 'listings':
        return <ListingsPage type={currentView.type} setView={setView} user={user} />;
      case 'listingDetail':
        return (
          <ListingDetailPage
            listingId={currentView.listingId}
            currentUser={user}
            navigateToMessages={handleNavigateToMessages}
            setView={setView}
          />
        );
      case 'publish':
        return <PublishPage type={currentView.type} setView={setView} user={user} listingId={currentView.listingId} />;
      case 'messages':
        return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} setUnreadChats={setUnreadChats} />;
      case 'account':
        return <AccountPage user={user} setView={setView} handleLogout={handleLogout} />;
      case 'accountSettings':
        return <AccountSettings user={user} setUser={setUser} />;
      case 'myListings':
        return <MyListings user={user} setView={setView} />;
      case 'favorites':
        return <FavoritesPage user={user} setView={setView} />;
      case 'adminDashboard':
        return <AdminDashboard />;
      case 'notificationPreferences':
        return <NotificationPreferences user={user} setUser={setUser} />;
      case 'publicProfile':
        return <PublicProfilePage userId={currentView.userId} setView={setView} user={user} navigateToMessages={handleNavigateToMessages} />;
      case 'companyProfile':
        return <CompanyProfilePage userId={currentView.userId} setView={setView} user={user} />;
      default:
        return <HomePage setView={setView} />;
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
      <Header
        user={user}
        onLogin={handleLogin}
        onFacebookLogin={handleFacebookLogin}
        onLogout={handleLogout}
        setView={setView}
        goHome={goHome}
        notificationCount={Object.values(unreadChats).filter(Boolean).length}
      />

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

      <BottomNavBar
        setView={setView}
        currentView={currentView}
        goHome={goHome}
        hasUnreadMessages={Object.values(unreadChats).filter(Boolean).length > 0}
      />
      <Footer />
    </div>
  );
}
