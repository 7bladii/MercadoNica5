import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function PremiumDashboard({ user, setView }) {
    const [userListings, setUserListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            if (!user) return;
            setLoading(true);
            const q = query(collection(db, 'listings'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const listingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                viewCount: doc.data().viewCount || 0,
                favoriteCount: doc.data().favoriteCount || 0
            }));
            setUserListings(listingsData);
            setLoading(false);
        };
        fetchListings();
    }, [user]);

    if (loading) return <p className="text-center">Cargando tus estadísticas...</p>;

    const totalViews = userListings.reduce((sum, item) => sum + item.viewCount, 0);
    const totalFavorites = userListings.reduce((sum, item) => sum + item.favoriteCount, 0);

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Panel Premium</h1>
            <p className="text-gray-600 mb-6">Aquí puedes ver el rendimiento de todos tus anuncios.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-blue-800">Vistas Totales</h2>
                    <p className="text-4xl font-bold mt-2 text-blue-600">{totalViews}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-red-800">Favoritos Totales</h2>
                    <p className="text-4xl font-bold mt-2 text-red-600">{totalFavorites}</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Rendimiento por Anuncio</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Anuncio</th>
                            <th className="p-2 text-center">Vistas</th>
                            <th className="p-2 text-center">Favoritos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userListings.map(listing => (
                            <tr key={listing.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-semibold">{listing.title}</td>
                                <td className="p-2 text-center">{listing.viewCount}</td>
                                <td className="p-2 text-center">{listing.favoriteCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}