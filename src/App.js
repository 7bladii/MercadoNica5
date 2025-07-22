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

// --- LISTA COMPLETA DE CIUDADES DE NICARAGUA ---
const nicaraguaCities = [
  "Acoyapa", "Achuapa", "Altagracia", "Bluefields", "Boaco", "Bonanza", "Buenos Aires",
  "Camoapa", "Cárdenas", "Catarina", "Chichigalpa", "Chinandega", "Cinco Pinos", "Ciudad Antigua",
  "Ciudad Darío", "Ciudad Sandino", "Comalapa", "Condega", "Corinto", "Corn Island", "Cuapa",
  "Diriá", "Diriamba", "Diriomo", "Dolores", "El Almendro", "El Ayote", "El Castillo", "El Coral",
  "El Crucero", "El Cuá", "El Jicaral", "El Jícaro", "El Rama", "El Realejo", "El Rosario",
  "El Sauce", "El Tortuguero", "El Tuma - La Dalia", "El Viejo", "Esquipulas", "Estelí",
  "Granada", "Jalapa", "Jinotepe", "Jinotega", "Juigalpa", "Kukra Hill", "La Concepción",
  "La Concordia", "La Conquista", "La Cruz de Río Grande", "La Libertad", "La Paz Centro",
  "La Paz de Carazo", "La Trinidad", "Laguna de Perlas", "Larreynaga", "Las Sabanas", "León",
  "Macuelizo", "Managua", "Masatepe", "Masaya", "Matagalpa", "Matiguás", "Mateare", "Morrito",
  "Moyogalpa", "Mozonte", "Muelle de los Bueyes", "Mulukukú", "Murra", "Muy Muy", "Nagarote",
  "Nandaime", "Nandasmo", "Nindirí", "Niquinohomo", "Nueva Guinea", "Ocotal", "Palacagüina",
  "Paiwas", "Posoltega", "Potosí", "Prinzapolka", "Pueblo Nuevo",
  "Puerto Cabezas", "Puerto Morazán", "Quezalguaque", "Quilalí", "Rancho Grande", "Río Blanco",
  "Rivas", "Rosita", "San Carlos", "San Dionisio", "San Fernando", "San Francisco de Cuapa",
  "San Francisco del Norte", "San Isidro", "San Jorge", "San José de Bocay", "San José de Cusmapa",
  "San José de los Remates", "San Juan de Limay", "San Juan de Nicaragua", "San Juan de Oriente",
  "San Juan del Río Coco", "San Juan del Sur", "San Lorenzo", "San Lucas", "San Marcos",
  "San Miguelito", "San Nicolás", "San Pedro de Lóvago", "San Pedro del Norte", "San Rafael del Norte",
  "San Rafael del Sur", "San Ramón", "San Sebastián de Yalí", "Santa Lucía", "Santa María",
  "Santa María de Pantasma", "Santa Rosa del Peñón", "Santa Teresa", "Santo Domingo",
  "Santo Tomás", "Santo Tomás del Norte", "Sébaco", "Siuna", "Somotillo", "Somoto", "Telica",
  "Telpaneca", "Terrabona", "Teustepe", "Ticuantepe", "Tipitapa", "Tisma", "Tola", "Totogalpa",
  "Villa El Carmen", "Villa Sandino", "Villanueva", "Waspán", "Wiwilí de Jinotega", "Wiwilí de Nueva Segovia",
  "Yalagüina"
].sort();

// --- CATEGORÍAS PARA PUBLICACIONES ---
const productCategories = [
    "Autos y Vehículos", "Motos", "Bienes Raíces", "Celulares y Tablets", "Computadoras y Laptops",
    "Electrónicos y Audio", "Videojuegos y Consolas", "Hogar y Muebles", "Electrodomésticos",
    "Ropa y Accesorios", "Salud y Belleza", "Deportes y Fitness", "Herramientas", "Construcción",
    "Industria y Oficina", "Mascotas", "Juguetes y Bebés", "Libros y Revistas", "Música y Hobbies", "Otro"
].sort();

const jobCategories = [
    "Administración y Oficina", "Atención al Cliente", "Ventas", "Marketing y Redes Sociales",
    "Informática y Telecomunicaciones", "Diseño y Creatividad", "Ingeniería", "Construcción y Oficios",
    "Logística y Transporte", "Salud y Medicina", "Educación", "Gastronomía y Hotelería", "Otro"
].sort();


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

try { enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED }); } catch (error) { console.error("Error al inicializar la persistencia de Firestore:", error); }

// --- ICONOS ---
const BellIcon = ({ hasNotification }) => ( <div className="relative"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{hasNotification && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>}</div>);
const BriefcaseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const TagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V3z" /></svg>);
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([{ page: 'home' }]);
    const [activeChat, setActiveChat] = useState(null);
    const currentView = history[history.length - 1];
    const setView = (newView) => setHistory(prev => [...prev, newView]);
    const goBack = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };
    const goHome = () => setHistory([{ page: 'home' }]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                } else {
                     await setDoc(userDocRef, { displayName: currentUser.displayName || "Usuario Anónimo", email: currentUser.email, photoURL: currentUser.photoURL, createdAt: serverTimestamp(), plan: "gratuito", isPublic: true });
                    const newUserDoc = await getDoc(userDocRef);
                    setUser({ uid: currentUser.uid, ...newUserDoc.data() });
                }
            } else { setUser(null); }
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

    return ( <div className="bg-gray-100 min-h-screen font-sans"><Header user={user} onLogin={handleLogin} onLogout={handleLogout} setView={setView} goHome={goHome} notificationCount={0} /><main className="p-4 md:p-8 container mx-auto">{history.length > 1 && <BackButton onClick={goBack} />}{renderContent()}</main><Footer /></div> );
}

function BackButton({ onClick }) { return ( <button onClick={onClick} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-4"><ArrowLeftIcon /> Volver</button> ); }
function Header({ user, onLogin, onLogout, setView, goHome, notificationCount }) { return ( <header className="bg-white shadow-md sticky top-0 z-50"><nav className="container mx-auto px-4 py-3 flex justify-between items-center"><div className="flex items-center cursor-pointer" onClick={goHome}><span className="text-2xl font-bold text-blue-600">Mercado<span className="text-sky-500">Nica</span></span></div><div className="flex items-center space-x-4">{user && <div className="cursor-pointer" onClick={() => setView({ page: 'messages' })}><BellIcon hasNotification={notificationCount > 0} /></div>}{user ? (<div className="relative group"><img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-10 h-10 rounded-full cursor-pointer" /><div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block"><span className="block px-4 py-2 text-sm text-gray-700 font-semibold truncate">{user.displayName}</span><a href="#" onClick={() => setView({ page: 'profile' })} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a><a href="#" onClick={onLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a></div></div>) : ( <button onClick={onLogin} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Iniciar Sesión</button> )}</div></nav></header> ); }
function Footer() { return ( <footer className="bg-white mt-12 py-6 border-t"><div className="container mx-auto text-center text-gray-600"><p>&copy; {new Date().getFullYear()} MercadoNica. Todos los derechos reservados.</p></div></footer> ); }
function HomePage({ setView }) { return (<div className="container mx-auto"><div className="bg-white p-6 rounded-lg shadow-lg mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Bienvenido a MercadoNica</h1><p className="text-gray-600 text-lg">¿Qué estás buscando hoy?</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div onClick={() => setView({ page: 'listings', type: 'empleo' })} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center"><BriefcaseIcon /><h2 className="text-2xl font-bold mt-4 text-gray-800">Empleos</h2><p className="text-gray-600 mt-2">Encuentra tu próximo trabajo o publica una vacante.</p></div><div onClick={() => setView({ page: 'listings', type: 'producto' })} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center"><TagIcon /><h2 className="text-2xl font-bold mt-4 text-gray-800">Artículos</h2><p className="text-gray-600 mt-2">Compra y vende productos nuevos o de segunda mano.</p></div></div></div>); }

function ListingsPage({ type, setView, navigateToMessages, currentUser }) {
    const [allListings, setAllListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "listings"), where("type", "==", type), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllListings(listingsData);
            setFilteredListings(listingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching listings:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [type]);

    useEffect(() => {
        let result = allListings;
        if (searchTerm) {
            result = result.filter(listing => listing.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedCity) {
            result = result.filter(listing => listing.location === selectedCity);
        }
        setFilteredListings(result);
    }, [searchTerm, selectedCity, allListings]);

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">{type === 'empleo' ? 'Empleos' : 'Artículos'}</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto" />
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto">
                        <option value="">Todas las Ciudades</option>
                        {nicaraguaCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
                <button onClick={() => setView({ page: 'publish', type: type })} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto">Publicar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading ? <p>Cargando...</p> : filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} navigateToMessages={navigateToMessages} currentUser={currentUser} />)}
            </div>
            {!loading && filteredListings.length === 0 && <p className="text-center text-gray-500 mt-8">No se encontraron anuncios que coincidan con tu búsqueda.</p>}
        </div>
    );
}

function ListingCard({ listing, navigateToMessages, currentUser }) {
    const placeholderUrl = `https://placehold.co/600x400/e2e8f0/64748b?text=${listing.type === 'empleo' ? 'Empleo' : 'Imagen'}`;
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 relative">
            <img src={listing.photos?.[0] || placeholderUrl} alt={listing.title} className="w-full h-48 object-cover" />
            {listing.photos && listing.photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                    <CameraIcon />
                    <span className="ml-1">{listing.photos.length}</span>
                </div>
            )}
            <div className="p-4">
                 <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{listing.category}</span>
                <h3 className="font-bold text-lg mt-2 truncate">{listing.title}</h3>
                <p className="text-gray-600 text-sm">{listing.location}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">{listing.price ? `C$ ${listing.price}` : 'Consultar'}</p>
                {currentUser && currentUser.uid !== listing.userId && (
                    <button onClick={() => navigateToMessages({chatId: [currentUser.uid, listing.userId].sort().join('_'), recipientName: listing.userName, recipientId: listing.userId})} className="w-full mt-4 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 transition">Contactar</button>
                )}
            </div>
        </div>
    );
}

function PublishPage({ type, setView, user }) {
    const [formData, setFormData] = useState({ title: '', description: '', price: '', category: '' });
    const [location, setLocation] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previews, setPreviews] = useState([]);
    const categories = type === 'producto' ? productCategories : jobCategories;

    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (imageFiles.length + filesArray.length > 12) {
                alert("No puedes subir más de 12 fotos.");
                return;
            }
            setImageFiles(prev => [...prev, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { alert("Debes iniciar sesión."); return; }
        
        // Validación diferente para empleos y productos
        if (!formData.title || !location || !formData.category) {
            alert("Por favor, completa el título, categoría y ubicación.");
            return;
        }
        if (type === 'producto' && imageFiles.length === 0) {
            alert("Por favor, sube al menos una imagen para el artículo.");
            return;
        }

        setIsSubmitting(true);
        try {
            let photoURLs = [];
            if (type === 'producto' && imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(file => {
                    const imageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${file.name}`);
                    return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                });
                photoURLs = await Promise.all(uploadPromises);
            }

            await addDoc(collection(db, "listings"), {
                ...formData, type, price: Number(formData.price) || 0, location,
                photos: photoURLs,
                userId: user.uid, userName: user.displayName, createdAt: serverTimestamp(),
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
        <div className="container mx-auto max-w-2xl"><div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Publicar Nuevo {type === 'empleo' ? 'Empleo' : 'Artículo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <input type="text" placeholder="Título del anuncio" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required><option value="">Selecciona una Categoría</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
                <textarea placeholder="Descripción detallada (opcional)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                <input type="number" placeholder="Precio (C$) (Opcional)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                <div><select value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required><option value="">Selecciona una Ciudad</option>{nicaraguaCities.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                
                {type === 'producto' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fotografías (hasta 12)</label>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                                </div>
                            ))}
                            {imageFiles.length < 12 && (
                                <label htmlFor="file-upload" className="flex items-center justify-center w-24 h-24 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500">
                                    <div className="text-center text-gray-500">+<br/>Añadir</div>
                                    <input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple />
                                </label>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-4"><button type="button" onClick={() => setView({ page: 'listings', type: type })} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button><button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300">{isSubmitting ? 'Publicando...' : 'Publicar'}</button></div>
            </form>
        </div></div>
    );
}

function ProfilePage({ user, setUser, setView }) { if (!user) return <p>Cargando perfil...</p>; const menuItems = [ { label: "Ajustes de Cuenta", view: "accountSettings" }, { label: "Mis Ventas", view: "myListings" }, ]; return ( <div className="container mx-auto max-w-2xl"><div className="bg-white p-8 rounded-lg shadow-lg text-center"><img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-24 h-24 rounded-full mx-auto mb-4" /><h2 className="text-2xl font-bold">{user.displayName}</h2><p className="text-gray-500">{user.email}</p></div><div className="bg-white p-4 rounded-lg shadow-lg mt-6"><ul className="divide-y divide-gray-200">{menuItems.map(item => ( <li key={item.view} onClick={() => setView({ page: item.view })} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"><span>{item.label}</span><span>&rarr;</span></li> ))}</ul></div></div> ); }
function AccountSettings({ user, setUser }) { const [displayName, setDisplayName] = useState(user?.displayName || ''); const [isSaving, setIsSaving] = useState(false); const handleSave = async (e) => { e.preventDefault(); setIsSaving(true); try { await updateProfile(auth.currentUser, { displayName }); const userDocRef = doc(db, "users", user.uid); await updateDoc(userDocRef, { displayName }); setUser(prev => ({...prev, displayName})); alert("Perfil actualizado con éxito."); } catch (error) { console.error("Error al actualizar perfil:", error); alert("Hubo un error al actualizar tu perfil."); } setIsSaving(false); }; return ( <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto"><h2 className="text-2xl font-bold mb-6">Ajustes de Cuenta</h2><form onSubmit={handleSave} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /></div><div className="flex justify-end"><button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button></div></form></div> ); }
function MyListings({ user, setView }) { const [myListings, setMyListings] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { if (!user) return; const q = query(collection(db, "listings"), where("userId", "==", user.uid), orderBy("createdAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setMyListings(listingsData); setLoading(false); }); return () => unsubscribe(); }, [user]); return ( <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto"><h2 className="text-2xl font-bold mb-6">Mis Ventas</h2>{loading && <p>Cargando tus anuncios...</p>}{!loading && myListings.length === 0 && <p>No has publicado ningún anuncio todavía.</p>}<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{myListings.map(listing => ( <div key={listing.id} className="border rounded-lg p-2"><img src={listing.photos?.[0]} className="w-full h-32 object-cover rounded-md" /><h3 className="font-semibold truncate mt-2">{listing.title}</h3></div> ))}</div></div> ); }
function ChatPage({ activeChat, setActiveChat, currentUser }) { return (<div>Chat Page Placeholder</div>); }
