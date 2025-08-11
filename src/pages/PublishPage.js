import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logEvent } from 'firebase/analytics';
import imageCompression from 'browser-image-compression';
// ✅ CORRECCIÓN 1: Importar la FUNCIÓN para obtener analytics.
import { db, storage, getFirebaseAnalytics } from '../firebase/config'; 
import { jobCategories, productCategories, nicaraguaCities } from '../constants';
import { SpinnerIcon } from '../components/common/Icons';

export default function PublishPage({ type, setView, user, listingId }) {
    const isJob = type === 'trabajo';
    const [formData, setFormData] = useState({ title: '', description: '', category: '', price: '', companyName: '', salary: '', make: '', model: '', year: '', mileage: '', applicationContact: '' });
    const [location, setLocation] = useState('');
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isHighlighted, setIsHighlighted] = useState(false);
    // ✅ CORRECCIÓN 2: Añadir estado para la instancia de analytics.
    const [analytics, setAnalytics] = useState(null);

    const categories = isJob ? jobCategories : productCategories;
    const isEditing = !!listingId;

    // ✅ CORRECCIÓN 3: Hook para inicializar analytics de forma asíncrona.
    useEffect(() => {
        const initializeAnalytics = async () => {
            const analyticsInstance = await getFirebaseAnalytics();
            if (analyticsInstance) {
                setAnalytics(analyticsInstance);
            }
        };
        initializeAnalytics();
    }, []); // Se ejecuta solo una vez al montar el componente.

    useEffect(() => {
        if (isEditing) {
            const fetchListing = async () => {
                const docRef = doc(db, "listings", listingId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({ title: data.title, description: data.description, category: data.category || '', price: data.price || '', companyName: data.companyName || '', salary: data.salary || '', make: data.make || '', model: data.model || '', year: data.year || '', mileage: data.mileage || '', applicationContact: data.applicationContact || '' });
                    setLocation(data.location);
                    setExistingPhotos(data.photos || []);
                    setIsHighlighted(data.isHighlighted || false);
                }
            };
            fetchListing();
        }
    }, [listingId, isEditing]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "El título es obligatorio.";
        else if (formData.title.trim().length < 5) newErrors.title = "El título debe tener al menos 5 caracteres.";
        if (!isJob && !formData.category) newErrors.category = "Debes seleccionar una categoría.";
        if (!location) newErrors.location = "Debes seleccionar una ubicación.";
        if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria.";
        else if (formData.description.trim().length < 15) newErrors.description = "La descripción debe ser más detallada (mínimo 15 caracteres).";
        if (!isJob && existingPhotos.length === 0 && newImageFiles.length === 0) newErrors.images = "Debes subir al menos una foto para el artículo.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const currentImagesCount = existingPhotos.length + newImageFiles.length;
            const maxImages = isJob ? 1 : 12;
            if (currentImagesCount + filesArray.length > maxImages) {
                setErrors(prev => ({ ...prev, images: `No puedes subir más de ${maxImages} ${isJob ? 'logo/foto' : 'fotos'}.` }));
                return;
            }
            const validFiles = [];
            for (const file of filesArray) {
                if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, images: `La imagen "${file.name}" es muy grande (máx 5MB).` })); continue; }
                if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { setErrors(prev => ({ ...prev, images: `El archivo "${file.name}" no es una imagen válida.` })); continue; }
                validFiles.push(file);
            }
            if (isJob) { setNewImageFiles(validFiles); } else { setNewImageFiles(prev => [...prev, ...validFiles]); }
            if (errors.images) setErrors(prev => ({ ...prev, images: null }));
        }
    };

    const removeNewImage = (index) => { setNewImageFiles(prev => prev.filter((_, i) => i !== index)); };
    const removeExistingImage = (index) => { setExistingPhotos(prev => prev.filter((_, i) => i !== index)); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { setErrors({ form: "Debes iniciar sesión para publicar." }); return; }
        if (!validateForm()) return;
        setIsSubmitting(true);
        setErrors({});
        try {
            const uploadAndGetURLs = async (file) => {
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2, 8);
                const baseName = `${user.uid}/${timestamp}_${randomId}_${file.name}`;
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
            setUploadProgress({ current: 0, total: newImageFiles.length });
            const newPhotoObjects = [];
            for (let i = 0; i < newImageFiles.length; i++) {
                const file = newImageFiles[i];
                const urls = await uploadAndGetURLs(file);
                newPhotoObjects.push(urls);
                setUploadProgress({ current: i + 1, total: newImageFiles.length });
            }
            const allPhotos = [...existingPhotos, ...newPhotoObjects];
            const listingData = { title: formData.title, description: formData.description, category: formData.category, location, type, photos: allPhotos, userId: user.uid, userName: user.displayName, userPhotoURL: user.photoURL, isVerified: user.isVerified || false, isHighlighted: user.isPremium ? isHighlighted : false, status: 'active', updatedAt: serverTimestamp(), };
            if (isJob) {
                listingData.companyName = formData.companyName;
                listingData.salary = formData.salary;
                listingData.applicationContact = formData.applicationContact;
            } else {
                listingData.price = Number(formData.price) || 0;
                listingData.make = formData.make;
                listingData.model = formData.model;
                listingData.year = formData.year;
                listingData.mileage = formData.mileage;
            }
            if (isEditing) {
                const docRef = doc(db, "listings", listingId);
                await updateDoc(docRef, listingData);
            } else {
                const newDocRef = await addDoc(collection(db, "listings"), { ...listingData, createdAt: serverTimestamp(), viewCount: 0, favoriteCount: 0, });
                // ✅ CORRECCIÓN 4: Usar la instancia de analytics del estado y verificar que no sea null.
                if (analytics) {
                    logEvent(analytics, 'publish_listing', { 
                        user_id: user.uid, 
                        listing_id: newDocRef.id, 
                        listing_type: type, 
                        category: listingData.category, 
                        location: listingData.location, 
                    });
                }
            }
            setView({ page: 'listings', type: type });
        } catch (error) {
            console.error("Error al publicar:", error);
            setErrors({ form: "Hubo un error al publicar. Revisa tu conexión o inténtalo más tarde." });
        } finally {
            setIsSubmitting(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const showVehicleFields = formData.category === 'Autos y Vehículos' || formData.category === 'Motos';
    const allPreviews = [...existingPhotos.map((photo, index) => ({ type: 'existing', url: photo.thumb, index })), ...newImageFiles.map((file, index) => ({ type: 'new', url: URL.createObjectURL(file), index }))];

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar' : 'Publicar'} {isJob ? 'Empleo' : 'Artículo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.form && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{errors.form}</p>}
                    <div>
                        <input type="text" placeholder={isJob ? "Título del Puesto" : "Título del anuncio"} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.title ? 'border-red-500' : ''}`} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.category && !isJob ? 'border-red-500' : ''}`}>
                            <option value="">{isJob ? "Selecciona una Categoría (Opcional)" : "Selecciona una Categoría"}</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.category && !isJob && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>
                    {showVehicleFields && (
                        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                            <h3 className="font-semibold text-gray-700">Detalles del Vehículo</h3>
                            <div><input type="text" placeholder="Marca (Ej: Toyota)" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><input type="text" placeholder="Modelo (Ej: Hilux)" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><input type="number" placeholder="Año (Ej: 2022)" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><input type="number" placeholder="Kilometraje (Opcional)" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>
                    )}
                    {isJob && (<>
                        <input type="text" placeholder="Nombre de la Empresa (Opcional)" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        <input type="text" placeholder="Email o Link para Aplicar (Opcional)" value={formData.applicationContact} onChange={e => setFormData({ ...formData, applicationContact: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </>)}
                    <div>
                        <textarea placeholder={isJob ? "Descripción del puesto, requisitos..." : "Descripción detallada..."} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.description ? 'border-red-500' : ''}`} rows="4" />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    {isJob ? <input type="text" placeholder="Salario (Ej: C$15,000 o A convenir)" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /> : <input type="number" placeholder="Precio (C$) (Opcional)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />}
                    <div>
                        <select value={location} onChange={e => setLocation(e.target.value)} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.location ? 'border-red-500' : ''}`}>
                            <option value="">Selecciona una Ciudad</option>
                            {nicaraguaCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{isJob ? 'Logo (1 max)' : 'Fotos (12 max)'}</label>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {allPreviews.map((p) => (
                                <div key={`${p.type}-${p.index}`} className="relative">
                                    <img src={p.url} alt={`Preview ${p.index}`} className="h-24 w-24 object-cover rounded-md" />
                                    <button type="button" onClick={() => p.type === 'existing' ? removeExistingImage(p.index) : removeNewImage(p.index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                                </div>
                            ))}
                            {allPreviews.length < (isJob ? 1 : 12) && (
                                <label htmlFor="file-upload" className="flex items-center justify-center w-24 h-24 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500">
                                    <div className="text-center text-gray-500">+<br />Añadir</div>
                                    <input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple={!isJob} />
                                </label>
                            )}
                            {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                        </div>
                    </div>
                    {user?.isPremium && type === 'producto' && (
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <label htmlFor="highlight-toggle" className="font-medium text-yellow-800">⭐ Destacar este anuncio</label>
                            <div onClick={() => setIsHighlighted(prev => !prev)} className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors ${isHighlighted ? 'bg-yellow-400' : ''}`}>
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${isHighlighted ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 items-center">
                        {isSubmitting && uploadProgress.total > 0 && <span className="text-sm text-gray-500">{`Subiendo ${uploadProgress.current} de ${uploadProgress.total}...`}</span>}
                        <button type="button" onClick={() => setView({ page: 'listings', type: type })} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center disabled:bg-blue-300 min-w-[100px]">
                            {isSubmitting ? <SpinnerIcon /> : (isEditing ? 'Actualizar' : 'Publicar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
