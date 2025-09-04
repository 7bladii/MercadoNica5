import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import { SpinnerIcon } from '../components/common/Icons';

// ============================================================================
// 1. HOOK PERSONALIZADO `useCreateBusiness`
// Contiene toda la lógica para crear el perfil de negocio.
// ============================================================================
const useCreateBusiness = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ businessName: '', description: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Redirige si el usuario ya tiene una tienda
    useEffect(() => {
        if (user?.businessId && user?.business?.slug) {
            navigate(`/tienda/${user.business.slug}`);
        }
    }, [user, navigate]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setError('');
        } else {
            setLogoFile(null);
            setLogoPreview('');
            setError('Por favor, selecciona un archivo de imagen válido (JPG, PNG).');
        }
    }, []);

    // ✅ Función para crear un "slug" amigable para la URL
    const createSlug = (text) => {
        return text
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.businessName || !formData.description) {
            setError('El nombre y la descripción del negocio son obligatorios.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Crear la referencia al documento del negocio para obtener un ID
            const businessRef = doc(collection(db, 'businesses'));
            const businessId = businessRef.id;
            let logoUrl = '';

            // 2. Subir el logo si existe
            if (logoFile) {
                const logoStorageRef = ref(storage, `businesses/${businessId}/logo.jpg`);
                await uploadBytes(logoStorageRef, logoFile);
                logoUrl = await getDownloadURL(logoStorageRef);
            }

            // 3. Preparar los datos del negocio
            const businessSlug = createSlug(formData.businessName);
            const businessData = {
                businessName: formData.businessName,
                description: formData.description,
                ownerId: user.uid,
                logoUrl: logoUrl,
                slug: businessSlug,
                createdAt: serverTimestamp(),
            };

            // 4. Guardar el documento del negocio y actualizar el perfil del usuario
            const userRef = doc(db, "users", user.uid);
            
            // Usamos un batch para asegurar que ambas operaciones se completen
            const batch = writeBatch(db);
            batch.set(businessRef, businessData);
            batch.update(userRef, { businessId: businessId });
            await batch.commit();

            // 5. Redirigir a la nueva tienda
            navigate(`/tienda/${businessSlug}`);

        } catch (err) {
            console.error("Error creating business profile:", err);
            setError("Hubo un error al crear tu tienda. Por favor, inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return { formData, logoPreview, error, isSubmitting, handleChange, handleFileChange, handleSubmit };
};

// ============================================================================
// 2. EL COMPONENTE DE LA PÁGINA (Limpio y enfocado en la UI)
// ============================================================================
export default function CreateBusinessPage() {
    const { formData, logoPreview, error, isSubmitting, handleChange, handleFileChange, handleSubmit } = useCreateBusiness();

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-2 text-center">Crea tu Perfil de Negocio</h1>
                <p className="text-gray-600 text-center mb-6">Dale una identidad a tu negocio para que los clientes te reconozcan.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campo Nombre del Negocio */}
                    <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="Ej: Ferretería Don Juan"
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Campo Descripción */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción Corta</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe lo que vendes o los servicios que ofreces..."
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                            required
                        />
                    </div>

                    {/* Campo para Subir Logo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logo de tu Negocio (Opcional)</label>
                        <div className="mt-2 flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                {logoPreview ? (
                                    <img className="h-20 w-20 rounded-full object-cover" src={logoPreview} alt="Vista previa del logo" />
                                ) : (
                                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                                <span>Cambiar</span>
                                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                            </label>
                        </div>
                    </div>

                    {/* Mensaje de Error */}
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}

                    {/* Botón de Envío */}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                        {isSubmitting ? <><SpinnerIcon /> Creando Tienda...</> : 'Confirmar y Crear Tienda'}
                    </button>
                </form>
            </div>
        </div>
    );
}
