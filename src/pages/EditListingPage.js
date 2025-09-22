import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';

export default function EditListingPage() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [listing, setListing] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', price: '', quantity: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Obtener los datos del anuncio al cargar la página
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const docRef = doc(db, 'listings', listingId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const listingData = docSnap.data();

                    // Seguridad: Verificar si el usuario actual es el dueño del anuncio
                    if (user && user.uid !== listingData.ownerId) {
                        setError('No tienes permiso para editar este anuncio.');
                        setLoading(false);
                        return;
                    }
                    
                    setListing(listingData);
                    setFormData({
                        title: listingData.title || '',
                        description: listingData.description || '',
                        price: listingData.price || '',
                        quantity: listingData.quantity || '',
                    });
                } else {
                    setError('El anuncio que intentas editar no existe.');
                }
            } catch (err) {
                console.error("Error fetching document:", err);
                setError('Ocurrió un error al cargar el anuncio.');
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [listingId, user]);

    // 2. Manejar los cambios en los inputs del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // 3. Guardar los cambios en Firestore
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        const updatedData = {
            ...formData,
            price: Number(formData.price), // Asegurarse de que el precio sea un número
            quantity: Number(formData.quantity) // Asegurarse de que la cantidad sea un número
        };

        try {
            const listingRef = doc(db, 'listings', listingId);
            await updateDoc(listingRef, updatedData);
            
            // Redirigir al dashboard después de actualizar
            navigate('/account/dashboard'); 
        } catch (err) {
            console.error("Error al actualizar el anuncio: ", err);
            setError('No se pudo guardar los cambios. Inténtalo de nuevo.');
        }
    };

    if (loading) {
        return <div className="text-center p-10">Cargando editor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-10">{error}</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Editar Anuncio</h1>
            <form onSubmit={handleUpdate} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <input
                            type="number"
                            name="price"
                            id="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Cantidad (Inventario)</label>
                        <input
                            type="number"
                            name="quantity"
                            id="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}