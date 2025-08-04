import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, increment, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import ConfirmationModal from '../components/common/ConfirmationModal';
import BuyerSelectionModal from '../components/listings/BuyerSelectionModal';

export default function MyListings({ user, setView }) {
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [buyerSelection, setBuyerSelection] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "listings"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = useCallback(async (listingToDelete) => {
        if (!listingToDelete) return;
        try {
            // Borra las fotos de Firebase Storage
            if (listingToDelete.photos && listingToDelete.photos.length > 0) {
                const deletePromises = listingToDelete.photos.map(photo => {
                    try {
                        const fullRef = ref(storage, photo.full);
                        const thumbRef = ref(storage, photo.thumb);
                        return Promise.all([deleteObject(fullRef), deleteObject(thumbRef)]);
                    } catch (e) {
                        console.warn("No se pudo borrar una de las fotos:", e.message);
                        return Promise.resolve(); // Continúa aunque una foto falle
                    }
                });
                await Promise.all(deletePromises);
            }
            // Borra el documento del anuncio de Firestore
            await deleteDoc(doc(db, "listings", listingToDelete.id));
            alert("Anuncio eliminado con éxito.");
        } catch (error) {
            console.error("Error eliminando el anuncio:", error);
            alert("Hubo un error al eliminar el anuncio.");
        } finally {
            setShowDeleteModal(null);
        }
    }, []);

    const handleMarkAsSold = useCallback(async (listingToMark, buyerId) => {
        if (!listingToMark) return;

        try {
            const batch = writeBatch(db);
            const listingRef = doc(db, "listings", listingToMark.id);
            const sellerRef = doc(db, "users", user.uid);

            // Operaciones comunes: actualizar anuncio e incrementar ventas del vendedor
            batch.update(listingRef, { 
                status: 'sold',
                buyerId: buyerId || null // Guarda el buyerId o null
            });
            batch.update(sellerRef, { soldCount: increment(1) });

            // Solo incrementamos 'boughtCount' si se seleccionó un comprador
            if (buyerId) {
                const buyerRef = doc(db, "users", buyerId);
                batch.update(buyerRef, { boughtCount: increment(1) });
            }
            
            await batch.commit();
            alert("Anuncio marcado como vendido y contadores actualizados.");

        } catch (error) {
            console.error("Error marcando como vendido:", error);
            alert("Error al actualizar. La operación fue revertida.");
        } finally {
            setBuyerSelection(null);
        }
    }, [user]);

    return (
        <>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Mis Anuncios</h2>
                {loading ? <p>Cargando tus anuncios...</p> : !myListings.length ? <p>Aún no has publicado ningún anuncio.</p> :
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {myListings.map(listing => (
                            <div key={listing.id} className={`border rounded-lg shadow-md flex flex-col justify-between transition-opacity ${listing.status !== 'active' ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                                <div>
                                    <img src={listing.photos?.[0]?.thumb || `https://placehold.co/300x200/e2e8f0/64748b?text=MercadoNica`} className="w-full h-40 object-cover rounded-t-lg" alt={listing.title} />
                                    <div className="p-3">
                                        <h3 className="font-bold truncate">{listing.title}</h3>
                                        <p className="text-sm text-gray-600">C$ {new Intl.NumberFormat('es-NI').format(listing.price)}</p>
                                        {listing.status === 'sold' && <p className="mt-1 text-sm font-bold text-green-600">VENDIDO</p>}
                                        {listing.status === 'paused' && <p className="mt-1 text-sm font-bold text-yellow-600">PAUSADO</p>}
                                    </div>
                                </div>
                                <div className="p-3 border-t grid grid-cols-2 gap-2">
                                    <button onClick={() => setView({ page: 'publish', listingId: listing.id })} className="w-full bg-blue-500 text-white text-xs font-semibold py-2 rounded-md hover:bg-blue-600 transition">Editar</button>
                                    <button onClick={() => setShowDeleteModal(listing)} className="w-full bg-red-500 text-white text-xs font-semibold py-2 rounded-md hover:bg-red-600 transition">Eliminar</button>
                                    {listing.status === 'active' && 
                                      <button 
                                        onClick={() => setBuyerSelection(listing)} 
                                        className="col-span-2 w-full bg-green-500 text-white text-sm font-semibold py-2 rounded-md hover:bg-green-600 transition"
                                      >
                                        Marcar como Vendido
                                      </button>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>

            {showDeleteModal && (
                <ConfirmationModal 
                    message="¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer." 
                    onConfirm={() => handleDelete(showDeleteModal)} 
                    onCancel={() => setShowDeleteModal(null)} 
                />
            )}

            {buyerSelection && (
                <BuyerSelectionModal 
                    listing={buyerSelection}
                    onConfirm={(buyerId) => handleMarkAsSold(buyerSelection, buyerId)}
                    onCancel={() => setBuyerSelection(null)}
                />
            )}
        </>
    );
}