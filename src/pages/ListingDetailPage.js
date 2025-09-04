import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, increment, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';

import { Helmet } from 'react-helmet-async';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { HeartIcon, VerifiedIcon, SpinnerIcon } from '../components/common/Icons';

// ============================================================================
// 1. HOOK PERSONALIZADO `useListingDetail`
// ============================================================================
const useListingDetail = (listingId) => {
    const { user: currentUser } = useAuth();
    const [listing, setListing] = useState(null);
    const [seller, setSeller] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!listingId) {
            setLoading(false);
            setError("No se proporcionó un ID de anuncio.");
            return;
        }

        const viewCountKey = `viewed_${listingId}`;
        if (!sessionStorage.getItem(viewCountKey)) {
            const docRef = doc(db, "listings", listingId);
            updateDoc(docRef, { viewCount: increment(1) }).catch(console.error);
            sessionStorage.setItem(viewCountKey, 'true');
        }
        
        const listingUnsub = onSnapshot(doc(db, "listings", listingId), (doc) => {
            if (doc.exists()) {
                const data = { id: doc.id, ...doc.data() };
                setListing(data);
            } else {
                setListing(null);
                setError("Este anuncio no existe o fue eliminado.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching listing:", err);
            setError("No se pudo cargar el anuncio.");
            setLoading(false);
        });

        return () => listingUnsub();
    }, [listingId]);

    useEffect(() => {
        if (!listing?.authorId) return;

        const sellerUnsub = onSnapshot(doc(db, "users", listing.authorId), (userSnap) => {
            if (userSnap.exists()) setSeller(userSnap.data());
        });

        let favUnsub = () => {};
        if (currentUser) {
            const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id);
            favUnsub = onSnapshot(favRef, (doc) => setIsFavorite(doc.exists()));
        }

        return () => {
            sellerUnsub();
            favUnsub();
        };
    }, [listing, currentUser]);

    const toggleFavorite = async () => {
        if (!currentUser || !listing) return;
        const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id);
        const listingRef = doc(db, "listings", listing.id);
        try {
            if (isFavorite) {
                await deleteDoc(favRef);
                await updateDoc(listingRef, { favoriteCount: increment(-1) });
            } else {
                await setDoc(favRef, { ...listing, addedAt: serverTimestamp() });
                await updateDoc(listingRef, { favoriteCount: increment(1) });
            }
        } catch (error) {
            console.error("Error updating favorite status:", error);
        }
    };

    return { listing, seller, isFavorite, loading, error, toggleFavorite };
};

// ============================================================================
// 2. COMPONENTES DE UI
// ============================================================================
const ListingDetailSkeleton = () => (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <div className="w-full h-80 bg-gray-300 rounded-lg mb-4"></div>
                <div className="flex space-x-2">
                    <div className="h-20 w-20 bg-gray-300 rounded-md"></div>
                    <div className="h-20 w-20 bg-gray-300 rounded-md"></div>
                    <div className="h-20 w-20 bg-gray-300 rounded-md"></div>
                </div>
            </div>
            <div>
                <div className="h-6 w-1/3 bg-gray-300 rounded-full mb-4"></div>
                <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
                <div className="h-10 w-1/2 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                </div>
                <div className="border-t pt-4 mt-4">
                     <div className="h-6 w-1/4 bg-gray-300 rounded mb-4"></div>
                     <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                        <div className="flex-1 space-y-2">
                             <div className="h-4 w-2/4 bg-gray-300 rounded"></div>
                             <div className="h-3 w-1/4 bg-gray-300 rounded"></div>
                        </div>
                     </div>
                </div>
                <div className="mt-6 h-12 w-full bg-gray-300 rounded-lg"></div>
            </div>
        </div>
    </div>
);

const VehicleDetails = ({ listing }) => {
    const details = [
        { label: 'Marca', value: listing.make },
        { label: 'Modelo', value: listing.model },
        { label: 'Año', value: listing.year },
        { label: 'Kilometraje', value: listing.mileage ? `${new Intl.NumberFormat('es-NI').format(listing.mileage)} km` : null },
    ].filter(detail => detail.value);

    if (details.length === 0) {
        return null;
    }

    return (
        <div className="my-6 border-t pt-4">
            <h3 className="font-semibold text-lg mb-4">Detalles del Vehículo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                {details.map(detail => (
                    <div key={detail.label}>
                        <p className="text-gray-500">{detail.label}</p>
                        <p className="font-semibold text-gray-800">{detail.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// 3. EL COMPONENTE DE LA PÁGINA
// ============================================================================
export default function ListingDetailPage() {
    const { listingId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { listing, seller, isFavorite, loading, error, toggleFavorite } = useListingDetail(listingId);

    const [mainImage, setMainImage] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const slides = useMemo(() => listing?.photos?.map(photo => ({ src: photo.full })) || [], [listing]);

    useEffect(() => {
        if (listing?.photos?.length > 0) {
            setMainImage(listing.photos[0].full);
        }
    }, [listing]);

    if (loading) return <ListingDetailSkeleton />;
    if (error || !listing) return <p className="text-center p-10">{error || "Este anuncio no fue encontrado."}</p>;

    const handleSendMessage = () => {
        navigate('/messages', { state: { recipientId: listing.authorId } });
    };

    const isAuthor = currentUser?.uid === listing.authorId;
    
    return (
        <>
            <Helmet>
                <title>{`${listing.title} - MercadoNica`}</title>
                <meta name="description" content={listing.description.substring(0, 160)} />
                <meta property="og:title" content={listing.title} />
                <meta property="og:description" content={listing.description.substring(0, 160)} />
                <meta property="og:image" content={listing.photos?.[0]?.full || '/default-image.jpg'} />
                <meta property="og:url" content={window.location.href} />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div>
                         <img src={mainImage} alt={listing.title} className="w-full h-80 object-cover rounded-lg mb-4 cursor-pointer" onClick={() => setLightboxOpen(true)} />
                         {currentUser && !isAuthor && (
                            <button onClick={toggleFavorite} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10">
                                <HeartIcon isFavorite={isFavorite} />
                            </button>
                         )}
                         <div className="flex space-x-2 overflow-x-auto">
                            {listing.photos && listing.photos.map((photo, index) => (
                                <img key={index} src={photo.thumb} onClick={() => setMainImage(photo.full)} className={`h-20 w-20 object-cover rounded-md cursor-pointer ${mainImage === photo.full ? 'border-2 border-blue-500' : ''}`} alt={`Miniatura ${index + 1}`} />
                            ))}
                         </div>
                    </div>

                    {/* Listing Details */}
                    <div>
                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{listing.category}</span>
                        <h1 className="text-3xl font-bold my-2">{listing.title}</h1>
                        <p className="text-3xl font-bold text-blue-600 mb-4">{listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Precio a Consultar'}</p>
                        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{listing.description}</p>
                        
                        <VehicleDetails listing={listing} />

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold text-lg">Información del Vendedor</h3>
                            <Link to={`/profile/${listing.authorId}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                <img src={seller?.photoURL} alt={seller?.displayName} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">{seller?.displayName || 'Usuario'} {seller?.isVerified && <VerifiedIcon />}</p>
                                    <p className="text-sm text-gray-500">{listing.location}</p>
                                </div>
                            </Link>
                        </div>

                        {currentUser && (
                            <div className="mt-6">
                                <button onClick={handleSendMessage} disabled={isAuthor} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold transition disabled:bg-gray-400">
                                    {isAuthor ? "Este es tu anuncio" : "Enviar Mensaje"}
                                </button>
                            </div>
                        )}
                        {isAuthor && (
                            <div className="mt-4">
                                <Link to={`/edit-listing/${listing.id}`} className="block w-full text-center bg-gray-200 text-gray-800 py-3 rounded-lg font-bold transition hover:bg-gray-300">Editar Anuncio</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} />
        </>
    );
}

