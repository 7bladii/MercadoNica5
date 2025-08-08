import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, increment, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, analytics } from '../firebase/config';
import { logEvent } from "firebase/analytics";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { HeartIcon, VerifiedIcon } from '../components/common/Icons';
import { createOrGetChat } from '../services/chatService';

export default function ListingDetailPage({ listingId, currentUser, navigateToMessages, setView }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [seller, setSeller] = useState(null);

    // Efecto para cargar los datos del anuncio y contar la vista
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

    // Efecto para cargar los datos del vendedor y el estado de favorito
    useEffect(() => {
        if (!listing || !listing.userId) return; // Añadida verificación para listing.userId

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

    // Función para añadir o quitar de favoritos
    const toggleFavorite = async (e) => {
        e.stopPropagation();
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
            console.error("Error al cambiar estado de favorito:", error);
        }
    };

    const openLightboxOn = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleReportListing = () => {
        logEvent(analytics, 'report_listing_click', { listing_id: listingId, user_id: currentUser?.uid });
        alert("Función para reportar en desarrollo. ¡Gracias por ayudarnos a mantener la comunidad segura!");
    };
    
    // --- FUNCIÓN 'handleSendMessage' CORREGIDA Y FINAL ---
    const handleSendMessage = async () => {
        if (!currentUser || !listing || !listing.userId) {
            alert("No se puede iniciar el chat. Faltan datos del usuario o del anuncio.");
            return;
        }

        try {
            // 1. Crea o encuentra el chat
            const { chatId, chatData } = await createOrGetChat({
                currentUser: currentUser,
                recipientId: listing.userId,
                recipientName: seller?.displayName || 'Usuario',
                recipientPhotoURL: seller?.photoURL || `https://i.pravatar.cc/150?u=${listing.userId}`,
                listingId: listing.id,
                listingTitle: listing.title,
                listingPhotoURL: listing.photos?.[0]?.thumb || ''
            });

            // 2. Llama a la función de navegación del padre CON TODOS LOS DATOS
            navigateToMessages({ chatId, chatData, currentUser });

        } catch (error) {
            console.error("Error al iniciar el chat:", error);
            alert("Ocurrió un problema al cargar o iniciar el chat.");
        }
    };

    if (loading) return <p className="text-center p-10">Cargando anuncio...</p>;
    if (!listing) return <p className="text-center p-10">Anuncio no encontrado o ha sido eliminado.</p>;

    const isJob = listing.type === 'trabajo';
    const publisherLabel = isJob ? 'Reclutador' : 'Vendedor';
    const slides = listing.photos?.map(photo => ({ src: photo.full })) || [];
    const pageUrl = window.location.href;
    const shareText = `¡Mira este anuncio en MercadoNica: ${listing.title}!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

    return (
        <>
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna de Imágenes */}
                    <div className="relative">
                        <img src={mainImage || 'https://placehold.co/600x400'} alt={listing.title} className="w-full h-80 object-cover rounded-lg mb-4 cursor-pointer" onClick={() => openLightboxOn(listing.photos.findIndex(p => p.full === mainImage))} />
                        {currentUser && (<button onClick={toggleFavorite} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"><HeartIcon isFavorite={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} /></button>)}
                        {listing.photos && listing.photos.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto">
                                {listing.photos.map((photo, index) => (
                                    <img key={index} src={photo.thumb} onClick={() => setMainImage(photo.full)} className={`h-20 w-20 object-cover rounded-md cursor-pointer ${mainImage === photo.full ? 'border-2 border-blue-500' : ''}`} alt={`Thumbnail ${index + 1}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna de Información */}
                    <div>
                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{listing.category}</span>
                        <h1 className="text-3xl font-bold my-2">{listing.title}</h1>

                        {isJob && (
                            <div className="text-xl font-semibold text-gray-700 mb-1 cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setView({ page: 'companyProfile', userId: listing.userId })} >
                                {listing.companyName || listing.userName}
                            </div>
                        )}

                        <p className="text-3xl font-bold text-blue-600 mb-4">{isJob ? (listing.salary || 'Salario a convenir') : (listing.price ? `C$ ${new Intl.NumberFormat('es-NI').format(listing.price)}` : 'Precio a Consultar')}</p>

                        {currentUser?.isPremium && currentUser.uid === listing.userId && (
                            <div className="my-4 p-4 border rounded-md bg-violet-50 text-violet-800">
                                <h3 className="font-semibold text-lg mb-2">Estadísticas Premium</h3>
                                <div className="flex justify-around text-center">
                                    <div><p className="font-bold text-2xl">{listing.viewCount || 0}</p><p className="text-sm">Vistas</p></div>
                                    <div><p className="font-bold text-2xl">{listing.favoriteCount || 0}</p><p className="text-sm">Favoritos</p></div>
                                </div>
                            </div>
                        )}

                        {(listing.make || listing.model || listing.year) && (
                            <div className="mb-4 p-4 border rounded-md bg-gray-50">
                                <h3 className="font-semibold text-lg mb-2">Detalles del Vehículo</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {listing.make && <p><strong>Marca:</strong> {listing.make}</p>}
                                    {listing.model && <p><strong>Modelo:</strong> {listing.model}</p>}
                                    {listing.year && <p><strong>Año:</strong> {listing.year}</p>}
                                    {listing.mileage && <p><strong>Kilometraje:</strong> {listing.mileage} km</p>}
                                </div>
                            </div>
                        )}

                        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{listing.description || "No se agregó una descripción."}</p>

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold text-lg">Información del {publisherLabel}</h3>
                            <div className="flex items-center space-x-3 p-2 rounded-lg">
                                <img src={seller?.photoURL || `https://i.pravatar.cc/150?u=${listing.userId}`} alt={seller?.displayName} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-800 cursor-pointer hover:underline flex items-center gap-2" onClick={() => setView({ page: 'publicProfile', userId: listing.userId })}>
                                        {seller?.displayName || 'Usuario'}
                                        {seller?.isVerified && <VerifiedIcon />}
                                    </p>
                                    <p className="text-sm text-gray-500">{listing.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Solo muestra el bloque si hay un usuario logueado */}
                        {currentUser && (
                            <div className="mt-6 space-y-4">
                                <button
                                    onClick={handleSendMessage}
                                    // Deshabilita el botón si eres el dueño del anuncio
                                    disabled={currentUser.uid === listing.userId}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {/* Cambia el texto del botón si eres el dueño */}
                                    {currentUser.uid === listing.userId
                                        ? "Este es tu anuncio"
                                        : "Enviar Mensaje"}
                                </button>
                                
                                {/* Se mantiene la lógica para el botón de aplicar a trabajos */}
                                {isJob && listing.applicationContact && (
                                    <a href={listing.applicationContact.startsWith('http') ? listing.applicationContact : `mailto:${listing.applicationContact}`} target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold transition">Aplicar (Email/Link)</a>
                                )}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t flex flex-col items-center gap-4">
                            <h4 className="font-semibold text-gray-700">Compartir este anuncio</h4>
                            <div className="flex justify-center items-center space-x-4">
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-green-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors">WhatsApp</a>
                                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-blue-800 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-900 transition-colors">Facebook</a>
                            </div>
                            <button onClick={handleReportListing} className="text-sm text-gray-500 hover:text-red-600 hover:underline mt-4">Reportar este anuncio</button>
                        </div>
                    </div>
                </div>
            </div>
            <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />
        </>
    );
}