import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithRedirect,
    signInWithPopup, // ✅ CAMBIO: Importado para el nuevo flujo de login
    getRedirectResult,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                    } else {
                        const newUserProfile = {
                            displayName: currentUser.displayName || "Usuario Anónimo",
                            email: currentUser.email,
                            photoURL: currentUser.photoURL || 'https://via.placeholder.com/150',
                            createdAt: serverTimestamp(),
                            location: "Ubicación no especificada",
                        };
                        await setDoc(userDocRef, newUserProfile);
                        setUser({ uid: currentUser.uid, ...newUserProfile });
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Ocurrió un error al gestionar el perfil del usuario:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        getRedirectResult(auth).catch((error) => {
            console.error("Error al procesar el resultado del redirect:", error);
        });

        return () => unsubscribe();
    }, []);

    const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);

    const login = async (email, password) => {
        await setPersistence(auth, browserLocalPersistence);
        return signInWithEmailAndPassword(auth, email, password);
    };

    // ✅ CAMBIO: Función actualizada para intentar popup y luego redirect.
    const loginWithGoogle = async () => {
        await setPersistence(auth, browserLocalPersistence);
        try {
            console.log('[Auth] Intentando iniciar sesión con popup de Google…');
            const res = await signInWithPopup(auth, googleProvider);
            console.log('[Auth] Popup exitoso:', res.user?.uid);
            return res;
        } catch (e) {
            console.warn('[Auth] Error con el popup:', e.code);
            // Si el popup es bloqueado, usamos la redirección como alternativa.
            if (e.code === 'auth/popup-blocked' ||
                e.code === 'auth/operation-not-supported-in-this-environment' ||
                e.code === 'auth/cancelled-popup-request') {
                console.log('[Auth] Usando redirección como alternativa…');
                // No necesitamos un 'await' aquí porque la página va a recargar.
                signInWithRedirect(auth, googleProvider);
            } else {
                // Si el error es otro (ej. credencial inválida), lo lanzamos.
                throw e;
            }
        }
    };
    
    const logout = () => signOut(auth);

    const value = { user, loading, signup, login, loginWithGoogle, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};