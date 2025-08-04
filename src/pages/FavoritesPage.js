import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import ListingsSkeleton from '../components/listings/ListingsSkeleton';
import ListingCard from '../components/listings/ListingCard';

export default function FavoritesPage({ user, setView }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "users", user.uid, "favorites"), orderBy("addedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">Mis Favoritos</h1>
            {loading ? <ListingsSkeleton /> : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {favorites.map(listing => <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />)}
                    </div>
                    {!loading && favorites.length === 0 && <p className="text-center text-gray-500 mt-8">No has guardado favoritos.</p>}
                </>
            )}
        </div>
    );
}