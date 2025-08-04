import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
// RUTA CORREGIDA: Desde aquí, subimos a 'src', y ahí está 'constants.js'
import { nicaraguaCities, productCategories, jobCategories } from '../constants';
import ListingCard from '../components/listings/ListingCard';
import ListingsSkeleton from '../components/listings/ListingsSkeleton';

export default function ListingsPage({ type, setView, user }) {
    const [allListings, setAllListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const pageTitle = type === 'producto' ? 'Artículos en Venta' : 'Ofertas de Empleo';
    const publishButtonText = type === 'producto' ? 'Vender Artículo' : 'Publicar Empleo';
    const categories = type === 'producto' ? productCategories : jobCategories;

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "listings"), where("type", "==", type), where("status", "==", "active"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sortedListings = listingsData.sort((a, b) => (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0));
            setAllListings(sortedListings);
            setFilteredListings(sortedListings);
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
        if (selectedCategory) {
            result = result.filter(listing => listing.category === selectedCategory);
        }
        setFilteredListings(result);
    }, [searchTerm, selectedCity, selectedCategory, allListings]);

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto" />
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto">
                        <option value="">Todas las Ciudades</option>
                        {nicaraguaCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full sm:w-auto">
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <button onClick={() => setView({ page: 'publish', type: type })} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto">{publishButtonText}</button>
            </div>
            {loading ? <ListingsSkeleton /> : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />)}
                    </div>
                    {!loading && filteredListings.length === 0 && <p className="text-center text-gray-500 mt-8">No se encontraron anuncios que coincidan con tu búsqueda.</p>}
                </>
            )}
        </div>
    );
}
