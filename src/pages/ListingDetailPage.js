import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc, updateDoc, increment, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, getFirebaseAnalytics } from '../firebase/config'; 
import { logEvent } from "firebase/analytics";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { useAuth } from '../components/context/AuthContext';
import { HeartIcon, VerifiedIcon, SpinnerIcon } from '../components/common/Icons'; // Asegúrate de tener estos componentes

export default function ListingDetailPage() {
    const { listingId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    
    // State for UI components
    const [mainImage, setMainImage] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    
    // State for Analytics
    const [analytics, setAnalytics] = useState(null);

    // Hook to initialize analytics asynchronously.
    useEffect(() => {
        const initializeAnalytics = async () => {
            const analyticsInstance = await getFirebaseAnalytics();
            if (analyticsInstance) {
                setAnalytics(analyticsInstance);
                logEvent(analyticsInstance, 'page_view', {
                    page_title: 'ListingDetail',
                    page_path: `/listing/${listingId}`,
                    listing_id: listingId
                });
            }
        };
        if (listingId) {
            initializeAnalytics();
        }
    }, [listingId]);

    // Main effect to fetch listing data and listen for real-time updates.
    useEffect(() => {
        if (!listingId) {
            setLoading(false);
            return;
        };

        const docRef = doc(db, "listings", listingId);

        const incrementViewCount = async () => {
            try {
                const docSnap = await getDoc(docRef);
                // Increment only if the viewer is not the author.
                if (docSnap.exists() && currentUser?.uid !== docSnap.data().authorId) {
                    await updateDoc(docRef, { viewCount: increment(1) });
                }
            } catch (error) {
                console.error("Error incrementing view count:", error);
            }
        };

        incrementViewCount();

        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = { id: doc.id, ...doc.data() };
                setListing(data);
                if (data.photos && data.photos.length > 0) {
                    setMainImage(data.photos[0].full);
                }
            } else {
                setListing(null); // Handle case where listing is deleted
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching listing:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [listingId, currentUser]);

    // Effect to fetch seller details and favorite status.
    useEffect(() => {
        if (!listing || !listing.authorId) return;

        // Fetch seller's profile
        const fetchSeller = async () => {
            const userRef = doc(db, "users", listing.authorId);
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setSeller(userSnap.data());
                }
            } catch (error) {
                console.error("Error fetching seller profile:", error);
            }
        };
        fetchSeller();

        // Check favorite status for the current user
        if (currentUser) {
            const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id);
            const unsub = onSnapshot(favRef, (doc) => {
                setIsFavorite(doc.exists());
            });
            return () => unsub();
        }
    }, [currentUser, listing]);

    const toggleFavorite = async (e) => {
        e.stopPropagation();
        if (!currentUser || !listing) return;
        
        const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id);
        const listingRef = doc(db, "listings", listing.id);

        try {
            if (isFavorite) {
                await deleteDoc(favRef);
                await updateDoc(listingRef, { favoriteCount: increment(-1) });
                if (analytics) logEvent(analytics, 'remove_from_favorites', { listing_id: listing.id });
            } else {
                await setDoc(favRef, { ...listing, addedAt: serverTimestamp() });
                await updateDoc(listingRef, { favoriteCount: increment(1) });
                if (analytics) logEvent(analytics, 'add_to_favorites', { listing_id: listing.id });
            }
        } catch (error) {
            console.error("Error updating favorite status:", error);
        }
    };

    const handleSendMessage = () => {
        if (!currentUser || !listing || !listing.authorId) return;
        if (analytics) {
            logEvent(analytics, 'send_message_click', {
                listing_id: listingId,
                recipient_id: listing.authorId
            });
        }
        // Navigate to the chat page, passing necessary info in state
        navigate('/messages', {
            state: {
                recipientId: listing.authorId,
                recipientName: seller?.displayName || 'Usuario',
                recipientPhotoURL: seller?.photoURL,
                listingId: listing.id,
                listingTitle: listing.title,
                listingPhotoURL: listing.photos?.[0]?.thumb || '',
            }
        });
    };
    
    const openLightboxOn = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    if (loading) return <div className="text-center p-10"><SpinnerIcon /> Cargando...</div>;
    if (!listing) return <p className="text-center p-10">Este anuncio no fue encontrado o ha sido eliminado.</p>;

    const isAuthor = currentUser?.uid === listing.authorId;
    const slides = listing.photos?.map(photo => ({ src: photo.full })) || [];

    return (
        <>
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div className="relative">
                        <img
                            src={mainImage || 'https://placehold.co/600x400?text=Sin+Imagen'}
                            alt={listing.title}
                            className="w-full h-80 object-cover rounded-lg mb-4 cursor-pointer"
                            onClick={() => openLightboxOn(0)}
                        />
                        {currentUser && !isAuthor && (
                            <button onClick={toggleFavorite} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md">
                                <HeartIcon isFavorite={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} />
                            </button>
                        )}
                        {listing.photos && listing.photos.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto">
                                {listing.photos.map((photo, index) => (
                                    <img
                                        key={photo.thumb || index}
                                        src={photo.thumb}
                                        onClick={() => setMainImage(photo.full)}
                                        className={`h-20 w-20 object-cover rounded-md cursor-pointer ${mainImage === photo.full ? 'border-2 border-blue-500' : ''}`}
                                        alt={`Miniatura ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Listing Details */}
                    <div>
                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{listing.category}</span>
                        <h1 className="text-3xl font-bold my-2">{listing.title}</h1>
                        <p className="text-3xl font-bold text-blue-600 mb-4">
                            {listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Precio a Consultar'}
                        </p>
                        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{listing.description || "No se agregó una descripción."}</p>

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold text-lg">Información del Vendedor</h3>
                            <Link to={`/profile/${listing.authorId}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                <img
                                    src={seller?.photoURL || `https://i.pravatar.cc/150?u=${listing.authorId}`}
                                    alt={seller?.displayName}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                                        {seller?.displayName || listing.guestName || 'Usuario'}
                                        {seller?.isVerified && <VerifiedIcon />}
                                    </p>
                                    <p className="text-sm text-gray-500">{listing.location}</p>
                                </div>
                            </Link>
                        </div>

                        {currentUser && (
                            <div className="mt-6 space-y-4">
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isAuthor}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isAuthor ? "Este es tu anuncio" : "Enviar Mensaje"}
                                </button>
                            </div>
                        )}
                        {isAuthor && (
                             <div className="mt-6">
                                <Link to={`/edit-listing/${listing.id}`} className="block w-full text-center bg-gray-200 text-gray-800 py-3 rounded-lg font-bold transition hover:bg-gray-300">
                                    Editar Anuncio
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />
        </>
    );
}
