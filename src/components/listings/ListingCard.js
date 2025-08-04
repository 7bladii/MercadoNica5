import React, { useState, useEffect, memo } from 'react';
import { doc, onSnapshot, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CameraIcon, HeartIcon } from '../common/Icons';

function ListingCard({ listing, setView, user }) {
    const placeholderUrl = `https://placehold.co/400x400/e2e8f0/64748b?text=${listing.type === 'producto' ? 'Producto' : 'Empleo'}`;
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!user) return;
        const favRef = doc(db, "users", user.uid, "favorites", listing.id);
        const unsubscribe = onSnapshot(favRef, (doc) => {
            setIsFavorite(doc.exists());
        });
        return () => unsubscribe();
    }, [user, listing.id]);

    const toggleFavorite = async (e) => {
        e.stopPropagation();
        if (!user) {
            alert("Debes iniciar sesión para guardar favoritos.");
            return;
        }
        const favRef = doc(db, "users", user.uid, "favorites", listing.id);
        if (isFavorite) {
            await deleteDoc(favRef);
        } else {
            await setDoc(favRef, { ...listing, addedAt: serverTimestamp() });
        }
    };

    const isJob = listing.type === 'trabajo';
    const imageUrl = listing.photos?.[0]?.thumb || placeholderUrl;

    return (
        <div onClick={() => setView({ page: 'listingDetail', listingId: listing.id })} className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${listing.isHighlighted ? 'border-2 border-yellow-400' : ''}`}>
            <div className="relative">
                <img
                    src={imageUrl}
                    alt={listing.title}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {listing.isHighlighted && (<div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-lg">⭐ DESTACADO</div>)}
                {user && (
                    <button onClick={toggleFavorite} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100">
                        <HeartIcon isFavorite={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} />
                    </button>
                )}
                {listing.photos && listing.photos.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                        <CameraIcon /><span className="ml-1">{listing.photos.length}</span>
                    </div>
                )}
            </div>
            <div className="p-4 flex-grow flex flex-col space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">{listing.category}</span>
                <h3 className="font-semibold text-gray-800 h-12 line-clamp-2">{listing.title}</h3>
                <p className="text-gray-600 text-sm flex-grow">{listing.location}</p>
                <div className="pt-2">
                    {isJob ? (
                        <p className="text-md font-bold text-blue-600">{listing.salary || 'Salario a convenir'}</p>
                    ) : (
                        <p className="text-lg font-extrabold text-blue-700">{listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Consultar'}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(ListingCard);