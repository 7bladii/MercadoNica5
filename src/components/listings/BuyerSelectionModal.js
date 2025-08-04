import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Asegúrate de que la ruta sea correcta

// Props corregidos: ahora recibe el 'listing' completo, 'onConfirm' y 'onCancel'
export default function BuyerSelectionModal({ listing, onConfirm, onCancel }) {
    const [potentialBuyers, setPotentialBuyers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPotentialBuyers = async () => {
            if (!listing) return;
            setLoading(true);
            try {
                // Usamos listing.userId y listing.id que vienen en el prop
                const chatsQuery = query(
                    collection(db, "chats"),
                    where("participants", "array-contains", listing.userId),
                    where("listingId", "==", listing.id) // Asumiendo que guardas listingId en el chat
                );
                const chatsSnapshot = await getDocs(chatsQuery);
                
                const buyerIds = new Set();
                chatsSnapshot.forEach(doc => {
                    // La lógica para encontrar al otro participante es correcta
                    const buyerId = doc.data().participants.find(p => p !== listing.userId);
                    if (buyerId) {
                        buyerIds.add(buyerId);
                    }
                });

                if (buyerIds.size > 0) {
                    const usersQuery = query(collection(db, "users"), where("__name__", "in", Array.from(buyerIds)));
                    const usersSnapshot = await getDocs(usersQuery);
                    setPotentialBuyers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    setPotentialBuyers([]);
                }
            } catch (error) {
                console.error("Error fetching potential buyers:", error);
            }
            setLoading(false);
        };

        fetchPotentialBuyers();
    }, [listing]);

    const filteredBuyers = potentialBuyers.filter(buyer =>
        buyer.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-xl font-bold mb-4">¿Quién fue el comprador?</h3>
                <p className="text-sm text-gray-600 mb-4">Selecciona al usuario que compró este artículo para actualizar las estadísticas de ambos.</p>
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm mb-4"
                />
                <div className="max-h-60 overflow-y-auto border rounded-md">
                    {loading ? (
                        <p className="p-4 text-center text-gray-500">Buscando compradores...</p>
                    ) : (
                        filteredBuyers.length > 0 ? (
                            <ul>
                                {filteredBuyers.map(buyer => (
                                    <li
                                        key={buyer.id}
                                        // Corregido: Llamamos a onConfirm con el ID del comprador
                                        onClick={() => onConfirm(buyer.id)}
                                        className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                    >
                                        <img src={buyer.photoURL || `https://i.pravatar.cc/150?u=${buyer.id}`} alt={buyer.displayName} className="w-10 h-10 rounded-full mr-3" />
                                        <span>{buyer.displayName}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-4 text-center text-gray-500">No se encontraron usuarios en tus chats para este anuncio.</p>
                        )
                    )}
                </div>
                <div className="flex justify-between items-center mt-6">
                    <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                    {/* Corregido: Llamamos a onConfirm con 'null' si no hay comprador */}
                    <button onClick={() => onConfirm(null)} className="text-sm text-blue-600 hover:underline">
                        Marcar sin comprador
                    </button>
                </div>
            </div>
        </div>
    );
}