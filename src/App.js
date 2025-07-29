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
// Asegúrate de tener tus variables de entorno configuradas en un archivo .env.local
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
const BellIcon = ({ hasNotification, className }) => ( <div className="relative"><svg xmlns="http://www.w3.org/2000/svg" className={className || "h-7 w-7"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{hasNotification && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>}</div>);
const BriefcaseIcon = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className || "h-12 w-12 text-blue-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const HomeIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const MessagesIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const PlusCircleIcon = () => <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const ListingsIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const AccountIcon = ({isActive}) => <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const HeartIcon = ({ isFavorite, ...props }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>;
// --- NUEVOS ICONOS ---
const GearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DiamondIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.889 12.042l6.25-9.375a1.5 1.5 0 012.722 0l6.25 9.375a1.5 1.5 0 01-1.361 2.308H5.25a1.5 1.5 0 01-1.361-2.308z" /></svg>;
const PublicProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1.667a1.667 1.667 0 01.958-1.519l2.493-1.246a.5.5 0 01.73.424V6.25m-6.189-1.583A1.667 1.667 0 005.333 4.333V6.25m8.334 9.5a2.5 2.5 0 01-5 0m0 0a2.5 2.5 0 00-5 0m10 0V20a1 1 0 01-1 1H7a1 1 0 01-1-1v-2.5m10 0h.01" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22c4.612 0 8.58-2.624 10.382-6.382A11.955 11.955 0 0121 12c0-1.22-.182-2.401-.524-3.518l-3.86-1.544z" /></svg>;
const QuestionMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const StarIcon = ({ filled }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;


// --- COMPONENTE PARA SOLICITAR INICIO DE SESIÓN ---
function PleaseLogIn({ onLogin }) {
    return (
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Inicia Sesión para Continuar</h2>
            <p className="text-gray-600 mb-6">Necesitas una cuenta para poder acceder a esta página.</p>
            <button 
                onClick={onLogin} 
                className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
                Iniciar Sesión con Google
            </button>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([{ page: 'home' }]);
    const [activeChat, setActiveChat] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
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
                        // Añadimos campos adicionales que usaremos en la nueva AccountPage
                        location: "Managua, NI", // Ubicación por defecto
                        followers: 0,
                        following: 0,
                        rating: 0,
                        ratingCount: 0,
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser({ uid: currentUser.uid, ...newUserProfile });
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
    const handleLogout = () => { auth.signOut(); goHome(); };
    
    // --- FUNCIÓN DE NAVEGACIÓN A MENSAJES (CORREGIDA Y COMPLETADA) ---
    const navigateToMessages = async (chatInfo) => {
        if (!auth.currentUser) {
            alert("Debes iniciar sesión para enviar mensajes.");
            return;
        }
        
        // Prevenir que un usuario inicie un chat consigo mismo
        if (auth.currentUser.uid === chatInfo.recipientId) {
            alert("No puedes enviarte mensajes a ti mismo.");
            return;
        }

        // Crear un ID de chat único y consistente
        const chatId = [auth.currentUser.uid, chatInfo.recipientId].sort().join('_');
        const chatRef = doc(db, "chats", chatId);
        
        try {
            const chatDoc = await getDoc(chatRef);

            // Si el chat no existe, créalo
            if (!chatDoc.exists()) {
                await setDoc(chatRef, {
                    participants: [auth.currentUser.uid, chatInfo.recipientId],
                    participantInfo: {
                        [auth.currentUser.uid]: { 
                            displayName: user.displayName, 
                            photoURL: user.photoURL 
                        },
                        [chatInfo.recipientId]: { 
                            displayName: chatInfo.recipientName, 
                            photoURL: chatInfo.recipientPhotoURL 
                        }
                    },
                    messages: [], 
                    createdAt: serverTimestamp(), 
                    updatedAt: serverTimestamp(),
                });
            }
            
            // Obtener los datos del chat (ya sea existente o recién creado)
            const finalChatDoc = await getDoc(chatRef);
            const recipientId = finalChatDoc.data().participants.find(p => p !== auth.currentUser.uid);
            const recipientInfo = finalChatDoc.data().participantInfo[recipientId];

            // Establecer el chat activo y navegar a la página de mensajes
            setActiveChat({ id: finalChatDoc.id, ...finalChatDoc.data(), recipientInfo });
            setView({ page: 'messages' });

        } catch (error) {
            console.error("Error al crear o navegar al chat:", error);
            alert("Hubo un problema al iniciar la conversación. Inténtalo de nuevo.");
        }
    };
    
    const renderContent = () => {
        const { page } = currentView;
        const protectedPages = ['account', 'accountSettings', 'myListings', 'favorites', 'messages', 'publish', 'adminDashboard'];

        if (protectedPages.includes(page) && !user) {
            return <PleaseLogIn onLogin={handleLogin} />;
        }

        switch (page) {
            case 'listings': return <ListingsPage type={currentView.type} setView={setView} user={user} />;
            case 'listingDetail': return <ListingDetailPage listingId={currentView.listingId} currentUser={user} navigateToMessages={navigateToMessages} setView={setView} />;
            case 'publish': return <PublishPage type={currentView.type} setView={setView} user={user} listingId={currentView.listingId} />;
            case 'messages': return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} setView={setView} />;
            case 'account': return <AccountPage user={user} setView={setView} handleLogout={handleLogout} />;
            case 'accountSettings': return <AccountSettings user={user} setUser={setUser} />;
            case 'myListings': return <MyListings user={user} setView={setView} />;
            case 'favorites': return <FavoritesPage user={user} setView={setView} />;
            case 'adminDashboard': return <AdminDashboard />;
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
            <Header user={user} onLogin={handleLogin} onLogout={handleLogout} setView={setView} goHome={goHome} notificationCount={0} />
            <main className="container mx-auto pb-24 md:pb-8">
                 {/* No renderizar el botón de volver en la página de cuenta para un look más limpio */}
                {history.length > 1 && currentView.page !== 'account' && 
                    <div className="px-4 md:px-0">
                        <BackButton onClick={goBack} />
                    </div>
                }
                <div className={currentView.page !== 'account' ? 'p-4 md:p-0' : ''}>
                    {renderContent()}
                </div>
            </main>
            <BottomNavBar setView={setView} currentView={currentView} goHome={goHome} />
            <Footer />
        </div>
    );
}

// --- RESTO DE COMPONENTES ---
function BackButton({ onClick }) { return ( <button onClick={onClick} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-4"><ArrowLeftIcon /> Volver</button> ); }
function Header({ user, onLogin, onLogout, setView, goHome, notificationCount }) { return ( <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50 hidden md:block"><nav className="container mx-auto px-4 py-3 flex justify-between items-center"><div className="flex items-center cursor-pointer" onClick={goHome}><span className="text-2xl font-bold text-blue-600">Mercado<span className="text-sky-500">Nica</span></span></div><div className="flex items-center space-x-4">{user && user.uid === ADMIN_UID && <button onClick={() => setView({ page: 'adminDashboard' })} className="text-sm font-semibold text-blue-600 hover:underline">Admin</button>}{user && <div className="cursor-pointer" onClick={() => setView({ page: 'messages' })}><BellIcon hasNotification={notificationCount > 0} /></div>}{user ? (<div className="relative group"><img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-10 h-10 rounded-full cursor-pointer" /><div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block"><span className="block px-4 py-2 text-sm text-gray-700 font-semibold truncate">{user.displayName}</span><a href="#" onClick={(e) => {e.preventDefault(); setView({ page: 'account' })}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Cuenta</a><a href="#" onClick={(e) => {e.preventDefault(); onLogout()}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a></div></div>) : ( <button onClick={onLogin} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Iniciar Sesión</button> )}</div></nav></header> ); }
function Footer() { return ( <footer className="bg-white/80 backdrop-blur-sm mt-12 py-6 border-t hidden md:block"><div className="container mx-auto text-center text-gray-600"><p>&copy; {new Date().getFullYear()} MercadoNica. Todos los derechos reservados.</p></div></footer> ); }
function BottomNavBar({ setView, currentView, goHome }) { const handlePublishClick = () => { setView({ page: 'publish', type: 'producto' }) }; const navItems = [ { name: 'Inicio', icon: HomeIcon, page: 'home', action: goHome }, { name: 'Mensajes', icon: MessagesIcon, page: 'messages', action: () => setView({ page: 'messages' }) }, { name: 'Publicar', icon: PlusCircleIcon, page: 'publish', action: handlePublishClick, isCentral: true }, { name: 'Anuncios', icon: ListingsIcon, page: 'myListings', action: () => setView({ page: 'myListings' }) }, { name: 'Cuenta', icon: AccountIcon, page: 'account', action: () => setView({ page: 'account' }) }, ]; return ( <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t shadow-lg z-50"><div className="flex justify-around items-center h-16">{navItems.map(item => { const isActive = item.page === 'account' ? ['account', 'accountSettings', 'myListings', 'favorites'].includes(currentView.page) : currentView.page === item.page; const Icon = item.icon; if (item.isCentral) { return ( <button key={item.name} onClick={item.action} className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center -mt-6 shadow-lg"><Icon /></button> ); } return ( <button key={item.name} onClick={item.action} className="flex flex-col items-center justify-center text-xs w-16"><Icon isActive={isActive} /><span className={`mt-1 truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{item.name}</span></button> ); })}</div></div> ); }
function HomePage({ setView }) { const [recentListings, setRecentListings] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { const q = query( collection(db, "listings"), where("type", "==", "producto"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(8) ); const unsubscribe = onSnapshot(q, (snapshot) => { const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setRecentListings(listingsData); setLoading(false); }); return () => unsubscribe(); }, []); return ( <div className="container mx-auto"><div className="bg-white p-6 rounded-lg shadow-lg mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Bienvenido a MercadoNica</h1><p className="text-gray-600 text-lg">Tu plataforma para comprar, vender y encontrar empleo en Nicaragua.</p></div><div onClick={() => setView({ page: 'listings', type: 'trabajo' })} className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex items-center justify-between mb-12"><div><h2 className="text-2xl font-bold">¿Buscas Empleo?</h2><p className="opacity-90">Explora las últimas vacantes o publica una oferta.</p></div><BriefcaseIcon className="h-12 w-12 text-white opacity-80" /></div><div className="mb-12"><h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Artículos Recientes</h2>{loading ? <ListingsSkeleton /> : ( <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{recentListings.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={null} />)}</div> )}<div className="text-center mt-8"><button onClick={() => setView({ page: 'listings', type: 'producto' })} className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Ver todos los artículos</button></div></div></div> ); }
function ListingsPage({ type, setView, user }) { const [allListings, setAllListings] = useState([]); const [filteredListings, setFilteredListings] = useState([]); const [loading, setLoading] = useState(true); const [searchTerm, setSearchTerm] = useState(''); const [selectedCity, setSelectedCity] = useState(''); const [selectedCategory, setSelectedCategory] = useState(''); const pageTitle = type === 'producto' ? 'Artículos en Venta' : 'Ofertas de Empleo'; const publishButtonText = type === 'producto' ? 'Vender Artículo' : 'Publicar Empleo'; const categories = type === 'producto' ? productCategories : jobCategories; useEffect(() => { setLoading(true); const q = query( collection(db, "listings"), where("type", "==", type), where("status", "==", "active"), orderBy("createdAt", "desc") ); const unsubscribe = onSnapshot(q, (snapshot) => { const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setAllListings(listingsData); setFilteredListings(listingsData); setLoading(false); }, (error) => { console.error("Error fetching listings:", error); setLoading(false); }); return () => unsubscribe(); }, [type]); useEffect(() => { let result = allListings; if (searchTerm) { result = result.filter(listing => listing.title.toLowerCase().includes(searchTerm.toLowerCase())); } if (selectedCity) { result = result.filter(listing => listing.location === selectedCity); } if (selectedCategory) { result = result.filter(listing => listing.category === selectedCategory); } setFilteredListings(result); }, [searchTerm, selectedCity, selectedCategory, allListings]); return ( <div className="container mx-auto"><div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"><h1 className="text-3xl font-bold">{pageTitle}</h1><div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto"><input type="text" placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto" /><select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto"><option value="">Todas las Ciudades</option>{nicaraguaCities.map(city => <option key={city} value={city}>{city}</option>)}</select><select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto"><option value="">Todas las Categorías</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><button onClick={() => setView({ page: 'publish', type: type })} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto">{publishButtonText}</button></div>{loading ? <ListingsSkeleton /> : ( <> <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />)}</div> {!loading && filteredListings.length === 0 && <p className="text-center text-gray-500 mt-8">No se encontraron anuncios que coincidan con tu búsqueda.</p>} </> )}</div> ); }
function ListingsSkeleton() { return ( <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div> ); }
function SkeletonCard() { return ( <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"><div className="w-full h-48 bg-gray-300"></div><div className="p-4 space-y-3"><div className="h-4 bg-gray-300 rounded w-1/3"></div><div className="h-6 bg-gray-300 rounded w-full"></div><div className="h-4 bg-gray-300 rounded w-1/2"></div><div className="h-8 bg-gray-300 rounded w-1/3"></div></div></div> ); }
function ListingCard({ listing, setView, user }) { const placeholderUrl = `https://placehold.co/400x400/e2e8f0/64748b?text=${listing.type === 'producto' ? 'Producto' : 'Empleo'}`; const [isFavorite, setIsFavorite] = useState(false); useEffect(() => { if (!user) return; const favRef = doc(db, "users", user.uid, "favorites", listing.id); const unsubscribe = onSnapshot(favRef, (doc) => { setIsFavorite(doc.exists()); }); return () => unsubscribe(); }, [user, listing.id]); const toggleFavorite = async (e) => { e.stopPropagation(); if (!user) { alert("Debes iniciar sesión para guardar favoritos."); return; } const favRef = doc(db, "users", user.uid, "favorites", listing.id); if (isFavorite) { await deleteDoc(favRef); } else { await setDoc(favRef, { ...listing, addedAt: serverTimestamp() }); } }; const isJob = listing.type === 'trabajo'; const imageUrl = listing.photos?.[0]?.thumb || placeholderUrl; return ( <div onClick={() => setView({ page: 'listingDetail', listingId: listing.id })} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"><div className="relative"><img src={imageUrl} alt={listing.title} className="w-full aspect-square object-cover" />{user && ( <button onClick={toggleFavorite} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100"><HeartIcon isFavorite={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} /></button> )}{listing.photos && listing.photos.length > 1 && ( <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center"><CameraIcon /><span className="ml-1">{listing.photos.length}</span></div> )}</div><div className="p-4 flex-grow flex flex-col space-y-1"><span className="text-xs font-semibold text-gray-500 uppercase">{listing.category}</span><h3 className="font-semibold text-gray-800 h-12 line-clamp-2">{listing.title}</h3><p className="text-gray-600 text-sm flex-grow">{listing.location}</p><div className="pt-2">{isJob ? ( <p className="text-md font-bold text-blue-600">{listing.salary || 'Salario a convenir'}</p> ) : ( <p className="text-lg font-extrabold text-blue-700">{listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Consultar'}</p> )}</div></div></div> ); }
function PublishPage({ type, setView, user, listingId }) { const isJob = type === 'trabajo'; const [formData, setFormData] = useState({ title: '', description: '', category: '', price: '', companyName: '', salary: '', make: '', model: '', year: '', mileage: '', applicationContact: '' }); const [location, setLocation] = useState(''); const [newImageFiles, setNewImageFiles] = useState([]); const [existingPhotos, setExistingPhotos] = useState([]); const [isSubmitting, setIsSubmitting] = useState(false); const [errors, setErrors] = useState({}); const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 }); const categories = isJob ? jobCategories : productCategories; const isEditing = !!listingId; useEffect(() => { if (isEditing) { const fetchListing = async () => { const docRef = doc(db, "listings", listingId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const data = docSnap.data(); setFormData({ title: data.title, description: data.description, category: data.category || '', price: data.price || '', companyName: data.companyName || '', salary: data.salary || '', make: data.make || '', model: data.model || '', year: data.year || '', mileage: data.mileage || '', applicationContact: data.applicationContact || '' }); setLocation(data.location); setExistingPhotos(data.photos || []); } }; fetchListing(); } }, [listingId, isEditing]); const validateForm = () => { const newErrors = {}; if (!formData.title.trim()) newErrors.title = "El título es obligatorio."; else if (formData.title.trim().length < 5) newErrors.title = "El título debe tener al menos 5 caracteres."; if (!isJob && !formData.category) newErrors.category = "Debes seleccionar una categoría."; if (!location) newErrors.location = "Debes seleccionar una ubicación."; if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria."; else if (formData.description.trim().length < 15) newErrors.description = "La descripción debe ser más detallada (mínimo 15 caracteres)."; if (!isJob && existingPhotos.length === 0 && newImageFiles.length === 0) newErrors.images = "Debes subir al menos una foto para el artículo."; setErrors(newErrors); return Object.keys(newErrors).length === 0; }; const handleImageChange = (e) => { if (e.target.files) { const filesArray = Array.from(e.target.files); const currentImagesCount = existingPhotos.length + newImageFiles.length; const maxImages = isJob ? 1 : 12; if (currentImagesCount + filesArray.length > maxImages) { setErrors(prev => ({ ...prev, images: `No puedes subir más de ${maxImages} ${isJob ? 'logo/foto' : 'fotos'}.` })); return; } const validFiles = []; for (const file of filesArray) { if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, images: `La imagen "${file.name}" es muy grande (máx 5MB).` })); continue; } if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { setErrors(prev => ({ ...prev, images: `El archivo "${file.name}" no es una imagen válida.` })); continue; } validFiles.push(file); } if (isJob) { setNewImageFiles(validFiles); } else { setNewImageFiles(prev => [...prev, ...validFiles]); } if (errors.images) setErrors(prev => ({ ...prev, images: null })); } }; const removeNewImage = (index) => { setNewImageFiles(prev => prev.filter((_, i) => i !== index)); }; const removeExistingImage = (index) => { setExistingPhotos(prev => prev.filter((_, i) => i !== index)); }; const handleSubmit = async (e) => { e.preventDefault(); if (!user) { setErrors({ form: "Debes iniciar sesión para publicar." }); return; } if (!validateForm()) return; setIsSubmitting(true); setErrors({}); try { const uploadAndGetURLs = async (file) => { const timestamp = Date.now(); const randomId = Math.random().toString(36).substring(2, 8); const baseName = `${user.uid}/${timestamp}_${randomId}_${file.name}`; const fullImg = await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920 }); const fullImgRef = ref(storage, `listings/${baseName}_full.jpg`); await uploadBytes(fullImgRef, fullImg); const fullUrl = await getDownloadURL(fullImgRef); const thumbImg = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 400 }); const thumbImgRef = ref(storage, `listings/${baseName}_thumb.jpg`); await uploadBytes(thumbImgRef, thumbImg); const thumbUrl = await getDownloadURL(thumbImgRef); return { full: fullUrl, thumb: thumbUrl }; }; setUploadProgress({ current: 0, total: newImageFiles.length }); const newPhotoObjects = []; for (let i = 0; i < newImageFiles.length; i++) { const file = newImageFiles[i]; const urls = await uploadAndGetURLs(file); newPhotoObjects.push(urls); setUploadProgress({ current: i + 1, total: newImageFiles.length }); } const allPhotos = [...existingPhotos, ...newPhotoObjects]; const listingData = { title: formData.title, description: formData.description, category: formData.category, location, type, photos: allPhotos, userId: user.uid, userName: user.displayName, userPhotoURL: user.photoURL, status: 'active', updatedAt: serverTimestamp(), }; if (isJob) { listingData.companyName = formData.companyName; listingData.salary = formData.salary; listingData.applicationContact = formData.applicationContact; } else { listingData.price = Number(formData.price) || 0; listingData.make = formData.make; listingData.model = formData.model; listingData.year = formData.year; listingData.mileage = formData.mileage; } if (isEditing) { const docRef = doc(db, "listings", listingId); await updateDoc(docRef, listingData); } else { const newDocRef = await addDoc(collection(db, "listings"), { ...listingData, createdAt: serverTimestamp() }); logEvent(analytics, 'publish_listing', { user_id: user.uid, listing_id: newDocRef.id, listing_type: type, category: listingData.category, location: listingData.location, }); } setView({ page: 'listings', type: type }); } catch (error) { console.error("Error al publicar:", error); setErrors({ form: "Hubo un error al publicar. Revisa tu conexión o inténtalo más tarde." }); } finally { setIsSubmitting(false); setUploadProgress({ current: 0, total: 0 }); } }; const showVehicleFields = formData.category === 'Autos y Vehículos' || formData.category === 'Motos'; const allPreviews = [ ...existingPhotos.map((photo, index) => ({ type: 'existing', url: photo.thumb, index })), ...newImageFiles.map((file, index) => ({ type: 'new', url: URL.createObjectURL(file), index })) ]; return ( <div className="container mx-auto max-w-2xl"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar' : 'Publicar'} {isJob ? 'Empleo' : 'Artículo'}</h2><form onSubmit={handleSubmit} className="space-y-4">{errors.form && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{errors.form}</p>}<div><input type="text" placeholder={isJob ? "Título del Puesto" : "Título del anuncio"} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.title ? 'border-red-500' : ''}`} />{errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}</div><div><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.category && !isJob ? 'border-red-500' : ''}`}><option value="">{isJob ? "Selecciona una Categoría (Opcional)" : "Selecciona una Categoría"}</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>{errors.category && !isJob && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}</div>{showVehicleFields && ( <div className="p-4 border rounded-md bg-gray-50 space-y-4"><h3 className="font-semibold text-gray-700">Detalles del Vehículo</h3><div><input type="text" placeholder="Marca (Ej: Toyota)" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div><div><input type="text" placeholder="Modelo (Ej: Hilux)" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div><div><input type="number" placeholder="Año (Ej: 2022)" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div><div><input type="number" placeholder="Kilometraje (Opcional)" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div></div> )}{isJob && (<> <input type="text" placeholder="Nombre de la Empresa (Opcional)" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> <input type="text" placeholder="Email o Link para Aplicar (Opcional)" value={formData.applicationContact} onChange={e => setFormData({ ...formData, applicationContact: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> </>)}<div><textarea placeholder={isJob ? "Descripción del puesto, requisitos..." : "Descripción detallada..."} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.description ? 'border-red-500' : ''}`} rows="4" />{errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}</div>{isJob ? <input type="text" placeholder="Salario (Ej: C$15,000 o A convenir)" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> : <input type="number" placeholder="Precio (C$) (Opcional)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />}<div><select value={location} onChange={e => setLocation(e.target.value)} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.location ? 'border-red-500' : ''}`}><option value="">Selecciona una Ciudad</option>{nicaraguaCities.map(c => <option key={c} value={c}>{c}</option>)}</select>{errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}</div><div><label className="block text-sm font-medium text-gray-700">{isJob ? 'Logo (1 max)' : 'Fotos (12 max)'}</label><div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">{allPreviews.map((p) => ( <div key={`${p.type}-${p.index}`} className="relative"><img src={p.url} alt={`Preview ${p.index}`} className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => p.type === 'existing' ? removeExistingImage(p.index) : removeNewImage(p.index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button></div> ))}{allPreviews.length < (isJob ? 1 : 12) && ( <label htmlFor="file-upload" className="flex items-center justify-center w-24 h-24 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500"><div className="text-center text-gray-500">+<br />Añadir</div><input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple={!isJob} /></label> )}{errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}</div></div><div className="flex justify-end space-x-4 items-center">{isSubmitting && uploadProgress.total > 0 && <span className="text-sm text-gray-500">{`Subiendo ${uploadProgress.current} de ${uploadProgress.total}...`}</span>}<button type="button" onClick={() => setView({ page: 'listings', type: type })} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button><button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center disabled:bg-blue-300 min-w-[100px]">{isSubmitting ? <SpinnerIcon /> : (isEditing ? 'Actualizar' : 'Publicar')}</button></div></form></div></div> ); }
function ListingDetailPage({ listingId, currentUser, navigateToMessages, setView }) { const [listing, setListing] = useState(null); const [loading, setLoading] = useState(true); const [mainImage, setMainImage] = useState(''); const [lightboxOpen, setLightboxOpen] = useState(false); const [lightboxIndex, setLightboxIndex] = useState(0); const [isFavorite, setIsFavorite] = useState(false); const [seller, setSeller] = useState(null); useEffect(() => { const docRef = doc(db, "listings", listingId); const unsubscribe = onSnapshot(docRef, (doc) => { if (doc.exists()) { const data = { id: doc.id, ...doc.data() }; setListing(data); if (data.photos && data.photos.length > 0) { setMainImage(data.photos[0].full); } } setLoading(false); }); return () => unsubscribe(); }, [listingId]); useEffect(() => { if (!listing) return; const fetchSeller = async () => { const userRef = doc(db, "users", listing.userId); const userSnap = await getDoc(userRef); if (userSnap.exists()) { setSeller(userSnap.data()); } }; fetchSeller(); if (currentUser) { const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id); const unsub = onSnapshot(favRef, (doc) => { setIsFavorite(doc.exists()); }); return () => unsub(); } }, [currentUser, listing]); const toggleFavorite = async (e) => { e.stopPropagation(); if (!currentUser) return; const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id); if (isFavorite) { await deleteDoc(favRef); } else { await setDoc(favRef, { ...listing, addedAt: serverTimestamp() }); } }; const openLightboxOn = (index) => { setLightboxIndex(index); setLightboxOpen(true); }; if (loading) return <p className="text-center">Cargando anuncio...</p>; if (!listing) return <p className="text-center">Anuncio no encontrado.</p>; const isJob = listing.type === 'trabajo'; const publisherLabel = isJob ? 'Reclutador' : 'Vendedor'; const slides = listing.photos?.map(photo => ({ src: photo.full })) || []; return ( <> <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="relative"><img src={mainImage || 'https://placehold.co/600x400'} alt={listing.title} className="w-full h-80 object-cover rounded-lg mb-4 cursor-pointer" onClick={() => openLightboxOn(listing.photos.findIndex(p => p.full === mainImage))} />{currentUser && ( <button onClick={toggleFavorite} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"><HeartIcon isFavorite={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} /></button> )}{listing.photos && listing.photos.length > 1 && ( <div className="flex space-x-2 overflow-x-auto">{listing.photos.map((photo, index) => ( <img key={index} src={photo.thumb} onClick={() => setMainImage(photo.full)} className={`h-20 w-20 object-cover rounded-md cursor-pointer ${mainImage === photo.full ? 'border-2 border-blue-500' : ''}`} /> ))}</div> )}</div><div><span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{listing.category}</span><h1 className="text-3xl font-bold my-2">{listing.title}</h1>{isJob ? ( <p className="text-2xl font-semibold text-gray-800 mb-1">Empresa: {listing.companyName || 'No especificada'}</p> ) : null}<p className="text-3xl font-bold text-blue-600 mb-4">{isJob ? (listing.salary || 'Salario a convenir') : (listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Precio a Consultar')}</p>{(listing.make || listing.model || listing.year) && ( <div className="mb-4 p-4 border rounded-md bg-gray-50"><h3 className="font-semibold text-lg mb-2">Detalles del Vehículo</h3><div className="grid grid-cols-2 gap-2 text-sm">{listing.make && <p><strong>Marca:</strong> {listing.make}</p>}{listing.model && <p><strong>Modelo:</strong> {listing.model}</p>}{listing.year && <p><strong>Año:</strong> {listing.year}</p>}{listing.mileage && <p><strong>Kilometraje:</strong> {listing.mileage} km</p>}</div></div> )}<p className="text-gray-600 mb-4 whitespace-pre-wrap">{listing.description || "No se agregó una descripción."}</p><div className="border-t pt-4 space-y-4"><h3 className="font-semibold text-lg">Información del {publisherLabel}</h3><div className="flex items-center space-x-3 p-2 rounded-lg"><img src={listing.userPhotoURL || `https://i.pravatar.cc/150?u=${listing.userId}`} alt={listing.userName} className="w-10 h-10 rounded-full" /><div><p className="font-semibold text-gray-800">{listing.userName}</p><p className="text-sm text-gray-500">{listing.location}</p></div></div>{seller && seller.businessName && ( <div className="border-t pt-4"><h3 className="font-semibold text-lg mb-2">Información del Negocio</h3><p className="font-semibold text-gray-800">{seller.businessName}</p>{seller.website && <a href={seller.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visitar Sitio Web</a>}</div> )}</div>{currentUser && currentUser.uid !== listing.userId && ( <div className="mt-6 space-y-4"><button onClick={() => navigateToMessages({recipientId: listing.userId, recipientName: listing.userName, recipientPhotoURL: listing.userPhotoURL})} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition">Enviar Mensaje</button>{isJob && listing.applicationContact && ( <a href={listing.applicationContact.startsWith('http') ? listing.applicationContact : `mailto:${listing.applicationContact}`} target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold transition">Aplicar (Email/Link)</a> )}</div> )}</div></div></div><Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} /> </> ); }
function AccountSettings({ user, setUser }) { const [displayName, setDisplayName] = useState(user?.displayName || ''); const [isSaving, setIsSaving] = useState(false); const [photoFile, setPhotoFile] = useState(null); const [photoPreview, setPhotoPreview] = useState(user?.photoURL || ''); const [businessInfo, setBusinessInfo] = useState({ businessName: '', website: '' }); const fileInputRef = useRef(null); useEffect(() => { if (user) { setDisplayName(user.displayName || ''); setPhotoPreview(user.photoURL || ''); setBusinessInfo({ businessName: user.businessName || '', website: user.website || '' }); } }, [user]); const handlePhotoChange = (e) => { if (e.target.files[0]) { setPhotoFile(e.target.files[0]); setPhotoPreview(URL.createObjectURL(e.target.files[0])); } }; const handleSave = async (e) => { e.preventDefault(); setIsSaving(true); try { let newPhotoURL = user.photoURL; if (photoFile) { const photoRef = ref(storage, `profile-pictures/${user.uid}`); await uploadBytes(photoRef, photoFile); newPhotoURL = await getDownloadURL(photoRef); } const updatedData = { displayName, photoURL: newPhotoURL, businessName: businessInfo.businessName, website: businessInfo.website }; await updateProfile(auth.currentUser, { displayName, photoURL: newPhotoURL }); const userDocRef = doc(db, "users", user.uid); await updateDoc(userDocRef, updatedData); setUser(prev => ({...prev, ...updatedData})); alert("Perfil actualizado con éxito."); } catch (error) { console.error("Error al actualizar perfil:", error); alert("Hubo un error al actualizar tu perfil."); } setIsSaving(false); }; return ( <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto"><h2 className="text-2xl font-bold mb-6">Ajustes de Cuenta</h2><form onSubmit={handleSave} className="space-y-6"><div className="flex flex-col items-center"><img src={photoPreview || `https://i.pravatar.cc/150?u=${user?.uid}`} alt="Perfil" className="w-24 h-24 rounded-full mb-4 cursor-pointer" onClick={() => fileInputRef.current.click()} /><input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" /><button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:underline">Cambiar foto</button></div><div><label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /></div><div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-800 mb-4">Información de tu Negocio (Opcional)</h3><div><label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label><input type="text" value={businessInfo.businessName} onChange={e => setBusinessInfo({...businessInfo, businessName: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div><div><label className="block text-sm font-medium text-gray-700 mt-4">Sitio Web o Página Social</label><input type="text" placeholder="https://..." value={businessInfo.website} onChange={e => setBusinessInfo({...businessInfo, website: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div></div><div className="flex justify-end"><button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300 flex items-center">{isSaving && <SpinnerIcon />}{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button></div></form></div> ); }
function MyListings({ user, setView }) { const [myListings, setMyListings] = useState([]); const [loading, setLoading] = useState(true); const [showDeleteModal, setShowDeleteModal] = useState(null); const [showSoldModal, setShowSoldModal] = useState(null); useEffect(() => { if (!user) return; const q = query(collection(db, "listings"), where("userId", "==", user.uid), orderBy("createdAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { setMyListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); }); return () => unsubscribe(); }, [user]); const handleDelete = async (listingToDelete) => { if (!listingToDelete) return; try { if (listingToDelete.photos && listingToDelete.photos.length > 0) { const deletePromises = listingToDelete.photos.map(photo => { try { const fullRef = ref(storage, photo.full); const thumbRef = ref(storage, photo.thumb); return Promise.all([deleteObject(fullRef), deleteObject(thumbRef)]); } catch (e) { console.warn("No se pudo borrar la foto:", e.message); return Promise.resolve(); } }); await Promise.all(deletePromises); } await deleteDoc(doc(db, "listings", listingToDelete.id)); alert("Anuncio eliminado."); } catch (error) { console.error("Error eliminando:", error); alert("Error al eliminar."); } finally { setShowDeleteModal(null); } }; const handleMarkAsSold = async (listingToMark) => { if (!listingToMark) return; try { await updateDoc(doc(db, "listings", listingToMark.id), { status: 'sold' }); alert("Anuncio marcado como vendido."); } catch (error) { console.error("Error marcando como vendido:", error); alert("Error al actualizar."); } finally { setShowSoldModal(null); } }; return ( <> <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto"><h2 className="text-2xl font-bold mb-6">Mis Anuncios</h2>{loading ? <p>Cargando...</p> : !myListings.length ? <p>No has publicado nada.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{myListings.map(listing => ( <div key={listing.id} className={`border rounded-lg p-2 flex flex-col justify-between ${listing.status !== 'active' ? 'bg-gray-100 opacity-60' : ''}`}><div><img src={listing.photos?.[0]?.thumb || `https://placehold.co/600x400/e2e8f0/64748b?text=${listing.type}`} className="w-full h-32 object-cover rounded-md" /><h3 className="font-semibold truncate mt-2">{listing.title}</h3>{listing.status === 'sold' && <p className="text-sm font-bold text-green-600">VENDIDO</p>}</div><div className="flex gap-2 mt-2"><button onClick={() => setView({ page: 'publish', type: listing.type, listingId: listing.id })} className="w-full bg-blue-500 text-white text-sm font-semibold py-1 rounded-md hover:bg-blue-600">Editar</button>{listing.status === 'active' && listing.type === 'producto' && <button onClick={() => setShowSoldModal(listing)} className="w-full bg-green-500 text-white text-sm font-semibold py-1 rounded-md hover:bg-green-600">Vendido</button>}<button onClick={() => setShowDeleteModal(listing)} className="w-full bg-red-500 text-white text-sm font-semibold py-1 rounded-md hover:bg-red-600">Eliminar</button></div></div> ))}</div>}</div> {showDeleteModal && ( <ConfirmationModal message="¿Seguro que quieres eliminar este anuncio?" onConfirm={() => handleDelete(showDeleteModal)} onCancel={() => setShowDeleteModal(null)} /> )} {showSoldModal && ( <ConfirmationModal message="¿Marcar como vendido? No será visible en búsquedas." onConfirm={() => handleMarkAsSold(showSoldModal)} onCancel={() => setShowSoldModal(null)} /> )} </> ); }
function FavoritesPage({ user, setView }) { const [favorites, setFavorites] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { if (!user) return; const q = query(collection(db, "users", user.uid, "favorites"), orderBy("addedAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); }); return () => unsubscribe(); }, [user]); return ( <div className="container mx-auto"><h1 className="text-3xl font-bold mb-8">Mis Favoritos</h1>{loading ? <ListingsSkeleton /> : ( <> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">{favorites.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />)}</div> {!loading && favorites.length === 0 && <p className="text-center text-gray-500 mt-8">No has guardado favoritos.</p>} </> )}</div> ); }
function ConfirmationModal({ message, onConfirm, onCancel }) { return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-sm mx-4"><p className="text-lg mb-4">{message}</p><div className="flex justify-end gap-4"><button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancelar</button><button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">Confirmar</button></div></div></div> ); }
function ChatPage({ activeChat, setActiveChat, currentUser, setView }) { const [conversations, setConversations] = useState([]); const [messages, setMessages] = useState([]); const [newMessage, setNewMessage] = useState(''); const messagesEndRef = useRef(null); const textareaRef = useRef(null); useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; } }, [newMessage]); useEffect(() => { if (!currentUser) return; const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid), orderBy("updatedAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { const convos = snapshot.docs.map(doc => { const data = doc.data(); const recipientId = data.participants.find(p => p !== currentUser.uid); const recipientInfo = data.participantInfo[recipientId] || { displayName: 'Usuario Desconocido' }; return { id: doc.id, ...data, recipientInfo }; }); setConversations(convos); }); return () => unsubscribe(); }, [currentUser]); useEffect(() => { if (activeChat?.id) { const chatRef = doc(db, "chats", activeChat.id); const unsubscribe = onSnapshot(chatRef, (doc) => { if (doc.exists()) { setMessages(doc.data().messages || []); } }); return () => unsubscribe(); } }, [activeChat]); useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]); const handleSendMessage = async (e) => { e.preventDefault(); if (newMessage.trim() === '' || !activeChat || !currentUser) return; const chatRef = doc(db, "chats", activeChat.id); const currentMessages = (await getDoc(chatRef)).data().messages || []; const messageData = { text: newMessage, sender: currentUser.uid, createdAt: new Date() }; await updateDoc(chatRef, { messages: [...currentMessages, messageData], updatedAt: serverTimestamp() }); setNewMessage(''); }; return ( <div className="flex h-[75vh] bg-white rounded-lg shadow-lg"><div className={`w-full md:w-1/3 border-r ${activeChat && 'hidden md:block'}`}><div className="p-4 border-b"><h2 className="text-xl font-bold">Conversaciones</h2></div><ul className="overflow-y-auto h-[calc(75vh-65px)]">{conversations.map(convo => ( <li key={convo.id} onClick={() => setActiveChat(convo)} className={`p-4 cursor-pointer hover:bg-gray-100 flex items-center space-x-3 ${activeChat?.id === convo.id ? 'bg-blue-100' : ''}`}><img src={convo.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${convo.id}`} alt={convo.recipientInfo?.displayName} className="w-10 h-10 rounded-full" /><p className="font-semibold">{convo.recipientInfo?.displayName}</p></li> ))}</ul></div><div className={`w-full md:w-2/3 flex flex-col ${!activeChat && 'hidden md:flex'}`}>{activeChat ? ( <> <div className="p-4 border-b flex items-center"><button onClick={() => setActiveChat(null)} className="md:hidden mr-4 text-blue-600"><ArrowLeftIcon /></button><img src={activeChat.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${activeChat.id}`} alt={activeChat.recipientInfo?.displayName} className="w-10 h-10 rounded-full mr-3" /><h2 className="text-xl font-bold">{activeChat.recipientInfo?.displayName}</h2></div><div className="flex-1 p-4 overflow-y-auto bg-gray-50">{messages.map((msg, index) => ( <div key={index} className={`flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'} mb-4`}><div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}><p className="whitespace-pre-wrap break-words">{msg.text}</p><span className="text-xs opacity-75 mt-1 block text-right">{msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div> ))}<div ref={messagesEndRef} /></div><div className="p-4 border-t bg-white"><form onSubmit={handleSendMessage} className="flex items-end gap-2"><textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 border-gray-300 rounded-lg p-2 resize-none" rows="1" /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg self-end">Enviar</button></form></div> </> ) : ( <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">Selecciona una conversación para empezar a chatear.</div> )}</div></div> ); }
function AdminDashboard() { const [stats, setStats] = useState({ users: 0, listings: 0 }); const [loading, setLoading] = useState(true); useEffect(() => { const fetchStats = async () => { try { const usersColl = collection(db, "users"); const listingsColl = collection(db, "listings"); const userSnapshot = await getCountFromServer(usersColl); const listingSnapshot = await getCountFromServer(listingsColl); setStats({ users: userSnapshot.data().count, listings: listingSnapshot.data().count, }); } catch (error) { console.error("Error fetching stats:", error); } finally { setLoading(false); } }; fetchStats(); }, []); return ( <div className="container mx-auto"><h1 className="text-3xl font-bold mb-8">Panel de Administrador</h1>{loading ? ( <p>Cargando estadísticas...</p> ) : ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-lg shadow-md text-center"><h2 className="text-xl font-semibold text-gray-600">Usuarios Totales</h2><p className="text-4xl font-bold mt-2">{stats.users}</p></div><div className="bg-white p-6 rounded-lg shadow-md text-center"><h2 className="text-xl font-semibold text-gray-600">Anuncios Totales</h2><p className="text-4xl font-bold mt-2">{stats.listings}</p></div></div> )}</div> ); }

// --- NUEVO COMPONENTE DE PÁGINA DE CUENTA ---
function AccountPage({ user, setView, handleLogout }) {
    if (!user) return <p>Cargando perfil...</p>;

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<StarIcon key={i} filled={i <= rating} />);
        }
        return stars;
    };

    const handleNotImplemented = () => {
        alert("Esta función aún no está implementada.");
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:-m-8">
            <div className="p-4 max-w-3xl mx-auto">
                <h1 className="text-xl font-bold text-center py-4 md:hidden">Cuenta</h1>

                {/* --- BLOQUE DE PERFIL DE USUARIO --- */}
                <div className="flex items-center space-x-4 p-4">
                    <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">{user.displayName}</h2>
                        <p className="text-sm text-gray-400">{user.location || 'Ubicación no definida'}</p>
                        <div className="flex items-center mt-1">
                            <div className="flex">{renderStars(user.rating || 0)}</div>
                            <span className="text-xs text-gray-400 ml-2">({user.ratingCount || 0})</span>
                        </div>
                        <div className="flex space-x-4 text-sm mt-1">
                            <span><span className="font-bold">{user.followers || 0}</span> Seguidores</span>
                            <span><span className="font-bold">{user.following || 0}</span> Siguiendo</span>
                        </div>
                    </div>
                </div>

                {/* --- BANNER PREMIUM --- */}
                 <div onClick={handleNotImplemented} className="mx-4 my-4 p-3 bg-gray-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                        <DiamondIcon />
                        <span className="font-semibold">Disfruta los beneficios Premium</span>
                    </div>
                    <ChevronRightIcon />
                </div>

                {/* --- SECCIÓN GUARDADOS --- */}
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Guardados</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<HeartIcon isFavorite={true} className="w-6 h-6 text-gray-400"/>} label="Artículos guardados" onClick={() => setView({ page: 'favorites' })} />
                    </div>
                </div>

                {/* --- SECCIÓN CUENTA --- */}
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Cuenta</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<GearIcon />} label="Ajustes de cuenta" onClick={() => setView({ page: 'accountSettings' })} />
                        <MenuItem icon={<PublicProfileIcon />} label="Perfil público" onClick={handleNotImplemented} />
                        <MenuItem icon={<DollarIcon />} label="Mis Anuncios" onClick={() => setView({ page: 'myListings' })} />
                        <MenuItem icon={<ShieldIcon />} label="Términos y Políticas" onClick={handleNotImplemented} />
                    </div>
                </div>

                {/* --- SECCIÓN AYUDA --- */}
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Ayuda</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<QuestionMarkIcon />} label="Centro de ayuda" onClick={handleNotImplemented} />
                    </div>
                </div>

                {/* --- BOTÓN CERRAR SESIÓN --- */}
                <div className="px-4 mt-8 text-center">
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-semibold">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente de ayuda para los elementos del menú
function MenuItem({ icon, label, onClick }) {
    return (
        <div onClick={onClick} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex items-center space-x-4">
                {icon}
                <span className="text-white">{label}</span>
            </div>
            <ChevronRightIcon />
        </div>
    );
}
