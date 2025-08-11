import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// --- INICIALIZACIÓN ÚNICA (SINGLETON PATTERN) ---
// Se comprueba si la app ya fue inicializada para evitar errores.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// --- SERVICIOS DE FIREBASE ---
// Servicios principales que están disponibles en cualquier entorno.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Proveedores de autenticación
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// --- INICIALIZACIÓN ASÍNCRONA Y CONDICIONAL DE SERVICIOS ---
// Analytics y Messaging solo funcionan en el navegador, por lo que se inicializan de forma "perezosa" (lazy).
// Esto evita que la aplicación se rompa en entornos de servidor o en navegadores no compatibles.
let analytics = null;
let messaging = null;

/**
 * Obtiene la instancia de Firebase Analytics de forma segura y asíncrona.
 * Solo se inicializa una vez si el navegador lo soporta.
 * @returns {Promise<import("firebase/analytics").Analytics | null>} La instancia de Analytics o null.
 */
export async function getFirebaseAnalytics() {
  if (typeof window !== "undefined" && !analytics) {
    if (await isAnalyticsSupported()) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
}

/**
 * Obtiene la instancia de Firebase Messaging de forma segura y asíncrona.
 * Solo se inicializa una vez si el navegador lo soporta.
 * @returns {Promise<import("firebase/messaging").Messaging | null>} La instancia de Messaging o null.
 */
export async function getFirebaseMessaging() {
  if (typeof window !== "undefined" && !messaging) {
    if (await isMessagingSupported()) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("No se pudo inicializar Firebase Messaging:", e);
      }
    }
  }
  return messaging;
}

// --- HABILITAR PERSISTENCIA OFFLINE ---
// Se intenta habilitar la persistencia en IndexedDB para que la app funcione sin conexión.
// El código maneja los errores comunes, como tener múltiples pestañas abiertas.
(async () => {
  try {
    await enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
    console.log("Persistencia de Firestore habilitada para uso offline.");
  } catch (error) {
    if (error.code === "failed-precondition") {
      console.warn("Persistencia fallida: Múltiples pestañas abiertas. La persistencia solo se activa en una pestaña a la vez.");
    } else if (error.code === "unimplemented") {
      console.warn("Persistencia fallida: El navegador actual no soporta la persistencia offline de Firestore.");
    } else {
      console.warn("Error al habilitar la persistencia de Firestore:", error);
    }
  }
})();

export { auth, db, storage, googleProvider, facebookProvider };
