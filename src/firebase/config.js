import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
// ✅ CAMBIO 1: Se importa la función correcta para persistencia multi-pestaña.
import { getFirestore, enableMultiTabIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// --- SERVICIOS DE FIREBASE ---
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Proveedores de autenticación
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// --- INICIALIZACIÓN ASÍNCRONA Y CONDICIONAL DE SERVICIOS ---
let analytics = null;
let messaging = null;

export async function getFirebaseAnalytics() {
    if (typeof window !== "undefined" && !analytics) {
        if (await isAnalyticsSupported()) {
            analytics = getAnalytics(app);
        }
    }
    return analytics;
}

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
(async () => {
    try {
        // ✅ CAMBIO 2: Se llama a la función que soporta múltiples pestañas.
        await enableMultiTabIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
        console.log("Persistencia de Firestore (multi-pestaña) habilitada para uso offline.");
    } catch (error) {
        if (error.code === "failed-precondition") {
            console.warn("Persistencia fallida: Múltiples pestañas abiertas con persistencia incompatible.");
        } else if (error.code === "unimplemented") {
            console.warn("Persistencia fallida: El navegador actual no soporta la persistencia offline de Firestore.");
        } else {
            console.warn("Error al habilitar la persistencia de Firestore:", error);
        }
    }
})();

export { auth, db, storage, googleProvider, facebookProvider };