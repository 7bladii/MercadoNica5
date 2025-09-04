import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, startAfter, getDocs, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
// ✅ Se quita la importación de jobCategories para definirlas localmente
import { nicaraguaCities, productCategories } from '../constants';
import ListingCard from '../components/listings/ListingCard';
import ListingsSkeleton from '../components/listings/ListingsSkeleton';

const PAGE_SIZE = 12;

// ✅ NUEVO: Se define una lista de categorías de empleo más completa, incluyendo agricultura.
const jobCategories = [
    { label: 'Administración y Oficina', value: 'administracion-oficina' },
    { label: 'Agricultura', value: 'agricultura' },
    { label: 'Corte de Café', value: 'corte-cafe' },
    { label: 'Tabaco', value: 'Tabaco' },
    { label: 'Trabajo Agrícola General', value: 'agricola-general' },
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


export default function ListingsPage() {
    const { type } = useParams();

    const [listings, setListings] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const pageTitle = type === 'producto' ? 'Artículos en Venta' : 'Ofertas de Empleo';
    const publishButtonText = type === 'producto' ? 'Vender Artículo' : 'Publicar Empleo';
    // ✅ Ahora usa la lista local de jobCategories
    const categories = type === 'producto' ? productCategories : jobCategories;

    const fetchListings = useCallback(async (cursor = null) => {
        const isLoadingMore = !!cursor;
        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setListings([]);
        }

        try {
            let q = query(
                collection(db, "listings"),
                where("status", "==", "active"),
                orderBy("isHighlighted", "desc"),
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            );

            if (type) q = query(q, where("type", "==", type));
            if (selectedCity) q = query(q, where("location", "==", selectedCity));
            if (selectedCategory) q = query(q, where("category", "==", selectedCategory));
            if (cursor) q = query(q, startAfter(cursor));

            const listingsSnapshot = await getDocs(q);
            const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const businessIds = [...new Set(listingsData.map(l => l.businessId).filter(Boolean))];

            if (businessIds.length > 0) {
                const businessesQuery = query(collection(db, "businesses"), where(documentId(), "in", businessIds));
                const businessesSnapshot = await getDocs(businessesQuery);
                const businessesMap = new Map(businessesSnapshot.docs.map(doc => [doc.id, doc.data()]));

                listingsData.forEach(listing => {
                    if (listing.businessId && businessesMap.has(listing.businessId)) {
                        const business = businessesMap.get(listing.businessId);
                        listing.businessName = business.businessName;
                        listing.businessSlug = business.slug;
                    }
                });
            }
            
            setLastVisible(listingsSnapshot.docs[listingsSnapshot.docs.length - 1]);
            setHasMore(listingsData.length === PAGE_SIZE);

            if (isLoadingMore) {
                setListings(prev => [...prev, ...listingsData]);
            } else {
                setListings(listingsData);
            }
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [type, selectedCity, selectedCategory]);

    useEffect(() => {
        fetchListings(null);
    }, [fetchListings]);

    const filteredListings = useMemo(() => {
        if (!searchTerm) {
            return listings;
        }
        return listings.filter(listing => 
            listing.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, listings]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchListings(lastVisible);
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto" />
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto">
                        <option value="">Todas las Ciudades</option>
                        {nicaraguaCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto">
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <Link to="/publish" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto text-center">
                    {publishButtonText}
                </Link>
            </div>

            {loading ? <ListingsSkeleton count={PAGE_SIZE} /> : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredListings.map(listing => (
                            <Link to={`/listing/${listing.id}`} key={listing.id}>
                                <ListingCard listing={listing} />
                            </Link>
                        ))}
                    </div>
                    
                    {!loading && filteredListings.length === 0 && <p className="text-center text-gray-500 mt-8">No se encontraron anuncios que coincidan con tu búsqueda.</p>}
                    
                    <div className="text-center mt-8">
                        {hasMore && (
                            <button onClick={handleLoadMore} disabled={loadingMore} className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition">
                                {loadingMore ? 'Cargando...' : 'Cargar Más'}
                            </button>
                        )}
                        {!hasMore && listings.length > 0 && (
                            <p className="text-gray-500">Has llegado al final de los resultados.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

