// services/chatService.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function createOrGetChat({
  db,
  currentUser,          // { uid, displayName?, photoURL? }
  recipientId,          // string (uid vendedor)
  recipientName,        // string
  recipientPhotoURL,    // string|null
  listingId,            // string
  listingTitle,         // string
  listingPrice = null,  // number|null
  listingThumb = null   // string|null (url miniatura)
}) {
  if (!db) throw new Error("db requerido");
  if (!currentUser?.uid) throw new Error("currentUser.uid requerido");
  if (!recipientId) throw new Error("recipientId requerido");
  if (!listingId) throw new Error("listingId requerido");

  const a = currentUser.uid;
  const b = recipientId;
  const base = [a, b].sort().join("_");
  const chatId = `${base}_${listingId}`;
  const chatRef = doc(db, "chats", chatId);

  const snap = await getDoc(chatRef);

  // Construimos EXACTAMENTE los campos permitidos por las reglas
  const now = serverTimestamp();
  const chatData = {
    participants: [a, b],
    participantInfo: {
      [a]: {
        displayName: currentUser.displayName || "Usuario",
        photoURL: currentUser.photoURL || `https://i.pravatar.cc/150?u=${a}`
      },
      [b]: {
        displayName: recipientName || "Vendedor",
        photoURL: recipientPhotoURL || null
      }
    },
    listingInfo: {
      listingId,
      title: listingTitle || "",
      price: listingPrice,
      thumb: listingThumb,
      sellerId: recipientId
    },
    createdAt: now,
    lastMessage: null,
    lastUpdated: now,

    // Campos opcionales permitidos por las reglas (si no los usas, puedes quitarlos)
    unreadBy: [],   // ej. array de uids con mensajes no leídos
    typing: {},     // ej. { uid: boolean }
    lastRead: {}    // ej. { uid: Timestamp }
  };

  if (!snap.exists()) {
    await setDoc(chatRef, chatData);               // CREATE (solo claves permitidas)
  } else {
    // UPDATE solo de claves permitidas: lastMessage/lastUpdated/participantInfo/listingInfo/unreadBy/typing/lastRead
    await updateDoc(chatRef, {
      lastUpdated: now,
      participantInfo: chatData.participantInfo,
      listingInfo: chatData.listingInfo
    });
  }

  // Devuelve datos necesarios al caller
  return { chatId, chatData: (snap.exists() ? snap.data() : chatData) };
}
