import React, { useEffect, useReducer, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { z } from 'zod';

import { db, storage } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import { nicaraguaCities } from '../constants';
import { SpinnerIcon } from '../components/common/Icons';


const productCategories = [
    { label: 'Autos y Camionetas', value: 'autos-camionetas' },
    { label: 'Motos', value: 'motos' },
    { label: 'Vehículos Pesados', value: 'vehiculos-pesados' },
    { label: 'Repuestos y Accesorios', value: 'repuestos-accesorios' },
    { label: 'Casas (Venta)', value: 'casas-venta' },
    { label: 'Apartamentos (Alquiler)', value: 'apartamentos-alquiler' },
    { label: 'Terrenos y Fincas', value: 'terrenos-fincas' },
    { label: 'Celulares y Tablets', value: 'celulares-tablets' },
    { label: 'Computadoras y Laptops', value: 'computadoras-laptops' },
    { label: 'Videojuegos y Consolas', value: 'videojuegos-consolas' },
    { label: 'Audio y Video', value: 'audio-video' },
    { label: 'Muebles', value: 'muebles' },
    { label: 'Electrodomésticos', value: 'electrodomesticos' },
    { label: 'Jardín y Exteriores', value: 'jardin-exteriores' },
    { label: 'Ropa y Calzado', value: 'ropa-calzado' },
    { label: 'Salud y Belleza', value: 'salud-belleza' },
    { label: 'Joyas y Relojes', value: 'joyas-relojes' },
    { label: 'Servicios Profesionales', value: 'servicios-profesionales' },
    { label: 'Deportes y Fitness', value: 'deportes-fitness' },
    { label: 'Hobbies y Colecciones', value: 'hobbies-colecciones' },
    { label: 'Instrumentos Musicales', value: 'instrumentos-musicales' },
    { label: 'Mascotas', value: 'mascotas' },
    { label: 'Otros', value: 'otros' },
];

const jobCategories = [
    { label: 'Administración y Oficina', value: 'administracion-oficina' },
    { label: 'Agricultura', value: 'agricultura' },
    { label: 'Corte de Café', value: 'corte-cafe' },
    { label: 'Tabaco', value: 'tabaco' },
    { label: 'Trabajo Agrícola General', value: 'agricola-general' },
    { label: 'Atención al Cliente', value: 'atencion-cliente' },
    { label: 'Construcción y Mantenimiento', value: 'construccion-mantenimiento' },
    { label: 'Diseño y Creatividad', value: 'diseno-creatividad' },
    { label: 'Educación', value: 'educacion' },
    { label: 'Finanzas y Contabilidad', value: 'finanzas-contabilidad' },
    { label: 'Informática y Telecomunicaciones', value: 'informatica-telecom' },
    { label: 'Marketing y Ventas', value: 'marketing-ventas' },
    { label: 'Otros Empleos', value: 'otros-empleos' },
];

// ============================================================================
// ESQUEMA DE VALIDACIÓN (con Zod)
// ============================================================================
const listingSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 5 caracteres."),
    description: z.string().min(10, "La descripción debe ser más detallada."),
    location: z.string().min(1, "Debes seleccionar una ubicación."),
});

// ============================================================================
// HOOK PERSONALIZADO `usePublishForm`
// ============================================================================
const usePublishForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();
    const isEditing = !!listingId;

    const initialState = {
        status: 'loading',
        listingType: 'producto',
        formData: { title: '', description: '', category: '', price: '', make: '', model: '', year: '', mileage: '' },
        location: '',
        newImageFiles: [],
        existingPhotos: [],
        guestInfo: { name: '', email: '' },
        errors: null,
        showIncentiveModal: false,
    };

    const reducer = (state, action) => {
        switch (action.type) {
            case 'LOAD_SUCCESS':
                return { ...state, status: 'idle', ...action.payload };
            case 'FIELD_CHANGE':
                const { name, value } = action.payload;
                if (name.startsWith('guest')) {
                    return { ...state, guestInfo: { ...state.guestInfo, [name.replace('guest', '').toLowerCase()]: value } };
                }
                if (name in state.formData) {
                     return { ...state, formData: { ...state.formData, [name]: value } };
                }
                return { ...state, [name]: value };
            case 'SET_IMAGES':
                return { ...state, newImageFiles: action.payload };
            case 'SET_EXISTING_PHOTOS':
                return { ...state, existingPhotos: action.payload };
            case 'SUBMIT_START':
                return { ...state, status: 'validating', errors: null };
            case 'VALIDATION_ERROR':
                return { ...state, status: 'idle', errors: action.payload };
            case 'SUBMIT_SUCCESS':
                return { ...state, status: 'success', showIncentiveModal: !user };
            case 'SUBMIT_FAILURE':
                return { ...state, status: 'idle', errors: { form: action.payload } };
             case 'SET_STATUS':
                return { ...state, status: action.payload };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (!isEditing) {
            dispatch({ type: 'LOAD_SUCCESS', payload: { status: 'idle' } });
            return;
        }
        const fetchListing = async () => {
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().authorId === user?.uid) {
                const data = docSnap.data();
                dispatch({ type: 'LOAD_SUCCESS', payload: { 
                    formData: { ...initialState.formData, ...data },
                    location: data.location, 
                    existingPhotos: data.photos || [], 
                    listingType: data.type 
                }});
            } else {
                navigate('/');
            }
        };
        fetchListing();
    }, [listingId, isEditing, navigate, user]);

    const handleChange = useCallback((e) => {
        dispatch({ type: 'FIELD_CHANGE', payload: { name: e.target.name, value: e.target.value } });
    }, []);
    
    const setListingType = useCallback((type) => {
        dispatch({ type: 'FIELD_CHANGE', payload: { name: 'listingType', value: type } });
    }, []);

    const setImages = useCallback((files) => {
        dispatch({ type: 'SET_IMAGES', payload: files });
    }, []);
    
    const setExistingPhotos = useCallback((photos) => {
        dispatch({ type: 'SET_EXISTING_PHOTOS', payload: photos });
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        dispatch({ type: 'SUBMIT_START' });

        const dataToValidate = { ...state.formData, location: state.location };
        const validationResult = listingSchema.safeParse(dataToValidate);
        
        if (!validationResult.success) {
            dispatch({ type: 'VALIDATION_ERROR', payload: validationResult.error.flatten().fieldErrors });
            return;
        }

        try {
            dispatch({ type: 'SET_STATUS', payload: 'uploading' });
            const authorId = user ? user.uid : 'guest';
            const uploadPromises = state.newImageFiles.map(file => uploadAndGetURLs(file, authorId));
            const newPhotoObjects = await Promise.all(uploadPromises);
            
            dispatch({ type: 'SET_STATUS', payload: 'saving' });
            const allPhotos = [...state.existingPhotos, ...newPhotoObjects];
            let listingData = { ...state.formData, location: state.location, type: state.listingType, photos: allPhotos, status: 'active', updatedAt: serverTimestamp() };
            
            if (state.listingType !== 'trabajo') listingData.price = Number(state.formData.price) || 0;

            if (user) {
                listingData = { ...listingData, authorId: user.uid, authorName: user.displayName, authorPhotoURL: user.photoURL, isGuest: false };
                if (user.businessId) {
                    listingData.businessId = user.business.id;
                    listingData.businessName = user.business.businessName;
                    listingData.businessSlug = user.business.slug;
                }
            } else {
                listingData = { ...listingData, guestName: state.guestInfo.name, guestEmail: state.guestInfo.email, isGuest: true };
            }
            
            if (isEditing) {
                await updateDoc(doc(db, "listings", listingId), listingData);
                navigate(`/listing/${listingId}`);
            } else {
                const newDocRef = await addDoc(collection(db, "listings"), { ...listingData, createdAt: serverTimestamp(), viewCount: 0, favoriteCount: 0 });
                if (user) navigate(`/listing/${newDocRef.id}`);
                else dispatch({ type: 'SUBMIT_SUCCESS' });
            }
        } catch (error) {
            console.error("Error al publicar:", error);
            dispatch({ type: 'SUBMIT_FAILURE', payload: "Hubo un error inesperado. Inténtalo de nuevo." });
        }
    }, [state, user, isEditing, listingId, navigate]);

    return { state, isEditing, isJob: state.listingType === 'trabajo', categories: state.listingType === 'trabajo' ? jobCategories : productCategories, handleChange, setListingType, setImages, setExistingPhotos, handleSubmit, navigate };
};

// ============================================================================
// COMPONENTES DE UI Y HELPERS
// ============================================================================
const FormField = ({ id, label, error, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error[0]}</p>}
    </div>
);

const VehicleSpecificFields = ({ formData, handleChange, errors }) => (
    <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Detalles del Vehículo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="make" label="Marca" error={errors?.make}>
                <input type="text" id="make" name="make" value={formData.make || ''} onChange={handleChange} placeholder="Ej: Toyota" className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.make ? 'border-red-500' : 'border-gray-300'}`} />
            </FormField>
            <FormField id="model" label="Modelo" error={errors?.model}>
                <input type="text" id="model" name="model" value={formData.model || ''} onChange={handleChange} placeholder="Ej: Hilux" className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.model ? 'border-red-500' : 'border-gray-300'}`} />
            </FormField>
            <FormField id="year" label="Año" error={errors?.year}>
                <input type="number" id="year" name="year" value={formData.year || ''} onChange={handleChange} placeholder="Ej: 2022" className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.year ? 'border-red-500' : 'border-gray-300'}`} />
            </FormField>
            <FormField id="mileage" label="Kilometraje" error={errors?.mileage}>
                <input type="number" id="mileage" name="mileage" value={formData.mileage || ''} onChange={handleChange} placeholder="Ej: 15000" className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.mileage ? 'border-red-500' : 'border-gray-300'}`} />
            </FormField>
        </div>
    </div>
);

const RegistrationIncentiveModal = ({ email, onClose }) => {
    const navigate = useNavigate();
    const handleRegister = () => navigate(`/login?email=${encodeURIComponent(email)}&action=register`);
    return ( <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center"><h2 className="text-2xl font-bold text-green-600 mb-4">¡Tu anuncio ha sido publicado!</h2><p className="text-gray-700 mb-6">Para poder editar tu anuncio, chatear con interesados y recibir notificaciones, te recomendamos crear una cuenta gratuita.</p><div className="space-y-4"><button onClick={handleRegister} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition">Crear cuenta (usando {email})</button><button onClick={onClose} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition">No, gracias</button></div></div></div>);
};

async function uploadAndGetURLs(file, authorId) {
    const baseName = `${authorId}/${Date.now()}_${file.name.split('.')[0]}`;
    const fullImg = await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920 });
    const thumbImg = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 400 });
    const uploadTask = async (img, path) => {
        const imgRef = ref(storage, path);
        await uploadBytes(imgRef, img);
        return getDownloadURL(imgRef);
    };
    const [fullUrl, thumbUrl] = await Promise.all([
        uploadTask(fullImg, `listings/${baseName}_full.jpg`),
        uploadTask(thumbImg, `listings/${baseName}_thumb.jpg`)
    ]);
    return { full: fullUrl, thumb: thumbUrl };
}

// ============================================================================
// EL COMPONENTE PRINCIPAL
// ============================================================================
export default function PublishPage() {
    const { state, isEditing, isJob, categories, handleChange, setListingType, setImages, setExistingPhotos, handleSubmit, navigate } = usePublishForm();
    const { status, formData, location, errors, showIncentiveModal, guestInfo, newImageFiles, existingPhotos } = state;

    if (status === 'loading') {
        return <div className="text-center p-10"><SpinnerIcon /> Cargando...</div>;
    }

    if (showIncentiveModal) {
        return <RegistrationIncentiveModal email={guestInfo.email} onClose={() => navigate('/')} />;
    }

    const isSubmitting = status === 'validating' || status === 'uploading' || status === 'saving';
    
    const removeNewImage = (index) => setImages(newImageFiles.filter((_, i) => i !== index));
    const removeExistingImage = (index) => setExistingPhotos(existingPhotos.filter((_, i) => i !== index));
    
    const vehicleCategories = ['autos-camionetas', 'motos', 'vehiculos-pesados'];
    const showVehicleFields = !isJob && vehicleCategories.includes(formData.category);

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar Anuncio' : 'Publicar un Anuncio'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué quieres publicar?</label>
                            <div className="flex rounded-md shadow-sm">
                               <button type="button" onClick={() => setListingType('producto')} className={`flex-1 py-2 px-4 rounded-l-md transition ${!isJob ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Producto</button>
                               <button type="button" onClick={() => setListingType('trabajo')} className={`flex-1 py-2 px-4 rounded-r-md transition ${isJob ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Trabajo</button>
                            </div>
                        </div>
                    )}
                    
                    <FormField id="title" label="Título del Anuncio" error={errors?.title}>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.title ? 'border-red-500' : 'border-gray-300'}`} />
                    </FormField>

                    <FormField id="category" label={isJob ? "Categoría del Empleo" : "Categoría del Producto"} error={errors?.category}>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.category ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Selecciona una categoría</option>
                            {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </FormField>

                    {showVehicleFields && (
                        <VehicleSpecificFields formData={formData} handleChange={handleChange} errors={errors || {}} />
                    )}

                    <FormField id="description" label="Descripción" error={errors?.description}>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="5" className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.description ? 'border-red-500' : 'border-gray-300'}`} />
                    </FormField>
                    
                    {!isJob && (
                         <FormField id="price" label="Precio (Córdobas)" error={errors?.price}>
                            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.price ? 'border-red-500' : 'border-gray-300'}`} />
                        </FormField>
                    )}

                    <FormField id="location" label="Ubicación" error={errors?.location}>
                        <select id="location" name="location" value={location} onChange={handleChange} className={`mt-1 block w-full border rounded-md p-2 shadow-sm ${errors?.location ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Selecciona un departamento</option>
                            {nicaraguaCities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </FormField>
                    
                    {!isJob && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fotos</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Sube tus archivos</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={(e) => setImages(Array.from(e.target.files))} accept="image/*" /></label><p className="pl-1">o arrástralos aquí</p></div>
                                    <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {existingPhotos.map((photo, index) => (<div key={photo.thumb || index} className="relative"><img src={photo.thumb} alt="Vista previa" className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => removeExistingImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">&times;</button></div>))}
                                {newImageFiles.map((file, index) => (<div key={URL.createObjectURL(file)} className="relative"><img src={URL.createObjectURL(file)} alt="Vista previa" className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => removeNewImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">&times;</button></div>))}
                            </div>
                        </div>
                    )}

                    {errors?.form && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{errors.form}</p>}
                    
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center transition-colors">
                        {isSubmitting ? <><SpinnerIcon /> {status.charAt(0).toUpperCase() + status.slice(1)}...</> : (isEditing ? 'Actualizar Anuncio' : 'Publicar Anuncio')}
                    </button>
                </form>
            </div>
        </div>
    );
}

