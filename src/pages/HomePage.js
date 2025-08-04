import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BriefcaseIcon } from '../components/common/Icons';
import ListingCard from '../components/listings/ListingCard';
import ListingsSkeleton from '../components/listings/ListingsSkeleton';

export default function HomePage({ setView }) {
    const [recentListings, setRecentListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "listings"),
            where("type", "==", "producto"),
            where("status", "==", "active"),
            orderBy("createdAt", "desc"),
            limit(8)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentListings(listingsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Bienvenido a MercadoNica</h1>
                <p className="text-gray-600 text-lg">Tu plataforma para comprar, vender y encontrar empleo en Nicaragua.</p>
            </div>
            <div onClick={() => setView({ page: 'listings', type: 'trabajo' })} className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-2xl font-bold">¿Buscas Empleo?</h2>
                    <p className="opacity-90">Explora las últimas vacantes o publica una oferta.</p>
                </div>
                <BriefcaseIcon className="h-12 w-12 text-white opacity-80" />
            </div>
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Artículos Recientes</h2>
                {loading ? <ListingsSkeleton /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {recentListings.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={null} />)}
                    </div>
                )}
                <div className="text-center mt-8">
                    <button onClick={() => setView({ page: 'listings', type: 'producto' })} className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Ver todos los artículos</button>
                </div>
            </div>
        </div>
    );
}