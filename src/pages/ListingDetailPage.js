import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, increment, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// ✅ CORRECCIÓN 1: Importar la FUNCIÓN para obtener analytics, no la variable.
import { db, getFirebaseAnalytics } from '../firebase/config'; 
import { logEvent } from "firebase/analytics";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { HeartIcon, VerifiedIcon } from '../components/common/Icons';

export default function ListingDetailPage({ listingId, currentUser, navigateToMessages, setView }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [seller, setSeller] = useState(null);
    // ✅ CORRECCIÓN 2: Añadir un estado para guardar la instancia de analytics.
    const [analytics, setAnalytics] = useState(null);

    // ✅ CORRECCIÓN 3: Hook para inicializar analytics de forma asíncrona.
    useEffect(() => {
        const initializeAnalytics = async () => {
            // Se obtiene la instancia de forma segura.
            const analyticsInstance = await getFirebaseAnalytics();
            if (analyticsInstance) {
                setAnalytics(analyticsInstance); // Se guarda en el estado.
                logEvent(analyticsInstance, 'page_view', {
                    page_title: 'ListingDetail',
                    page_path: `/listings/${listingId}`,
                    listing_id: listingId
                });
            }
        };
        initializeAnalytics();
    }, [listingId]); // Se ejecuta cada vez que el ID del anuncio cambia.

    useEffect(() => {
        const docRef = doc(db, "listings", listingId);
        const incrementViewCount = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && currentUser?.uid !== docSnap.data().userId) {
                    await updateDoc(docRef, { viewCount: increment(1) });
                }
            } catch (error) {
                console.error("Error al incrementar vistas:", error);
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
            }
            setLoading(false);
        }, (error) => {
            console.error("Error al leer el anuncio:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [listingId, currentUser]);

    useEffect(() => {
        if (!listing || !listing.userId) return;
        const fetchSeller = async () => {
            const userRef = doc(db, "users", listing.userId);
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setSeller(userSnap.data());
                }
            } catch (error) {
                console.error("Error al leer perfil del vendedor:", error);
            }
        };

        fetchSeller();

        if (currentUser) {
            const favRef = doc(db, "users", currentUser.uid, "favorites", listing.id);
            const unsub = onSnapshot(favRef, (doc) => {
                setIsFavorite(doc.exists());
            }, (error) => {
                console.error("Error al leer favoritos:", error);
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
                // ✅ Log event only if analytics is initialized
                if (analytics) logEvent(analytics, 'remove_from_favorites', { listing_id: listing.id });
            } else {
                await setDoc(favRef, { ...listing, addedAt: serverTimestamp() });
                await updateDoc(listingRef, { favoriteCount: increment(1) });
                // ✅ Log event only if analytics is initialized
                if (analytics) logEvent(analytics, 'add_to_favorites', { listing_id: listing.id });
            }
        } catch (error) {
            console.error("Error al cambiar estado de favorito:", error);
        }
    };

    const openLightboxOn = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleReportListing = () => {
        // ✅ CORRECCIÓN 4: Usar la instancia de analytics del estado y verificar que no sea null.
        if (analytics) {
            logEvent(analytics, 'report_listing_click', {
                listing_id: listingId,
                user_id: currentUser?.uid
            });
        }
        alert("Función para reportar en desarrollo.");
    };

    const handleSendMessage = () => {
        if (!currentUser || !listing || !listing.userId) {
            alert("No se puede iniciar el chat. Faltan datos del usuario o del anuncio.");
            return;
        }

        // ✅ Log event only if analytics is initialized
        if (analytics) {
            logEvent(analytics, 'send_message_click', {
                listing_id: listingId,
                recipient_id: listing.userId
            });
        }

        navigateToMessages({
            recipientId: listing.userId,
            recipientName: seller?.displayName,
            recipientPhotoURL: seller?.photoURL,
            listingId: listing.id,
            listingTitle: listing.title,
            listingPhotoURL: listing.photos?.[0]?.thumb || '',
        });
    };

    if (loading) return <p className="text-center p-10">Cargando anuncio...</p>;
    if (!listing) return <p className="text-center p-10">Anuncio no encontrado.</p>;

    const isJob = listing.type === 'trabajo';
    const publisherLabel = isJob ? 'Reclutador' : 'Vendedor';
    const slides = listing.photos?.map(photo => ({ src: photo.full })) || [];

    return (
        <>
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative">
                        <img
                            src={mainImage || 'https://placehold.co/600x400'}
                            alt={listing.title}
                            className="w-full h-80 object-cover rounded-lg mb-4 cursor-pointer"
                            onClick={() => openLightboxOn(0)}
                        />
                        {currentUser && (
                            <button
                                onClick={toggleFavorite}
                                className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"
                            >
                                <HeartIcon
                                    isFavorite={isFavorite}
                                    className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                                />
                            </button>
                        )}
                        {listing.photos && listing.photos.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto">
                                {listing.photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo.thumb}
                                        onClick={() => setMainImage(photo.full)}
                                        className={`h-20 w-20 object-cover rounded-md cursor-pointer ${mainImage === photo.full ? 'border-2 border-blue-500' : ''}`}
                                        alt={`Thumbnail ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {listing.category}
                        </span>
                        <h1 className="text-3xl font-bold my-2">{listing.title}</h1>
                        <p className="text-3xl font-bold text-blue-600 mb-4">
                            {listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Precio a Consultar'}
                        </p>
                        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{listing.description || "No se agregó una descripción."}</p>

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold text-lg">Información del {publisherLabel}</h3>
                            <div className="flex items-center space-x-3 p-2 rounded-lg">
                                <img
                                    src={seller?.photoURL || `https://i.pravatar.cc/150?u=${listing.userId}`}
                                    alt={seller?.displayName}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <p
                                        className="font-semibold text-gray-800 cursor-pointer hover:underline flex items-center gap-2"
                                        onClick={() => setView({ page: 'publicProfile', userId: listing.userId })}
                                    >
                                        {seller?.displayName || listing.userName || 'Usuario'}
                                        {seller?.isVerified && <VerifiedIcon />}
                                    </p>
                                    <p className="text-sm text-gray-500">{listing.location}</p>
                                </div>
                            </div>
                        </div>

                        {currentUser && (
                            <div className="mt-6 space-y-4">
                                <button
                                    onClick={handleSendMessage}
                                    disabled={currentUser.uid === listing.userId}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {currentUser.uid === listing.userId ? "Este es tu anuncio" : "Enviar Mensaje"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />
        </>
    );
}
