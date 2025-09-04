import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// ✅ CORRECCIÓN: Se importa 'orderBy' para ordenar los anuncios.
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import ListingCard from '../components/listings/ListingCard';
import { SpinnerIcon } from '../components/common/Icons';

// ============================================================================
// 1. HOOK PERSONALIZADO `useBusinessProfile`
// ============================================================================
const useBusinessProfile = (slug) => {
    const [business, setBusiness] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            setError("No se especificó un negocio.");
            return;
        }

        const fetchBusinessData = async () => {
            setLoading(true);
            setError('');
            try {
                // 1. Buscar el negocio por su 'slug'
                const businessQuery = query(
                    collection(db, "businesses"),
                    where("slug", "==", slug),
                    limit(1)
                );
                const businessSnapshot = await getDocs(businessQuery);

                if (businessSnapshot.empty) {
                    setError("No se encontró el negocio que estás buscando.");
                    setLoading(false);
                    return;
                }

                const businessData = { id: businessSnapshot.docs[0].id, ...businessSnapshot.docs[0].data() };
                setBusiness(businessData);

                // 2. Buscar todos los anuncios que pertenecen a este negocio
                const listingsQuery = query(
                    collection(db, "listings"),
                    where("businessId", "==", businessData.id),
                    where("status", "==", "active"),
                    // ✅ CORRECCIÓN: Se añade el 'orderBy' para mostrar los anuncios más recientes primero.
                    orderBy("createdAt", "desc")
                );
                const listingsSnapshot = await getDocs(listingsQuery);
                const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setListings(listingsData);

            } catch (err) {
                console.error("Error fetching business profile:", err);
                setError("Ocurrió un error al cargar la página del negocio.");
            } finally {
                setLoading(false);
            }
        };

        fetchBusinessData();
    }, [slug]);

    return { business, listings, loading, error };
};

// ============================================================================
// 2. COMPONENTES DE UI
// ============================================================================

const BusinessHeader = ({ business }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row items-center text-center md:text-left">
        <img
            src={business.logoUrl || `https://placehold.co/150x150/e2e8f0/64748b?text=${business.businessName.charAt(0)}`}
            alt={`Logo de ${business.businessName}`}
            className="w-32 h-32 rounded-full object-cover mb-4 md:mb-0 md:mr-6 flex-shrink-0 border-4 border-gray-200"
        />
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{business.businessName}</h1>
            <p className="text-gray-600 mt-2">{business.description}</p>
        </div>
    </div>
);

const ListingsGrid = ({ listings }) => {
    if (listings.length === 0) {
        return <p className="text-center text-gray-500 py-8">Este negocio aún no tiene anuncios publicados.</p>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {listings.map(listing => (
                <Link to={`/listing/${listing.id}`} key={listing.id}>
                    <ListingCard listing={listing} />
                </Link>
            ))}
        </div>
    );
};

// ============================================================================
// 3. EL COMPONENTE DE LA PÁGINA
// ============================================================================
export default function BusinessProfilePage() {
    const { slug } = useParams();
    // ✅ CORRECCIÓN: Se importa el hook 'useAuth' para obtener el usuario.
    const { user } = useAuth();
    const { business, listings, loading, error } = useBusinessProfile(slug);

    if (loading) {
        return (
            <div className="text-center p-10">
                <SpinnerIcon />
                <p className="mt-2">Cargando tienda...</p>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-500 p-10">{error}</p>;
    }

    const isOwner = user?.uid === business?.ownerId;

    return (
        <div className="container mx-auto">
            {business && <BusinessHeader business={business} />}
            
            {isOwner && (
                <div className="text-right mb-4">
                    <Link to="/account/business/edit" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-semibold">
                        Editar Perfil de Tienda
                    </Link>
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Anuncios de la Tienda</h2>
            <ListingsGrid listings={listings} />
        </div>
    );
}

