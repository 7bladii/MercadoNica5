import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    CACHE_SIZE_UNLIMITED // Se importa para el caché ilimitado
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

// --- Configuración de Firebase desde variables de entorno ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// --- Inicialización Única y Robusta de la App ---
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// --- Servicios Principales ---
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// 🔥 CONFIGURACIÓN MEJORADA: Anti-errores 400 y caché ilimitado
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED, // Mejora para el uso offline
        tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true, // Evita errores 400 en redes restrictivas
    useFetchStreams: false, // Necesario con long-polling
});

// --- Servicios Asíncronos y Condicionales ---
let analytics = null;
let messaging = null;

async function getFirebaseAnalytics() {
    if (typeof window !== "undefined" && !analytics) {
        if (await isAnalyticsSupported()) {
            analytics = getAnalytics(app);
        }
    }
    return analytics;
}

async function getFirebaseMessaging() {
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

// --- Exportaciones para usar en toda la aplicación ---
export { 
    auth, 
    db, 
    storage, 
    googleProvider, 
    facebookProvider, 
    getFirebaseAnalytics, 
    getFirebaseMessaging 
};

