import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from "firebase/analytics";
import { 
    getAuth, 
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy,
    where,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp,
    enableIndexedDbPersistence,
    CACHE_SIZE_UNLIMITED,
    limit,
    deleteDoc,
    getCountFromServer
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { getMessaging, getToken } from "firebase/messaging";
import imageCompression from 'browser-image-compression';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// --- ID DE ADMINISTRADOR ---
const ADMIN_UID = "TU_USER_ID_DE_FIREBASE"; // Reemplaza si es necesario

// --- LISTA COMPLETA DE CIUDADES DE NICARAGUA ---
const nicaraguaCities = [ "Acoyapa", "Achuapa", "Altagracia", "Bluefields", "Boaco", "Bonanza", "Buenos Aires", "Camoapa", "Cárdenas", "Catarina", "Chichigalpa", "Chinandega", "Cinco Pinos", "Ciudad Antigua", "Ciudad Darío", "Ciudad Sandino", "Comalapa", "Condega", "Corinto", "Corn Island", "Cuapa", "Diriá", "Diriamba", "Diriomo", "Dolores", "El Almendro", "El Ayote", "El Castillo", "El Coral", "El Crucero", "El Cuá", "El Jicaral", "El Jícaro", "El Rama", "El Realejo", "El Rosario", "El Sauce", "El Tortuguero", "El Tuma - La Dalia", "El Viejo", "Esquipulas", "Estelí", "Granada", "Jalapa", "Jinotepe", "Jinotega", "Juigalpa", "Kukra Hill", "La Concepción", "La Concordia", "La Conquista", "La Cruz de Río Grande", "La Libertad", "La Paz Centro", "La Paz de Carazo", "La Trinidad", "Laguna de Perlas", "Larreynaga", "Las Sabanas", "León", "Macuelizo", "Managua", "Masatepe", "Masaya", "Matagalpa", "Matiguás", "Mateare", "Morrito", "Moyogalpa", "Mozonte", "Muelle de los Bueyes", "Mulukukú", "Murra", "Muy Muy", "Nagarote", "Nandaime", "Nandasmo", "Nindirí", "Niquinohomo", "Nueva Guinea", "Ocotal", "Palacagüina", "Paiwas", "Posoltega", "Potosí", "Prinzapolka", "Pueblo Nuevo", "Puerto Cabezas", "Puerto Morazán", "Quezalguaque", "Quilalí", "Rancho Grande", "Río Blanco", "Rivas", "Rosita", "San Carlos", "San Dionisio", "San Fernando", "San Francisco de Cuapa", "San Francisco del Norte", "San Isidro", "San Jorge", "San José de Bocay", "San José de Cusmapa", "San José de los Remates", "San Juan de Limay", "San Juan de Nicaragua", "San Juan de Oriente", "San Juan del Río Coco", "San Juan del Sur", "San Lorenzo", "San Lucas", "San Marcos", "San Miguelito", "San Nicolás", "San Pedro de Lóvago", "San Pedro del Norte", "San Rafael del Norte", "San Rafael del Sur", "San Ramón", "San Sebastián de Yalí", "Santa Lucía", "Santa María", "Santa María de Pantasma", "Santa Rosa del Peñón", "Santa Teresa", "Santo Domingo", "Santo Tomás", "Santo Tomás del Norte", "Sébaco", "Siuna", "Somotillo", "Somoto", "Telica", "Telpaneca", "Terrabona", "Teustepe", "Ticuantepe", "Tipitapa", "Tisma", "Tola", "Totogalpa", "Villa El Carmen", "Villa Sandino", "Villanueva", "Waspán", "Wiwilí de Jinotega", "Wiwilí de Nueva Segovia", "Yalagüina" ].sort();

// --- CATEGORÍAS ---
const productCategories = [ "Autos y Vehículos", "Motos", "Bienes Raíces", "Celulares y Tablets", "Computadoras y Laptops", "Electrónicos y Audio", "Videojuegos y Consolas", "Hogar y Muebles", "Electrodomésticos", "Ropa y Accesorios", "Salud y Belleza", "Deportes y Fitness", "Herramientas", "Construcción", "Industria y Oficina", "Mascotas", "Juguetes y Bebés", "Libros y Revistas", "Música y Hobbies", "Otro" ].sort();
const jobCategories = [ "Administración y Oficina", "Atención al Cliente", "Call Center y Telemercadeo", "Compras y Comercio Exterior", "Construcción y Obra", "Diseño y Artes Gráficas", "Docencia", "Finanzas y Contabilidad", "Gerencia y Dirección", "Informática y Telecomunicaciones", "Logística y Almacén", "Mantenimiento y Reparaciones", "Marketing y Publicidad", "Medicina y Salud", "Producción y Operarios", "Recursos Humanos", "Servicios Generales y Aseo", "Turismo y Hostelería", "Ventas", "Otro" ].sort();

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};


// --- INICIALIZACIÓN DE FIREBASE Y ANALYTICS ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

try { enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED }); } catch (error) { console.error("Error al inicializar la persistencia de Firestore:", error); }

// --- ICONOS ---
// (Tu código de íconos SVG se queda igual)
const BellIcon = ({ hasNotification, className }) => ( <div className="relative"><svg xmlns="http://www.w3.org/2000/svg" className={className || "h-7 w-7"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{hasNotification && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>}</div>);
const BriefcaseIcon = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className || "h-12 w-12 text-blue-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const HomeIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const MessagesIcon = ({isActive, hasNotification}) => <div className="relative"><svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{hasNotification && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>}</div>;
const PlusCircleIcon = () => <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const ListingsIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const AccountIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const HeartIcon = ({ isFavorite, ...props }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>;
const GearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DiamondIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.889 12.042l6.25-9.375a1.5 1.5 0 012.722 0l6.25 9.375a1.5 1.5 0 01-1.361 2.308H5.25a1.5 1.5 0 01-1.361-2.308z" /></svg>;
const PublicProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1.667a1.667 1.667 0 01.958-1.519l2.493-1.246a.5.5 0 01.73.424V6.25m-6.189-1.583A1.667 1.667 0 005.333 4.333V6.25m8.334 9.5a2.5 2.5 0 01-5 0m0 0a2.5 2.5 0 00-5 0m10 0V20a1 1 0 01-1 1H7a1 1 0 01-1-1v-2.5m10 0h.01" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22c4.612 0 8.58-2.624 10.382-6.382A11.955 11.955 0 0121 12c0-1.22-.182-2.401-.524-3.518l-3.86-1.544z" /></svg>;
const QuestionMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const StarIcon = ({ filled }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;


// --- COMPONENTE PARA SOLICITAR INICIO DE SESIÓN ---
// ... (sin cambios)

// --- COMPONENTE PRINCIPAL ---
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
                        location: "Managua, NI",
                        followers: 0,
                        following: 0,
                        rating: 0,
                        ratingCount: 0,
                        notifications: {
                            newMessages: true,
                            newJobs: true
                        },
                        showLocation: true // Preferencia de ubicación por defecto
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser({ uid: currentUser.uid, ...newUserProfile });
                }

                // --- LÓGICA PARA NOTIFICACIONES PUSH (COMENTADA TEMPORALMENTE) ---
                /*
                try {
                    const messaging = getMessaging(app);
                    const currentToken = await getToken(messaging, {
                        vapidKey: "BEmZeqVU-Ew145_Qg7BTHXm-Tj1e2lLgs2nRFLPICC_R8ul_PfXjVrIIfn9VHnUf4ycOYblQQMQLKEA55Kn4aX0",
                    });

                    if (currentToken) {
                        const userDocRef = doc(db, "users", currentUser.uid);
                        await updateDoc(userDocRef, { fcmToken: currentToken });
                    }
                } catch (err) {
                    console.log("Ocurrió un error al obtener el token de notificación.", err);
                }
                */

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
    const handleLogout = () => { auth.signOut(); goHome(); };
    
    const navigateToMessages = async (chatInfo) => {
        // ... (sin cambios)
    };
    
    const renderContent = () => {
        const { page } = currentView;
        const protectedPages = ['account', 'accountSettings', 'myListings', 'favorites', 'messages', 'publish', 'adminDashboard', 'notificationPreferences'];

        if (protectedPages.includes(page) && !user) {
            return <PleaseLogIn onLogin={handleLogin} />;
        }

        switch (page) {
            case 'listings': return <ListingsPage type={currentView.type} setView={setView} user={user} />;
            case 'listingDetail': return <ListingDetailPage listingId={currentView.listingId} currentUser={user} navigateToMessages={navigateToMessages} setView={setView} />;
            case 'publish': return <PublishPage type={currentView.type} setView={setView} user={user} listingId={currentView.listingId} />;
            case 'messages': return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} setUnreadChats={setUnreadChats} unreadChats={unreadChats} />;
            case 'account': return <AccountPage user={user} setView={setView} handleLogout={handleLogout} />;
            case 'accountSettings': return <AccountSettings user={user} setUser={setUser} />;
            case 'myListings': return <MyListings user={user} setView={setView} />;
            case 'favorites': return <FavoritesPage user={user} setView={setView} />;
            case 'adminDashboard': return <AdminDashboard />;
            case 'notificationPreferences': return <NotificationPreferences user={user} setUser={setUser} />;
            case 'publicProfile': return <PublicProfilePage userId={currentView.userId} setView={setView} user={user} />;
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
            <Header user={user} onLogin={handleLogin} onLogout={handleLogout} setView={setView} goHome={goHome} notificationCount={Object.values(unreadChats).filter(Boolean).length} />
            <main className="container mx-auto pb-24 md:pb-8">
                {history.length > 1 && currentView.page !== 'account' && 
                    <div className="px-4 md:px-0">
                        <BackButton onClick={goBack} />
                    </div>
                }
                <div className={currentView.page !== 'account' ? 'p-4 md:p-0' : ''}>
                    {renderContent()}
                </div>
            </main>
            <BottomNavBar setView={setView} currentView={currentView} goHome={goHome} hasUnreadMessages={Object.values(unreadChats).filter(Boolean).length > 0} />
            <Footer />
        </div>
    );
}

// --- OTROS COMPONENTES ---
// (BackButton, Header, Footer, BottomNavBar, HomePage, ListingsPage, ListingsSkeleton, SkeletonCard, ListingCard, PublishPage, ConfirmationModal, ChatPage, AdminDashboard, MenuItem, NotificationPreferences se quedan igual)

function ListingDetailPage({ listingId, currentUser, navigateToMessages, setView }) {
    // ...
    return (
        // ...
        <div className="flex items-center space-x-3 p-2 rounded-lg">
            <img src={listing.userPhotoURL || `https://i.pravatar.cc/150?u=${listing.userId}`} alt={listing.userName} className="w-10 h-10 rounded-full" />
            <div>
                <p 
                    className="font-semibold text-gray-800 cursor-pointer hover:underline"
                    onClick={() => setView({ page: 'publicProfile', userId: listing.userId })}
                >
                    {listing.userName}
                </p>
                <p className="text-sm text-gray-500">{listing.location}</p>
            </div>
        </div>
        // ...
    );
}

function AccountSettings({ user, setUser }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
    const [businessInfo, setBusinessInfo] = useState({ businessName: '', website: '' });
    const [showLocation, setShowLocation] = useState(user?.showLocation ?? true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoPreview(user.photoURL || '');
            setBusinessInfo({ businessName: user.businessName || '', website: user.website || '' });
            setShowLocation(user.showLocation ?? true);
        }
    }, [user]);
    
    const handlePhotoChange = (e) => { if (e.target.files[0]) { setPhotoFile(e.target.files[0]); setPhotoPreview(URL.createObjectURL(e.target.files[0])); } };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let newPhotoURL = user.photoURL;
            if (photoFile) {
                const photoRef = ref(storage, `profile-pictures/${user.uid}`);
                await uploadBytes(photoRef, photoFile);
                newPhotoURL = await getDownloadURL(photoRef);
            }
            const updatedData = { 
                displayName, 
                photoURL: newPhotoURL, 
                businessName: businessInfo.businessName, 
                website: businessInfo.website,
                showLocation: showLocation 
            };
            await updateProfile(auth.currentUser, { displayName, photoURL: newPhotoURL });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, updatedData);
            setUser(prev => ({...prev, ...updatedData}));
            alert("Perfil actualizado con éxito.");
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert("Hubo un error al actualizar tu perfil.");
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Ajustes de Cuenta</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center">
                    <img src={photoPreview || `https://i.pravatar.cc/150?u=${user?.uid}`} alt="Perfil" className="w-24 h-24 rounded-full mb-4 cursor-pointer" onClick={() => fileInputRef.current.click()} />
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:underline">Cambiar foto</button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajustes de Privacidad</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <label htmlFor="show-location" className="font-medium text-gray-700">Mostrar mi ubicación en mi perfil público</label>
                        <div 
                            onClick={() => setShowLocation(prev => !prev)}
                            className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors ${showLocation ? 'bg-blue-600' : ''}`}
                        >
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${showLocation ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de tu Negocio (Opcional)</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                        <input type="text" value={businessInfo.businessName} onChange={e => setBusinessInfo({ ...businessInfo, businessName: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mt-4">Sitio Web o Página Social</label>
                        <input type="text" placeholder="https://..." value={businessInfo.website} onChange={e => setBusinessInfo({ ...businessInfo, website: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300 flex items-center">
                        {isSaving && <SpinnerIcon />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}


function AccountPage({ user, setView, handleLogout }) {
    if (!user) return <p>Cargando perfil...</p>;

    const renderStars = (rating) => {
        // ... (sin cambios)
    };
    
    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:-m-8">
            <div className="p-4 max-w-3xl mx-auto">
                {/* ... */}
                <div className="flex items-center space-x-4 p-4">
                    <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">{user.displayName}</h2>
                        <p className="text-sm text-gray-400">{user.showLocation === false ? 'Ubicación privada' : (user.location || 'Ubicación no especificada')}</p>
                        {/* ... */}
                    </div>
                </div>
                {/* ... */}
            </div>
        </div>
    );
}


// --- COMPONENTES DE RESEÑAS ---
function StarRatingInput({ rating, setRating }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex space-x-1 justify-center">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={index}>
                        <input type="radio" name="rating" value={ratingValue} onClick={() => setRating(ratingValue)} className="hidden" />
                        <svg
                            className={`w-8 h-8 cursor-pointer ${ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </label>
                );
            })}
        </div>
    );
}

function ReviewModal({ show, onClose, onSubmit, targetUserName }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show) return null;

    const handleSubmit = async () => {
        if (rating === 0 || comment.trim() === "") {
            alert("Por favor, selecciona una calificación y escribe un comentario.");
            return;
        }
        setIsSubmitting(true);
        await onSubmit(rating, comment);
        setIsSubmitting(false);
        setRating(0);
        setComment("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Dejar una reseña para {targetUserName}</h2>
                <div className="space-y-4">
                    <StarRatingInput rating={rating} setRating={setRating} />
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escribe tu comentario aquí..."
                        className="w-full border-gray-300 rounded-md p-2"
                        rows="4"
                    />
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300">
                            {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE DE PERFIL PÚBLICO ---
function PublicProfilePage({ userId, setView, user }) {
    const [profile, setProfile] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // 1. Obtener la información del perfil del vendedor
                const profileDocRef = doc(db, 'users', userId);
                const profileSnap = await getDoc(profileDocRef);

                if (profileSnap.exists()) {
                    setProfile(profileSnap.data());
                }

                // 2. Obtener todos los anuncios activos de ese vendedor
                const listingsQuery = query(
                    collection(db, 'listings'),
                    where('userId', '==', userId),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc')
                );
                const listingsSnapshot = await getDocs(listingsQuery);
                setUserListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 3. Obtener las reseñas del usuario
                const reviewsQuery = query(
                    collection(db, 'users', userId, 'reviews'),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const reviewsSnapshot = await getDocs(reviewsQuery);
                setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error al cargar el perfil público:", error);
            }
            setLoading(false);
        };

        if (userId) {
            fetchProfileData();
        }
    }, [userId]);

    const handleReviewSubmit = async (rating, comment) => {
        if (!user) {
            alert("Debes iniciar sesión para dejar una reseña.");
            return;
        }
        
        const reviewData = {
            rating: rating,
            comment: comment,
            createdAt: serverTimestamp(),
            reviewerId: user.uid,
            reviewerName: user.displayName,
            reviewerPhotoURL: user.photoURL
        };

        try {
            const reviewsCollectionRef = collection(db, 'users', userId, 'reviews');
            await addDoc(reviewsCollectionRef, reviewData);
            alert("¡Gracias por tu reseña!");
        } catch (error) {
            console.error("Error al enviar la reseña:", error);
            alert("Hubo un problema al enviar tu reseña.");
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<StarIcon key={i} filled={i <= rating} />);
        }
        return stars;
    };

    if (loading) {
        return <div className="text-center p-10">Cargando perfil del vendedor...</div>;
    }

    if (!profile) {
        return <div className="text-center p-10">Este usuario no fue encontrado.</div>;
    }

    return (
        <>
            <ReviewModal 
                show={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleReviewSubmit}
                targetUserName={profile?.displayName}
            />
            <div className="container mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <img src={profile.photoURL || `https://i.pravatar.cc/150?u=${userId}`} alt={profile.displayName} className="w-24 h-24 rounded-full border-4 border-gray-200" />
                        <div>
                            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                            <p className="text-gray-600">
                                {profile.showLocation === false ? 'Ubicación privada' : (profile.location || 'Ubicación no especificada')}
                            </p>
                            <div className="flex items-center mt-1">
                                <div className="flex">{renderStars(profile.rating || 0)}</div>
                                <span className="text-xs text-gray-400 ml-2">({profile.ratingCount || 0} calificaciones)</span>
                            </div>
                        </div>
                    </div>
                    {user && user.uid !== userId && (
                        <button onClick={() => setShowReviewModal(true)} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
                            Dejar Reseña
                        </button>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Anuncios de {profile.displayName}</h2>
                    {userListings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {userListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Este vendedor no tiene anuncios activos en este momento.</p>
                    )}
                </div>

                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Reseñas Recibidas</h2>
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.id} className="bg-gray-50 p-4 rounded-lg border">
                                    <div className="flex items-center mb-2">
                                        <img src={review.reviewerPhotoURL} alt={review.reviewerName} className="w-8 h-8 rounded-full mr-3" />
                                        <span className="font-semibold">{review.reviewerName}</span>
                                    </div>
                                    <div className="flex mb-2">{renderStars(review.rating)}</div>
                                    <p className="text-gray-700">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Este usuario aún no ha recibido reseñas.</p>
                    )}
                </div>
            </div>
        </>
    );
}