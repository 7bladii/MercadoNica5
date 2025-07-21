import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
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
    startAfter,
    getDocs
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';

// La importación del logo está comentada para evitar errores si el archivo no existe.
// import logo from './assets/logo.png';

// --- DATOS DE NICARAGUA (SIN BARRIOS) ---
const nicaraguaData = {
  departamentos: [
    { nombre: "Managua", ciudades: ["Managua", "Ciudad Sandino", "Ticuantepe", "Tipitapa", "El Crucero"] },
    { nombre: "León", ciudades: ["León", "La Paz Centro", "Nagarote", "Telica"] },
    { nombre: "Masaya", ciudades: ["Masaya", "Nindirí", "Tisma", "Catarina", "Niquinohomo"] },
    { nombre: "Granada", ciudades: ["Granada", "Diriomo", "Diriá", "Nandaime"] },
    { nombre: "Estelí", ciudades: ["Estelí", "Condega", "La Trinidad", "Pueblo Nuevo"] },
    // Agrega más departamentos y ciudades según sea necesario
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
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- HABILITAR PERSISTENCIA OFFLINE ---
try {
    enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} catch (error) {
    console.error("Error al inicializar la persistencia de Firestore:", error);
}

// --- ICONOS ---
const BellIcon = ({ hasNotification }) => ( <div className="relative"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{hasNotification && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>}</div>);
const BriefcaseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const TagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V3z" /></svg>);
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([{ page: 'home' }]);
    const [activeChat, setActiveChat] = useState(null);

    const currentView = history[history.length - 1];

    const setView = (newView) => {
        setHistory(prev => [...prev, newView]);
    };

    const goBack = () => {
        if (history.length > 1) {
            setHistory(prev => prev.slice(0, -1));
        }
    };
    
    const goHome = () => {
        setHistory([{ page: 'home' }]);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                } else {
                     await setDoc(userDocRef, {
                        displayName: currentUser.displayName || "Usuario Anónimo",
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        createdAt: serverTimestamp(),
                        plan: "gratuito",
                        isPublic: true // Perfil público por defecto
                    });
                    const newUserDoc = await getDoc(userDocRef);
                    setUser({ uid: currentUser.uid, ...newUserDoc.data() });
                }
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error("Error al iniciar sesión con Google:", error); } };
    const handleLogout = () => { auth.signOut(); goHome(); };
    const navigateToMessages = (chat) => { setActiveChat(chat); setView({ page: 'messages' }); };

    const renderContent = () => {
        switch (currentView.page) {
            case 'listings': return <ListingsPage type={currentView.type} setView={setView} navigateToMessages={navigateToMessages} currentUser={user} />;
            case 'publish': return <PublishPage type={currentView.type} setView={setView} user={user} />;
            case 'messages': return <ChatPage activeChat={activeChat} setActiveChat={setActiveChat} currentUser={user} />;
            case 'profile': return <ProfilePage user={user} setUser={setUser} setView={setView} />;
            case 'accountSettings': return <AccountSettings user={user} setUser={setUser} />;
            case 'myListings': return <MyListings user={user} setView={setView} />;
            default: return <HomePage setView={setView} />;
        }
    };

    return ( 
        <div className="bg-gray-100 min-h-screen font-sans">
            <Header user={user} onLogin={handleLogin} onLogout={handleLogout} setView={setView} goHome={goHome} notificationCount={0} />
            <main className="p-4 md:p-8 container mx-auto">
                {history.length > 1 && <BackButton onClick={goBack} />}
                {renderContent()}
            </main>
            <Footer />
        </div> 
    );
}

function BackButton({ onClick }) {
    return (
        <button onClick={onClick} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-4">
            <ArrowLeftIcon /> Volver
        </button>
    );
}

function Header({ user, onLogin, onLogout, setView, goHome, notificationCount }) {
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center cursor-pointer" onClick={goHome}>
                    {/* <img src={logo} alt="Logo MercadoNica" className="h-10 mr-2" /> */}
                    <span className="text-2xl font-bold text-blue-600">Mercado<span className="text-sky-500">Nica</span></span>
                </div>
                <div className="flex items-center space-x-4">
                    {user && <div className="cursor-pointer" onClick={() => setView({ page: 'messages' })}><BellIcon hasNotification={notificationCount > 0} /></div>}
                    {user ? (
                        <div className="relative group">
                            <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-10 h-10 rounded-full cursor-pointer" />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                                <span className="block px-4 py-2 text-sm text-gray-700 font-semibold truncate">{user.displayName}</span>
                                <a href="#" onClick={() => setView({ page: 'profile' })} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                                <a href="#" onClick={onLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a>
                            </div>
                        </div>
                    ) : ( <button onClick={onLogin} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Iniciar Sesión</button> )}
                </div>
            </nav>
        </header>
    );
}

function Footer() {
    return (
        <footer className="bg-white mt-12 py-6 border-t">
            <div className="container mx-auto text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} MercadoNica. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}

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
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    const fetchListings = async (afterDoc = null) => {
        setLoading(true);
        try {
            const listingsRef = collection(db, "listings");
            let q = query(listingsRef, where("type", "==", type), orderBy("createdAt", "desc"), limit(8));
            if (afterDoc) {
                q = query(listingsRef, where("type", "==", type), orderBy("createdAt", "desc"), startAfter(afterDoc), limit(8));
            }
            const documentSnapshots = await getDocs(q);
            const newlistings = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            
            setListings(prev => afterDoc ? [...prev, ...newlistings] : newlistings);
            setLastDoc(lastVisible);
            if (documentSnapshots.docs.length < 8) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching listings:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchListings();
    }, [type]);

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{type === 'empleo' ? 'Empleos' : 'Artículos'}</h1>
                <button onClick={() => setView({ page: 'publish', type: type })} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Publicar {type === 'empleo' ? 'Empleo' : 'Artículo'}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map(listing => <ListingCard key={listing.id} listing={listing} navigateToMessages={navigateToMessages} currentUser={currentUser} />)}
            </div>
            {loading && <p className="text-center mt-8">Cargando...</p>}
            {hasMore && !loading && listings.length > 0 && (
                <div className="text-center mt-8">
                    <button onClick={() => fetchListings(lastDoc)} className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800">Cargar Más</button>
                </div>
            )}
            {!loading && listings.length === 0 && <p className="text-center text-gray-500 mt-8">No hay anuncios en esta categoría.</p>}
        </div>
    );
}

function ListingCard({ listing, navigateToMessages, currentUser }) {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 relative">
            <img src={listing.photos?.[0] || 'https://placehold.co/600x400/e2e8f0/64748b?text=Imagen'} alt={listing.title} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg mt-2 truncate">{listing.title}</h3>
                <p className="text-gray-600 text-sm">{listing.location.depto}, {listing.location.ciudad}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">{listing.price ? `C$ ${listing.price}` : 'Consultar'}</p>
                {currentUser && currentUser.uid !== listing.userId && (
                    <button onClick={() => navigateToMessages({chatId: [currentUser.uid, listing.userId].sort().join('_'), recipientName: listing.userName, recipientId: listing.userId})} className="w-full mt-4 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 transition">Contactar</button>
                )}
            </div>
        </div>
    );
}

function PublishPage({ type, setView, user }) {
    const [formData, setFormData] = useState({ title: '', description: '', price: '' });
    const [location, setLocation] = useState({ depto: '', ciudad: '' });
    const [ciudades, setCiudades] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (location.depto) {
            const selectedDept = nicaraguaData.departamentos.find(d => d.nombre === location.depto);
            setCiudades(selectedDept ? selectedDept.ciudades.map(c => c.nombre || c) : []);
            setLocation(l => ({ ...l, ciudad: '' }));
        }
    }, [location.depto]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { alert("Debes iniciar sesión."); return; }
        if (!formData.title || !formData.description || !location.depto || !location.ciudad || !imageFile) {
            alert("Por favor, completa todos los campos y sube una imagen.");
            return;
        }
        setIsSubmitting(true);
        try {
            const imageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const photoURL = await getDownloadURL(imageRef);
            await addDoc(collection(db, "listings"), {
                ...formData,
                type,
                price: Number(formData.price) || 0,
                location,
                photos: [photoURL],
                userId: user.uid,
                userName: user.displayName,
                createdAt: serverTimestamp(),
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
                <h2 className="text-2xl font-bold mb-6 text-center">Publicar Nuevo {type === 'empleo' ? 'Empleo' : 'Artículo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    <textarea placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    <input type="number" placeholder="Precio (C$)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    <div><select value={location.depto} onChange={e => setLocation({...location, depto: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required><option value="">Departamento</option>{nicaraguaData.departamentos.map(d=><option key={d.nombre}>{d.nombre}</option>)}</select></div>
                    <div><select value={location.ciudad} onChange={e => setLocation({...location, ciudad: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={!location.depto}><option value="">Ciudad</option>{ciudades.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fotografía</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {preview ? <img src={preview} alt="Vista previa" className="mx-auto h-24 w-auto" /> : <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><p>Sube un archivo</p><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" /></label></div>
                                <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4"><button type="button" onClick={() => setView({ page: 'listings', type: type })} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button><button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300">{isSubmitting ? 'Publicando...' : 'Publicar'}</button></div>
                </form>
            </div>
        </div>
    );
}

// --- COMPONENTES PARA EL PERFIL ---
function ProfilePage({ user, setUser, setView }) {
    if (!user) return <p>Cargando perfil...</p>;

    const menuItems = [
        { label: "Ajustes de Cuenta", view: "accountSettings" },
        { label: "Mis Ventas", view: "myListings" },
        // { label: "Privacidad", view: "privacySettings" }, // Placeholder for future
        // { label: "Mis Compras", view: "myPurchases" }, // Placeholder for future
    ];

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-24 h-24 rounded-full mx-auto mb-4" />
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg mt-6">
                <ul className="divide-y divide-gray-200">
                    {menuItems.map(item => (
                        <li key={item.view} onClick={() => setView({ page: item.view })} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                            <span>{item.label}</span>
                            <span>&rarr;</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function AccountSettings({ user, setUser }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile(auth.currentUser, { displayName });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { displayName });
            setUser(prev => ({...prev, displayName}));
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
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
            </form>
        </div>
    );
}

function MyListings({ user, setView }) {
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "listings"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyListings(listingsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Mis Ventas</h2>
            {loading && <p>Cargando tus anuncios...</p>}
            {!loading && myListings.length === 0 && <p>No has publicado ningún anuncio todavía.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myListings.map(listing => (
                    <div key={listing.id} className="border rounded-lg p-2">
                        <img src={listing.photos?.[0]} className="w-full h-32 object-cover rounded-md" />
                        <h3 className="font-semibold truncate mt-2">{listing.title}</h3>
                        {/* Aquí puedes agregar botones para editar o eliminar */}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChatPage({ activeChat, setActiveChat, currentUser }) { return (<div>Chat Page Placeholder</div>); }
