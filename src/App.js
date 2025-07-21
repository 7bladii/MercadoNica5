import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider
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
    CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

// La importación del logo está comentada para evitar errores si el archivo no existe.
// import logo from './assets/logo.png';

// --- DATOS DE NICARAGUA (SIN BARRIOS) ---
const nicaraguaData = {
  departamentos: [
    { nombre: "Boaco", ciudades: ["Boaco", "Camoapa", "San José de los Remates", "San Lorenzo", "Santa Lucía", "Teustepe"] },
    { nombre: "Carazo", ciudades: ["Diriamba", "Dolores", "El Rosario", "Jinotepe", "La Conquista", "La Paz de Carazo", "San Marcos", "Santa Teresa"] },
    { nombre: "Chinandega", ciudades: ["Chichigalpa", "Chinandega", "Cinco Pinos", "Corinto", "El Realejo", "El Viejo", "Posoltega", "Puerto Morazán", "San Francisco del Norte", "San Pedro del Norte", "Santo Tomás del Norte", "Somotillo", "Villanueva"] },
    { nombre: "Chontales", ciudades: ["Acoyapa", "Comalapa", "Cuapa", "El Coral", "Juigalpa", "La Libertad", "San Pedro de Lóvago", "Santo Domingo", "Santo Tomás", "Villa Sandino"] },
    { nombre: "Costa Caribe Norte", ciudades: ["Bonanza", "Mulukukú", "Prinzapolka", "Puerto Cabezas", "Rosita", "Siuna", "Waslala", "Waspán"] },
    { nombre: "Costa Caribe Sur", ciudades: ["Bluefields", "Corn Island", "Desembocadura de Río Grande", "El Ayote", "El Rama", "El Tortuguero", "Kukra Hill", "La Cruz de Río Grande", "Laguna de Perlas", "Muelle de los Bueyes", "Nueva Guinea", "Paiwas"] },
    { nombre: "Estelí", ciudades: ["Condega", "Estelí", "La Trinidad", "Pueblo Nuevo", "San Juan de Limay", "San Nicolás"] },
    { nombre: "Granada", ciudades: ["Diriá", "Diriomo", "Granada", "Nandaime"] },
    { nombre: "Jinotega", ciudades: ["El Cuá", "Jinotega", "La Concordia", "San José de Bocay", "San Rafael del Norte", "San Sebastián de Yalí", "Santa María de Pantasma", "Wiwilí de Jinotega"] },
    { nombre: "León", ciudades: ["Achuapa", "El Jicaral", "El Sauce", "La Paz Centro", "Larreynaga", "León", "Nagarote", "Quezalguaque", "Santa Rosa del Peñón", "Telica"] },
    { nombre: "Madriz", ciudades: ["Las Sabanas", "Palacagüina", "San José de Cusmapa", "San Juan del Río Coco", "San Lucas", "Somoto", "Telpaneca", "Totogalpa", "Yalagüina"] },
    { nombre: "Managua", ciudades: ["Ciudad Sandino", "El Crucero", "Managua", "Mateare", "San Francisco Libre", "San Rafael del Sur", "Ticuantepe", "Tipitapa", "Villa El Carmen"] },
    { nombre: "Masaya", ciudades: ["Catarina", "La Concepción", "Masatepe", "Masaya", "Nandasmo", "Nindirí", "Niquinohomo", "San Juan de Oriente", "Tisma"] },
    { nombre: "Matagalpa", ciudades: ["Ciudad Darío", "El Tuma - La Dalia", "Esquipulas", "Matagalpa", "Matiguás", "Muy Muy", "Rancho Grande", "Río Blanco", "San Dionisio", "San Isidro", "San Ramón", "Sébaco", "Terrabona"] },
    { nombre: "Nueva Segovia", ciudades: ["Ciudad Antigua", "Dipilto", "El Jícaro", "Jalapa", "Macuelizo", "Mozonte", "Murra", "Ocotal", "Quilalí", "San Fernando", "Santa María", "Wiwilí de Nueva Segovia"] },
    { nombre: "Río San Juan", ciudades: ["El Almendro", "El Castillo", "Morrito", "San Carlos", "San Juan de Nicaragua", "San Miguelito"] },
    { nombre: "Rivas", ciudades: ["Altagracia", "Belén", "Buenos Aires", "Cárdenas", "Moyogalpa", "Potosí", "Rivas", "San Jorge", "San Juan del Sur", "Tola"] }
  ]
};

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyChYTYsSLFfWsk2UVm6BsldnaGw42AwDC4",
  authDomain: "mecardonica.firebaseapp.com",
  projectId: "mecardonica",
  storageBucket: "mecardonica.appspot.com",
  messagingSenderId: "980886283273",
  appId: "1:980886283273:web:17d0586151cc5c96d944d8",
  measurementId: "G-RRQL5YD0V9"
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- HABILITAR PERSISTENCIA OFFLINE ---
try {
    enableIndexedDbPersistence(db, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
    .then(() => console.log("Persistencia offline habilitada."))
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("La persistencia offline falló. Múltiples pestañas abiertas pueden causar esto.");
        } else if (err.code === 'unimplemented') {
            console.warn("El navegador actual no soporta la persistencia offline.");
        }
    });
} catch (error) {
    console.error("Error al inicializar la persistencia de Firestore:", error);
}


// --- ICONOS ---
const BellIcon = ({ hasNotification }) => (
    <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {hasNotification && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>}
    </div>
);
const StarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V3z" /></svg>;

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState({ page: 'home' }); 
    const [activeChat, setActiveChat] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Manejadores para el estado de la conexión
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        displayName: currentUser.displayName || "Usuario Anónimo",
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        createdAt: serverTimestamp(),
                        plan: "gratuito"
                    });
                }
                setUser({ ...currentUser, ...userDoc.data() });
            } else {
                signInAnonymously(auth).catch(error => console.error("Error en login anónimo:", error));
            }
        });
        
        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const newNotifications = snapshot.docs.reduce((acc, doc) => {
                    const chat = doc.data();
                    const lastMessage = chat.messages?.[chat.messages.length - 1];
                    if (lastMessage?.sender !== user.uid && !lastMessage?.read) {
                        acc.push({ id: doc.id, ...chat });
                    }
                    return acc;
                }, []);
                setNotifications(newNotifications);
            }, (error) => console.error("Error en listener de notificaciones:", error));
            return () => unsubscribe();
        }
    }, [user]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error al iniciar sesión con Google:", error);
        }
    };

    const handleLogout = () => {
        auth.signOut();
        setUser(null);
        setView({ page: 'home' });
    };

    const navigateToMessages = (chat) => {
        setActiveChat(chat);
        setView({ page: 'messages' });
    };

    const renderContent = () => {
        switch (view.page) {
            case 'listings':
                return <ListingsPage type={view.type} setView={setView} navigateToMessages={navigateToMessages} currentUser={user} />;
            case 'publish':
                return <PublishPage type={view.type} setView={setView} user={user} />;
            case 'messages':
                return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} />;
            case 'profile':
                return <ProfilePage setView={setView} />;
            default:
                return <HomePage setView={setView} />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Header user={user} onLogin={handleLogin} onLogout={handleLogout} setView={setView} notificationCount={notifications.length} />
            {!isOnline && <OfflineWarning />}
            <main className="p-4 md:p-8">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
}

// --- COMPONENTES DE CABECERA Y PIE DE PÁGINA ---
function Header({ user, onLogin, onLogout, setView, notificationCount }) {
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center cursor-pointer" onClick={() => setView({ page: 'home' })}>
                    <span className="text-2xl font-bold text-blue-600">
                        Mercado<span className="text-sky-500">Nica</span>
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="cursor-pointer" onClick={() => setView({ page: 'messages' })}>
                        <BellIcon hasNotification={notificationCount > 0} />
                    </div>
                    {user && user.email ? (
                        <div className="relative group">
                            <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-10 h-10 rounded-full cursor-pointer" />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                                <span className="block px-4 py-2 text-sm text-gray-700 font-semibold truncate">{user.displayName}</span>
                                <a href="#" onClick={() => setView({ page: 'profile' })} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                                <a href="#" onClick={onLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onLogin} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                            Iniciar Sesión
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}

function OfflineWarning() {
    return (
        <div className="bg-yellow-400 text-center py-2 text-yellow-900 font-semibold">
            Estás sin conexión. Algunas funciones pueden estar limitadas.
        </div>
    );
}

function Footer() {
    return (
        <footer className="bg-white mt-12 py-6 border-t">
            <div className="container mx-auto text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} MercadoNica. Todos los derechos reservados.</p>
                <p>Una plataforma para el mercado nicaragüense.</p>
            </div>
        </footer>
    );
}

// --- COMPONENTES DE PÁGINA ---
function HomePage({ setView }) {
    return (
        <div className="container mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Bienvenido a MercadoNica</h1>
                <p className="text-gray-600 text-lg">¿Qué estás buscando hoy?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => setView({ page: 'listings', type: 'empleo' })} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center">
                    <BriefcaseIcon />
                    <h2 className="text-2xl font-bold mt-4 text-gray-800">Empleos</h2>
                    <p className="text-gray-600 mt-2">Encuentra tu próximo trabajo o publica una vacante.</p>
                </div>
                <div onClick={() => setView({ page: 'listings', type: 'producto' })} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center">
                    <TagIcon />
                    <h2 className="text-2xl font-bold mt-4 text-gray-800">Artículos</h2>
                    <p className="text-gray-600 mt-2">Compra y vende productos nuevos o de segunda mano.</p>
                </div>
            </div>
        </div>
    );
}

function ListingsPage({ type, setView, navigateToMessages, currentUser }) {
    const [listings, setListings] = useState([]);
    const pageTitle = type === 'empleo' ? 'Empleos Disponibles' : 'Artículos en Venta';
    const buttonText = type === 'empleo' ? 'Publicar Empleo' : 'Vender Artículo';

    useEffect(() => {
        const q = query(collection(db, "listings"), where("type", "==", type), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setListings(listingsData);
        }, (error) => console.error(`Error al obtener ${type}s:`, error));
        return () => unsubscribe();
    }, [type]);

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{pageTitle}</h1>
                <button onClick={() => setView({ page: 'publish', type: type })} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold">
                    {buttonText}
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.length > 0 ? (
                    listings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} navigateToMessages={navigateToMessages} currentUser={currentUser} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">No hay {type}s publicados por el momento.</p>
                )}
            </div>
        </div>
    );
}

function ListingCard({ listing, navigateToMessages, currentUser }) {
    const handleContact = async () => {
        if (!currentUser || !currentUser.email) {
            alert("Por favor, inicia sesión para contactar al vendedor.");
            return;
        }
        if (currentUser.uid === listing.userId) {
            alert("No puedes enviarte un mensaje a ti mismo.");
            return;
        }

        const chatId = [currentUser.uid, listing.userId].sort().join('_');
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            await setDoc(chatRef, {
                participants: [currentUser.uid, listing.userId],
                participantInfo: {
                    [currentUser.uid]: { displayName: currentUser.displayName, photoURL: currentUser.photoURL },
                    [listing.userId]: { displayName: listing.userName, photoURL: listing.userPhotoURL }
                },
                messages: [],
                createdAt: serverTimestamp()
            });
        }
        
        const recipientInfo = chatDoc.exists() ? chatDoc.data().participantInfo[listing.userId] : { displayName: listing.userName, photoURL: listing.userPhotoURL };

        navigateToMessages({
            chatId: chatId,
            recipientName: recipientInfo.displayName,
            recipientId: listing.userId
        });
    };
    
    const cardClass = listing.isFeatured ? "border-4 border-yellow-400" : "border border-gray-200";

    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 relative ${cardClass}`}>
            {listing.isFeatured && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
                    <StarIcon className="w-4 h-4 mr-1" /> DESTACADO
                </div>
            )}
            <img src={listing.photos?.[0] || 'https://placehold.co/600x400/e2e8f0/64748b?text=Imagen'} alt={listing.title} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg mt-2 truncate">{listing.title}</h3>
                <p className="text-gray-600 text-sm">{listing.location.depto}, {listing.location.ciudad}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">
                    {listing.price ? `C$ ${listing.price}` : (listing.type === 'empleo' ? 'Salario a convenir' : 'Precio a convenir')}
                </p>
                {currentUser && currentUser.uid !== listing.userId && (
                    <button onClick={handleContact} className="w-full mt-4 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 transition">
                        Contactar
                    </button>
                )}
            </div>
        </div>
    );
}

function PublishPage({ type, setView, user }) {
    const [formData, setFormData] = useState({ title: '', description: '', price: '' });
    const [location, setLocation] = useState({ depto: '', ciudad: '' });
    const [ciudades, setCiudades] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pageTitle = type === 'empleo' ? 'Publicar Nuevo Empleo' : 'Vender un Artículo';
    const priceLabel = type === 'empleo' ? 'Salario (Opcional)' : 'Precio (C$)';

    useEffect(() => {
        if (location.depto) {
            const selectedDept = nicaraguaData.departamentos.find(d => d.nombre === location.depto);
            setCiudades(selectedDept ? selectedDept.ciudades.map(c => c.nombre || c) : []);
            setLocation(l => ({ ...l, ciudad: '' }));
        } else {
            setCiudades([]);
        }
    }, [location.depto]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setLocation(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.email) {
            alert("Debes iniciar sesión para publicar.");
            return;
        }
        if (!formData.title || !formData.description || !location.depto || !location.ciudad) {
            alert("Por favor, completa todos los campos requeridos.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "listings"), {
                ...formData,
                type,
                price: Number(formData.price) || 0,
                location: location,
                photos: ['https://placehold.co/600x400/e2e8f0/64748b?text=Anuncio'],
                userId: user.uid,
                userName: user.displayName,
                userPhotoURL: user.photoURL,
                isFeatured: false,
                createdAt: serverTimestamp(),
                stats: { views: 0, clicks: 0, favorites: 0 }
            });
            alert("¡Anuncio publicado con éxito!");
            setView({ page: 'listings', type: type });
        } catch (error) {
            console.error("Error al publicar:", error);
            alert("Hubo un error al publicar tu anuncio.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">{pageTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título del Anuncio</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{priceLabel}</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Dejar en blanco si es a convenir" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Departamento</label>
                            <select name="depto" value={location.depto} onChange={handleLocationChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                                <option value="">Seleccionar...</option>
                                {nicaraguaData.departamentos.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ciudad / Municipio</label>
                            <select name="ciudad" value={location.ciudad} onChange={handleLocationChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={!location.depto}>
                                <option value="">Seleccionar...</option>
                                {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => setView({ page: 'listings', type: type })} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                            {isSubmitting ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ChatPage({ activeChat, setActiveChat, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (activeChat?.chatId) {
            const chatRef = doc(db, "chats", activeChat.chatId);
            const unsubscribe = onSnapshot(chatRef, (doc) => {
                if (doc.exists()) {
                    setMessages(doc.data().messages || []);
                }
            });
            return () => unsubscribe();
        }
    }, [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !activeChat || !currentUser) return;

        const chatRef = doc(db, "chats", activeChat.chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
            const currentMessages = chatDoc.data().messages || [];
            const messageData = { text: newMessage, sender: currentUser.uid, createdAt: new Date(), read: false };
            await updateDoc(chatRef, { messages: [...currentMessages, messageData], updatedAt: serverTimestamp() });
        }
        setNewMessage('');
    };

    if (!activeChat) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-700">Mis Mensajes</h2>
                <p className="text-gray-500 mt-2">Aquí aparecerán tus conversaciones.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-3xl bg-white rounded-lg shadow-lg" style={{ height: '70vh' }}>
            <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center">
                    <button onClick={() => setActiveChat(null)} className="mr-4 text-blue-600 hover:text-blue-800">&larr; Volver</button>
                    <h2 className="text-xl font-bold">Chat con {activeChat.recipientName}</h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p>{msg.text}</p>
                                <span className="text-xs opacity-75 mt-1 block text-right">
                                    {msg.createdAt?.seconds && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 border-gray-300 rounded-l-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700">Enviar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function ProfilePage({ setView }) {
    return (
        <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Mi Perfil</h2>
            <p className="text-gray-600 mb-8">Aquí podrás ver tus anuncios, estadísticas y plan actual. (En construcción)</p>
            <button onClick={() => setView({ page: 'home' })} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Volver al Inicio</button>
        </div>
    );
}
