import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Inicia o navega a un chat existente entre dos usuarios de forma atómica.
 * Si el chat no existe, lo crea. Si existe, lo actualiza con la nueva info del anuncio.
 * @param {object} options - Opciones para el chat.
 * @returns {Promise<object>} Un objeto con el chatId y los datos del chat.
 */
export const createOrGetChat = async ({
    currentUser,
    recipientId,
    recipientName,
    recipientPhotoURL,
    listingId,
    listingTitle,
    listingPhotoURL
}) => {
    if (!currentUser || !currentUser.uid) {
        throw new Error("Usuario actual no autenticado o no disponible.");
    }
    if (!recipientId) {
        throw new Error("ID del destinatario no proporcionado.");
    }

    const currentUserId = currentUser.uid;
    const sortedIds = [currentUserId, recipientId].sort();
    const chatId = sortedIds.join('_');
    const chatRef = doc(db, "chats", chatId);

    try {
        // Ejecutar la operación como una transacción atómica
        const chatData = await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(chatRef);

            if (docSnap.exists()) {
                // --- INICIO DE LA LÓGICA CORREGIDA ---
                console.log("Transacción: Chat existente encontrado. Actualizando info del anuncio.");
                const existingData = docSnap.data();
                
                // Prepara la información del nuevo anuncio
                const newListingInfo = listingId ? {
                    id: listingId,
                    title: listingTitle,
                    photoURL: listingPhotoURL
                } : existingData.listingInfo; // Mantiene la info anterior si no hay nueva

                // Actualiza el documento con la nueva info y la fecha
                transaction.update(chatRef, {
                    listingInfo: newListingInfo,
                    updatedAt: serverTimestamp()
                });

                // Devuelve los datos existentes fusionados con la nueva información
                return { id: docSnap.id, ...existingData, listingInfo: newListingInfo };
                // --- FIN DE LA LÓGICA CORREGIDA ---

            } else {
                // El chat no existe, crear uno nuevo (esta parte ya estaba bien)
                console.log("Transacción: Creando nuevo chat con ID:", chatId);
                const newChatData = {
                    participants: sortedIds,
                    participantInfo: {
                        [currentUserId]: {
                            displayName: currentUser.displayName || "Usuario",
                            photoURL: currentUser.photoURL || `https://i.pravatar.cc/150?u=${currentUserId}`,
                        },
                        [recipientId]: {
                            displayName: recipientName || "Usuario",
                            photoURL: recipientPhotoURL || `https://i.pravatar.cc/150?u=${recipientId}`,
                        }
                    },
                    lastMessage: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    listingInfo: listingId ? {
                        id: listingId,
                        title: listingTitle,
                        photoURL: listingPhotoURL
                    } : null
                };

                transaction.set(chatRef, newChatData);
                return { id: chatId, ...newChatData };
            }
        });

        return { chatId, chatData };

    } catch (error) {
        console.error("Error en la transacción de createOrGetChat:", error);
        throw error;
    }
};