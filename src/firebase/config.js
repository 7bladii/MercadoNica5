import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported as messagingSupported } from "firebase/messaging";

// --- CONFIGURACIÓN SEGURA LEYENDO DESDE VARIABLES DE ENTORNO ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Singleton app: Previene reinicializaciones
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Servicios principales
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Servicios que dependen del navegador (inicialización defensiva)
let analytics = null;
let messaging = null;

if (typeof window !== "undefined") {
    analyticsSupported().then(supported => {
        if (supported) {
            try {
                analytics = getAnalytics(app);
            } catch (e) {
                console.warn("No se pudo inicializar Analytics:", e);
            }
        }
    });

    messagingSupported().then(supported => {
        if (supported) {
            try {
                messaging = getMessaging(app);
            } catch (e) {
                console.warn("No se pudo inicializar Messaging:", e);
            }
        }
    });
}

// Proveedores de autenticación
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Habilitar persistencia con manejo robusto
(async () => {
  try {
    await enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
    console.log("Persistencia de Firestore habilitada.");
  } catch (error) {
    if (error.code === "failed-precondition") {
      console.warn(
        "Múltiples pestañas abiertas; la persistencia de Firestore puede no estar activa."
      );
    } else if (error.code === "unimplemented") {
      console.warn("El navegador no soporta persistencia offline de Firestore.");
    } else {
      console.warn("Error al habilitar persistencia de Firestore:", error);
    }
  }
})();

export { auth, db, storage, analytics, messaging, googleProvider, facebookProvider };