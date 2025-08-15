import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logEvent } from 'firebase/analytics';
import imageCompression from 'browser-image-compression';
import { db, storage, getFirebaseAnalytics } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { jobCategories, productCategories, nicaraguaCities } from '../constants';
import { SpinnerIcon } from '../components/common/Icons';

export default function PublishPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();

    const [formData, setFormData] = useState({ title: '', description: '', category: '', price: '', companyName: '', salary: '', make: '', model: '', year: '', mileage: '', applicationContact: '' });
    const [location, setLocation] = useState('');
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [listingType, setListingType] = useState('producto');

    const isEditing = !!listingId;
    const isJob = listingType === 'trabajo';
    const categories = isJob ? jobCategories : productCategories;

    useEffect(() => {
        const initializeAnalytics = async () => {
            const analyticsInstance = await getFirebaseAnalytics();
            if (analyticsInstance) setAnalytics(analyticsInstance);
        };
        initializeAnalytics();
    }, []);

    useEffect(() => {
        if (isEditing) {
            const fetchListing = async () => {
                setIsLoading(true);
                const docRef = doc(db, "listings", listingId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({ title: data.title || '', description: data.description || '', category: data.category || '', price: data.price || '', companyName: data.companyName || '', salary: data.salary || '', make: data.make || '', model: data.model || '', year: data.year || '', mileage: data.mileage || '', applicationContact: data.applicationContact || '' });
                    setLocation(data.location || '');
                    setExistingPhotos(data.photos || []);
                    setIsHighlighted(data.isHighlighted || false);
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
    }, [listingId, isEditing, navigate]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim() || formData.title.trim().length < 5) newErrors.title = "El título debe tener al menos 5 caracteres.";
        if (!isJob && !formData.category) newErrors.category = "Debes seleccionar una categoría.";
        if (!location) newErrors.location = "Debes seleccionar una ubicación.";
        if (!formData.description.trim() || formData.description.trim().length < 15) newErrors.description = "La descripción debe ser más detallada (mínimo 15 caracteres).";
        if (!isJob && existingPhotos.length === 0 && newImageFiles.length === 0) newErrors.images = "Debes subir al menos una foto.";
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
        if (!user) {
            alert("Debes iniciar sesión para publicar.");
            return;
        }
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const uploadAndGetURLs = async (file) => {
                const baseName = `${user.uid}/${Date.now()}_${file.name}`;
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
                const urls = await uploadAndGetURLs(newImageFiles[i]);
                newPhotoObjects.push(urls);
                setUploadProgress({ current: i + 1, total: newImageFiles.length });
            }

            const allPhotos = [...existingPhotos, ...newPhotoObjects];
            const listingData = { ...formData, location, type: listingType, photos: allPhotos, authorId: user.uid, authorName: user.displayName, authorPhotoURL: user.photoURL, isVerified: user.isVerified || false, isHighlighted: user.isPremium ? isHighlighted : false, status: 'active', updatedAt: serverTimestamp() };
            
            if (!isJob) {
                listingData.price = Number(formData.price) || 0;
            }

            if (isEditing) {
                const docRef = doc(db, "listings", listingId);
                await updateDoc(docRef, listingData);
                alert("Anuncio actualizado con éxito.");
                navigate(`/listing/${listingId}`);
            } else {
                const newDocRef = await addDoc(collection(db, "listings"), { ...listingData, createdAt: serverTimestamp(), viewCount: 0, favoriteCount: 0 });
                if (analytics) {
                    logEvent(analytics, 'publish_listing', { listing_id: newDocRef.id, listing_type: listingType });
                }
                alert("Anuncio publicado con éxito.");
                navigate(`/listing/${newDocRef.id}`);
            }
        } catch (error) {
            console.error("Error al publicar:", error);
            setErrors({ form: "Hubo un error al publicar. Inténtalo más tarde." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <p className="text-center p-10">Cargando...</p>;

    const allPreviews = [...existingPhotos.map((photo, index) => ({ type: 'existing', url: photo.thumb, index })), ...newImageFiles.map((file, index) => ({ type: 'new', url: URL.createObjectURL(file), index }))];

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar' : 'Publicar'} {isJob ? 'Empleo' : 'Artículo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... (resto del JSX del formulario) ... */}
                    {/* El JSX del formulario de tu versión más compleja es bueno, solo hay que asegurarse de que los nombres de estado coincidan */}
                    {/* Aquí un ejemplo simplificado basado en tu código */}
                    <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`w-full border rounded p-2 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
                    <textarea placeholder="Descripción" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`w-full border rounded p-2 ${errors.description ? 'border-red-500' : 'border-gray-300'}`} rows="4" />
                    {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                    {/* ... Añadir el resto de los campos del formulario aquí ... */}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center">
                        {isSubmitting ? <SpinnerIcon /> : (isEditing ? 'Actualizar' : 'Publicar')}
                    </button>
                </form>
            </div>
        </div>
    );
}
