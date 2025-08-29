import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
// ✅ CAMBIO: Se eliminó la importación de categorías desde 'constants'
import { nicaraguaCities } from '../constants'; 
import { SpinnerIcon } from '../components/common/Icons';


// --- ✅ NUEVO: Listas de categorías detalladas para el Marketplace ---

const productCategories = [
    { group: 'Vehículos', label: 'Autos y Camionetas', value: 'autos-camionetas' },
    { group: 'Vehículos', label: 'Motos', value: 'motos' },
    { group: 'Vehículos', label: 'Vehículos Pesados', value: 'vehiculos-pesados' },
    { group: 'Vehículos', label: 'Repuestos y Accesorios', value: 'repuestos-accesorios' },
    { group: 'Bienes Raíces', label: 'Casas (Venta)', value: 'casas-venta' },
    { group: 'Bienes Raíces', label: 'Apartamentos (Alquiler)', value: 'apartamentos-alquiler' },
    { group: 'Bienes Raíces', label: 'Terrenos y Fincas', value: 'terrenos-fincas' },
    { group: 'Electrónica', label: 'Celulares y Tablets', value: 'celulares-tablets' },
    { group: 'Electrónica', label: 'Computadoras y Laptops', value: 'computadoras-laptops' },
    { group: 'Electrónica', label: 'Videojuegos y Consolas', value: 'videojuegos-consolas' },
    { group: 'Electrónica', label: 'Audio y Video', value: 'audio-video' },
    { group: 'Hogar y Muebles', label: 'Muebles', value: 'muebles' },
    { group: 'Hogar y Muebles', label: 'Electrodomésticos', value: 'electrodomesticos' },
    { group: 'Hogar y Muebles', label: 'Jardín y Exteriores', value: 'jardin-exteriores' },
    { group: 'Moda y Belleza', label: 'Ropa y Calzado', value: 'ropa-calzado' },
    { group: 'Moda y Belleza', label: 'Salud y Belleza', value: 'salud-belleza' },
    { group: 'Moda y Belleza', label: 'Joyas y Relojes', value: 'joyas-relojes' },
    { group: 'Empleo y Servicios', label: 'Servicios Profesionales', value: 'servicios-profesionales' },
    { group: 'Ocio y Deportes', label: 'Deportes y Fitness', value: 'deportes-fitness' },
    { group: 'Ocio y Deportes', label: 'Hobbies y Colecciones', value: 'hobbies-colecciones' },
    { group: 'Ocio y Deportes', label: 'Instrumentos Musicales', value: 'instrumentos-musicales' },
    { group: 'Otros', label: 'Mascotas', value: 'mascotas' },
    { group: 'Otros', label: 'Otros', value: 'otros' },
];

const jobCategories = [
    { label: 'Administración y Oficina', value: 'administracion-oficina' },
    { label: 'Atención al Cliente', value: 'atencion-cliente' },
    { label: 'Construcción y Mantenimiento', value: 'construccion-mantenimiento' },
    { label: 'Diseño y Creatividad', value: 'diseno-creatividad' },
    { label: 'Educación', value: 'educacion' },
    { label: 'Finanzas y Contabilidad', value: 'finanzas-contabilidad' },
    { label: 'Informática y Telecomunicaciones', value: 'informatica-telecom' },
    { label: 'Legal y Asesoría', value: 'legal-asesoria' },
    { label: 'Logística y Transporte', value: 'logistica-transporte' },
    { label: 'Marketing y Ventas', value: 'marketing-ventas' },
    { label: 'Recursos Humanos', value: 'recursos-humanos' },
    { label: 'Salud y Medicina', value: 'salud-medicina' },
    { label: 'Turismo y Hotelería', value: 'turismo-hoteleria' },
    { label: 'Otros Empleos', value: 'otros-empleos' },
];

// --------------------------------------------------------------------


// Modal de incentivo para registrarse
const RegistrationIncentiveModal = ({ email, onClose }) => {
    const navigate = useNavigate();

    const handleRegister = () => {
        navigate(`/login?email=${encodeURIComponent(email)}&action=register`);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">¡Tu anuncio ha sido publicado!</h2>
                <p className="text-gray-700 mb-6">
                    Para poder editar tu anuncio, chatear con interesados y recibir notificaciones, 
                    te recomendamos crear una cuenta gratuita.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={handleRegister}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        Crear una cuenta (usando {email})
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
                    >
                        No, gracias
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function PublishPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();

    // Estado del formulario
    const [formData, setFormData] = useState({ title: '', description: '', category: '', price: '', companyName: '', salary: '', make: '', model: '', year: '', mileage: '', applicationContact: '' });
    const [location, setLocation] = useState('');
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [listingType, setListingType] = useState('producto');
    
    // Estado de la UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // Estado para la lógica de Invitado
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);

    const isEditing = !!listingId;
    const isJob = listingType === 'trabajo';
    // ✅ CAMBIO: Usa las nuevas listas de categorías definidas en este archivo
    const categories = isJob ? jobCategories : productCategories;

    useEffect(() => {
        if (isEditing) {
            const fetchListing = async () => {
                setIsLoading(true);
                const docRef = doc(db, "listings", listingId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.authorId !== user?.uid) {
                        console.error("Permiso denegado: No eres el autor de este anuncio.");
                        navigate('/');
                        return;
                    }
                    setFormData({ title: data.title || '', description: data.description || '', category: data.category || '', price: data.price || '', companyName: data.companyName || '', salary: data.salary || '', make: data.make || '', model: data.model || '', year: data.year || '', mileage: data.mileage || '', applicationContact: data.applicationContact || '' });
                    setLocation(data.location || '');
                    setExistingPhotos(data.photos || []);
                    setListingType(data.type);
                } else {
                    console.error("Anuncio no encontrado para editar.");
                    navigate('/');
                }
                setIsLoading(false);
            };
            fetchListing();
        } else {
            setIsLoading(false);
        }
    }, [listingId, isEditing, navigate, user]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim() || formData.title.trim().length < 5) newErrors.title = "El título debe tener al menos 5 caracteres.";
        if (!isJob && !formData.category) newErrors.category = "Debes seleccionar una categoría.";
        if (!location) newErrors.location = "Debes seleccionar una ubicación.";
        if (!formData.description.trim() || formData.description.trim().length < 15) newErrors.description = "La descripción debe ser más detallada (mínimo 15 caracteres).";
        if (!isJob && existingPhotos.length === 0 && newImageFiles.length === 0) newErrors.images = "Debes subir al menos una foto.";
        
        if (!user) {
            if (!guestName.trim()) newErrors.guestName = "Tu nombre es requerido.";
            if (!guestEmail.trim() || !/\S+@\S+\.\S+/.test(guestEmail)) newErrors.guestEmail = "Por favor, ingresa un correo válido.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const currentTotal = existingPhotos.length + newImageFiles.length;
        const maxImages = isJob ? 1 : 12;

        if (currentTotal + filesArray.length > maxImages) {
            setErrors(prev => ({ ...prev, images: `No puedes subir más de ${maxImages} ${isJob ? 'logo' : 'fotos'}.` }));
            return;
        }
        setNewImageFiles(prev => [...prev, ...filesArray]);
    };

    const removeNewImage = (index) => setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    const removeExistingImage = (index) => setExistingPhotos(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const uploadAndGetURLs = async (file, authorId) => {
                const baseName = `${authorId}/${Date.now()}_${file.name}`;
                const fullImg = await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920 });
                const fullImgRef = ref(storage, `listings/${baseName}_full.jpg`);
                await uploadBytes(fullImgRef, fullImg);
                const fullUrl = await getDownloadURL(fullImgRef);

                const thumbImg = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 400 });
                const thumbImgRef = ref(storage, `listings/${baseName}_thumb.jpg`);
                await uploadBytes(thumbImgRef, thumbImg);
                const thumbUrl = await getDownloadURL(thumbImgRef);
                return { full: fullUrl, thumb: thumbUrl };
            };

            const authorId = user ? user.uid : 'guest';
            setUploadProgress({ current: 0, total: newImageFiles.length });
            const newPhotoObjects = [];
            for (let i = 0; i < newImageFiles.length; i++) {
                const urls = await uploadAndGetURLs(newImageFiles[i], authorId);
                newPhotoObjects.push(urls);
                setUploadProgress({ current: i + 1, total: newImageFiles.length });
            }

            const allPhotos = [...existingPhotos, ...newPhotoObjects];
            let listingData = { ...formData, location, type: listingType, photos: allPhotos, status: 'active', updatedAt: serverTimestamp() };
            
            if (!isJob) listingData.price = Number(formData.price) || 0;

            if (user) {
                listingData = { ...listingData, authorId: user.uid, authorName: user.displayName, authorPhotoURL: user.photoURL, isGuest: false };
            } else {
                listingData = { ...listingData, guestName, guestEmail, isGuest: true };
            }

            if (isEditing) {
                const docRef = doc(db, "listings", listingId);
                await updateDoc(docRef, listingData);
                navigate(`/listing/${listingId}`);
            } else {
                const newDocRef = await addDoc(collection(db, "listings"), { ...listingData, createdAt: serverTimestamp(), viewCount: 0, favoriteCount: 0 });
                if (user) {
                    navigate(`/listing/${newDocRef.id}`);
                } else {
                    setShowIncentiveModal(true);
                }
            }
        } catch (error) {
            console.error("Error al publicar anuncio:", error);
            setErrors({ form: "Hubo un error al publicar. Inténtalo más tarde." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <div className="text-center p-10"><SpinnerIcon /> Cargando...</div>;
    if (showIncentiveModal) return <RegistrationIncentiveModal email={guestEmail} onClose={() => navigate('/')} />;

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar Anuncio' : 'Publicar un Anuncio'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué quieres publicar?</label>
                            <div className="flex rounded-md shadow-sm">
                                <button type="button" onClick={() => setListingType('producto')} className={`flex-1 py-2 px-4 rounded-l-md transition ${listingType === 'producto' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Producto</button>
                                <button type="button" onClick={() => setListingType('trabajo')} className={`flex-1 py-2 px-4 rounded-r-md transition ${listingType === 'trabajo' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Trabajo</button>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Anuncio</label>
                        <input type="text" id="title" placeholder={isJob ? "Ej: Se busca Diseñador Gráfico" : "Ej: Vendo Toyota Yaris 2018"} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.title ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {!isJob && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
                                <select id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.category ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Selecciona una categoría</option>
                                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio (Córdobas)</label>
                                <input type="number" id="price" placeholder="Ej: 35000" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 shadow-sm`} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <select id="location" value={location} onChange={e => setLocation(e.target.value)} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.location ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Selecciona un departamento</option>
                            {nicaraguaCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea id="description" placeholder="Describe tu artículo o empleo con todos los detalles..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.description ? 'border-red-500' : 'border-gray-300'}`} rows="5" />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    
                    {!isJob && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Fotos</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"><span>Sube tus archivos</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleImageChange} accept="image/*" /></label><p className="pl-1">o arrástralos aquí</p></div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </div>
                            {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {existingPhotos.map((photo, index) => (<div key={photo.thumb || index} className="relative"><img src={photo.thumb} alt="Vista previa" className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => removeExistingImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">&times;</button></div>))}
                                {newImageFiles.map((file, index) => (<div key={file.name || index} className="relative"><img src={URL.createObjectURL(file)} alt="Vista previa" className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => removeNewImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">&times;</button></div>))}
                            </div>
                        </div>
                    )}

                    {!user && !isEditing && (
                        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg space-y-4">
                            <h3 className="font-bold text-blue-800">Publicar como Invitado</h3>
                            <div>
                                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">Tu Nombre o Apodo</label>
                                <input type="text" id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.guestName ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
                            </div>
                            <div>
                                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700">Tu Correo Electrónico</label>
                                <input type="email" id="guestEmail" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors.guestEmail ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail}</p>}
                            </div>
                        </div>
                    )}
                    
                    {errors.form && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{errors.form}</p>}

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center transition-colors">
                        {isSubmitting ? <><SpinnerIcon /> Procesando...</> : (isEditing ? 'Actualizar Anuncio' : 'Publicar Anuncio')}
                    </button>
                </form>
            </div>
        </div>
    );
}