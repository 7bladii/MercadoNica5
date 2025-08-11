import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Crea o encuentra un chat, potencialmente vinculado a un anuncio específico.
 *
 * @param {object} params - Los parámetros para la función.
 * @param {import("firebase/firestore").Firestore} params.db - La instancia de Firestore.
 * @param {object} params.currentUser - El usuario que inicia la sesión.
 * @param {string} params.recipientId - El ID del destinatario.
 * @param {string} params.recipientName - El nombre del destinatario.
 * @param {string|null} params.recipientPhotoURL - La URL de la foto del destinatario.
 * @param {string|null} [params.listingId] - (Opcional) El ID del anuncio para vincular el chat.
 * @param {string} [params.listingTitle] - (Opcional) El título del anuncio.
 * @param {number|null} [params.listingPrice] - (Opcional) El precio del anuncio.
 * @param {string|null} [params.listingThumb] - (Opcional) La miniatura del anuncio.
 *
 * @returns {Promise<string>} El ID del chat como una cadena de texto.
 */
export async function createOrGetChat({
  db,
  currentUser,
  recipientId,
  recipientName,
  recipientPhotoURL,
  listingId = null,
  listingTitle = "",
  listingPrice = null,
  listingThumb = null
}) {
  // --- Validaciones de entrada ---
  if (!db) throw new Error("La instancia de la base de datos (db) es requerida.");
  if (!currentUser?.uid) throw new Error("El ID del usuario actual (currentUser.uid) es requerido.");
  if (!recipientId) throw new Error("El ID del destinatario (recipientId) es requerido.");

  // --- Generación del ID del Chat ---
  // Se crea un ID base ordenando los UIDs de los participantes.
  const baseId = [currentUser.uid, recipientId].sort().join("_");
  // Si se proporciona un listingId, se añade al ID base para crear un chat único por anuncio.
  const chatId = listingId ? `${baseId}_${listingId}` : baseId;

  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  const now = serverTimestamp();

  // --- Preparación de los Datos del Chat ---
  const listingInfo = listingId
    ? { id: listingId, title: listingTitle, price: listingPrice, thumb: listingThumb, sellerId: recipientId }
    : null;

  const chatData = {
    participantIds: [currentUser.uid, recipientId], // ✅ Este campo coincide con las reglas.
    participantInfo: {
      [currentUser.uid]: {
        displayName: currentUser.displayName || "Usuario",
        photoURL: currentUser.photoURL || `https://i.pravatar.cc/150?u=${currentUser.uid}`
      },
      [recipientId]: {
        displayName: recipientName || "Vendedor",
        photoURL: recipientPhotoURL || null
      }
    },
    listingInfo: listingInfo,
    updatedAt: now,
  };

  if (!snap.exists()) {
    // Si el chat no existe, se crea con todos los datos iniciales.
    await setDoc(chatRef, {
      ...chatData,
      createdAt: now,
      lastMessage: null,
      lastMessageAt: null,
      unreadCounts: { [currentUser.uid]: 0, [recipientId]: 0 },
    });
  } else {
    // Si el chat ya existe, solo se actualizan los datos que podrían haber cambiado.
    await updateDoc(chatRef, chatData);
  }

  // Devuelve únicamente el ID del chat como un string.
  return chatId;
}
