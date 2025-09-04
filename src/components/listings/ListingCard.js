import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CameraIcon, HeartIcon, BriefcaseIcon } from '../common/Icons';
import { useAuth } from '../context/AuthContext';

// --- Sub-componentes para mayor claridad ---

const CardImage = ({ listing, isFavorite, onToggleFavorite }) => {
    const { user } = useAuth();
    const placeholderUrl = `https://placehold.co/400x400/e2e8f0/64748b?text=${listing.type === 'producto' ? 'Producto' : 'Empleo'}`;
    const imageUrl = listing.photos?.[0]?.thumb || placeholderUrl;

    return (
        <div className="relative">
            <img
                src={imageUrl}
                alt={listing.title}
                className="w-full aspect-square object-cover"
                loading="lazy"
            />
            {listing.isHighlighted && <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-lg">⭐ DESTACADO</div>}
            {user && (
                <button
                    onClick={onToggleFavorite}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Toggle Favorite"
                >
                    <HeartIcon isFavorite={isFavorite} />
                </button>
            )}
            {listing.photos && listing.photos.length > 1 && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                    <CameraIcon /><span className="ml-1">{listing.photos.length}</span>
                </div>
            )}
        </div>
    );
};

const CardContent = ({ listing }) => (
    <div className="p-4 flex-grow flex flex-col space-y-1">
        <span className="text-xs font-semibold text-gray-500 uppercase">{listing.category}</span>
        <h3 className="font-semibold text-gray-800 h-12 line-clamp-2">{listing.title}</h3>
        <p className="text-gray-600 text-sm flex-grow">{listing.location}</p>
        <div className="pt-2">
            {listing.type === 'trabajo' ? (
                <p className="text-md font-bold text-blue-600">{listing.salary || 'Salario a convenir'}</p>
            ) : (
                <p className="text-lg font-extrabold text-blue-700">{listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Consultar'}</p>
            )}
        </div>
    </div>
);

const CardFooter = ({ listing }) => {
    const navigate = useNavigate();

    const handleBusinessClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/tienda/${listing.businessSlug}`);
    };

    if (!listing.businessId) return null;

    return (
        <div className="px-4 pb-3 border-t pt-3">
            <button
                onClick={handleBusinessClick}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 w-full"
            >
                <BriefcaseIcon className="w-4 h-4" />
                <span className="truncate font-semibold">{listing.businessName}</span>
            </button>
        </div>
    );
};

// --- Componente Principal ---

function ListingCard({ listing }) {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsFavorite(false);
            return;
        }
        const favRef = doc(db, "users", user.uid, "favorites", listing.id);
        const unsubscribe = onSnapshot(favRef, (doc) => setIsFavorite(doc.exists()));
        return () => unsubscribe();
    }, [user, listing.id]);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 2000); // El tooltip desaparece después de 2 segundos
            return;
        }
        const favRef = doc(db, "users", user.uid, "favorites", listing.id);
        if (isFavorite) {
            await deleteDoc(favRef);
        } else {
            await setDoc(favRef, { ...listing, addedAt: serverTimestamp() });
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
            <CardImage listing={listing} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
            <CardContent listing={listing} />
            <CardFooter listing={listing} />
            {showTooltip && (
                <div className="absolute top-12 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg z-10">
                    Inicia sesión para guardar
                </div>
            )}
        </div>
    );
}

export default memo(ListingCard);

