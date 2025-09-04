import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import { SpinnerIcon } from '../components/common/Icons';

// --- Hook personalizado para manejar la lógica de edición ---
const useEditBusiness = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ businessName: '', description: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar los datos del negocio al montar el componente
    useEffect(() => {
        if (!user?.businessId) {
            setError("No se encontró un negocio asociado a tu cuenta.");
            setLoading(false);
            return;
        }

        const fetchBusinessData = async () => {
            const businessRef = doc(db, 'businesses', user.businessId);
            const businessSnap = await getDoc(businessRef);

            if (businessSnap.exists()) {
                const data = businessSnap.data();
                setFormData({ businessName: data.businessName, description: data.description });
                setLogoPreview(data.logoUrl);
            } else {
                setError("No se pudieron cargar los datos de tu negocio.");
            }
            setLoading(false);
        };

        fetchBusinessData();
    }, [user]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    }, []);

    const createSlug = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const businessRef = doc(db, 'businesses', user.businessId);
            const dataToUpdate = {
                businessName: formData.businessName,
                description: formData.description,
                slug: createSlug(formData.businessName),
                updatedAt: serverTimestamp(),
            };

            // Si se seleccionó un nuevo logo, subirlo y actualizar la URL
            if (logoFile) {
                const logoStorageRef = ref(storage, `businesses/${user.businessId}/logo.jpg`);
                await uploadBytes(logoStorageRef, logoFile);
                dataToUpdate.logoUrl = await getDownloadURL(logoStorageRef);
            }

            await updateDoc(businessRef, dataToUpdate);
            navigate(`/tienda/${dataToUpdate.slug}`);

        } catch (err) {
            console.error("Error updating business profile:", err);
            setError("Hubo un error al actualizar tu tienda.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return { formData, logoPreview, loading, error, isSubmitting, handleChange, handleFileChange, handleSubmit };
};


// --- Componente de la página ---
export default function EditBusinessPage() {
    const { formData, logoPreview, loading, error, isSubmitting, handleChange, handleFileChange, handleSubmit } = useEditBusiness();

    if (loading) {
        return <div className="text-center p-10"><SpinnerIcon /> Cargando...</div>;
    }

    if (error) {
        return <p className="text-center text-red-500 p-10">{error}</p>;
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Editar Perfil de Tienda</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm border-gray-300"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción Corta</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm border-gray-300"
                            rows="4"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logo de tu Negocio</label>
                        <div className="mt-2 flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <img className="h-20 w-20 rounded-full object-cover" src={logoPreview || 'https://placehold.co/150x150?text=Logo'} alt="Vista previa del logo" />
                            </div>
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <span>Cambiar Logo</span>
                                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                            </label>
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center">
                        {isSubmitting ? <><SpinnerIcon /> Guardando...</> : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
}

