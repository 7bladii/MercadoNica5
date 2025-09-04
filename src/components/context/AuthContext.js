import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // perfil + (opcional) negocio
  const [loading, setLoading] = useState(true); // carga inicial
  const [error, setError] = useState(null);

  // refs para gestionar suscripciones vivas
  const unsubProfileRef = useRef(null);
  const unsubBusinessRef = useRef(null);
  const currentBusinessIdRef = useRef(null);

  useEffect(() => {
    // Persistencia local (idempotente)
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const cleanupProfile = () => {
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
    };
    const cleanupBusiness = () => {
      if (unsubBusinessRef.current) {
        unsubBusinessRef.current();
        unsubBusinessRef.current = null;
      }
      currentBusinessIdRef.current = null;
    };

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // cambia usuario: limpia listeners anteriores
      cleanupProfile();
      cleanupBusiness();

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', fbUser.uid);

      // escucha del perfil
      unsubProfileRef.current = onSnapshot(
        userRef,
        async (snap) => {
          const authData = {
            uid: fbUser.uid,
            displayName: fbUser.displayName ?? null,
            email: fbUser.email ?? null,
            photoURL: fbUser.photoURL ?? null,
          };

          // crea perfil si no existe (merge para no pisar nada)
          if (!snap.exists()) {
            const baseProfile = {
              displayName: authData.displayName ?? 'Usuario',
              email: authData.email,
              photoURL: authData.photoURL ?? `https://i.pravatar.cc/150?u=${fbUser.uid}`,
              isAdmin: false,
              isPremium: false,
              businessId: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            };
            try {
              await setDoc(userRef, baseProfile, { merge: true });
            } catch (e) {
              console.error('[Auth] Error creando perfil:', e);
              setError(e);
            }
            // Render inmediato con perfil base (sin negocio aún)
            setUser({ ...authData, ...baseProfile, business: null });
            setLoading(false);
            return;
          }

          const data = snap.data();

          // Render inmediato con perfil existente
          const baseUser = {
            ...authData,
            ...data,
            business: null,
          };
          setUser(baseUser);
          setLoading(false);

          // Si hay businessId y cambió, re-suscríbete
          if (data.businessId) {
            if (currentBusinessIdRef.current !== data.businessId) {
              cleanupBusiness();
              currentBusinessIdRef.current = data.businessId;

              const bRef = doc(db, 'businesses', data.businessId);
              unsubBusinessRef.current = onSnapshot(
                bRef,
                (bSnap) => {
                  if (bSnap.exists()) {
                    setUser((prev) => ({
                      ...(prev ?? baseUser),
                      business: { id: bSnap.id, ...bSnap.data() },
                    }));
                  } else {
                    setUser((prev) => ({ ...(prev ?? baseUser), business: null }));
                  }
                },
                (e) => {
                  console.error('[Auth] Error oyendo negocio:', e);
                  setError(e);
                }
              );
            }
          } else {
            // no hay negocio: asegúrate de limpiar si había uno
            cleanupBusiness();
            setUser((prev) => ({ ...(prev ?? baseUser), business: null }));
          }
        },
        (e) => {
          console.error('[Auth] Error oyendo perfil:', e);
          setError(e);
          setUser(null);
          setLoading(false);
        }
      );
    });

    // procesa redirect (móvil)
    getRedirectResult(auth).catch((e) => {
      // No es fatal para la app; lo logueamos
      console.warn('[Auth] Redirect result error:', e?.code || e);
      setError(e);
    });

    return () => {
      unsubAuth();
      cleanupProfile();
      cleanupBusiness();
    };
  }, []);

  // --- acciones de auth ---
  const signup = async (email, password) => {
    setError(null);
    await setPersistence(auth, browserLocalPersistence);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    setError(null);
    await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    setError(null);
    await setPersistence(auth, browserLocalPersistence);
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // fallback típico para móvil o si bloquean popups
      if (
        e?.code === 'auth/popup-blocked' ||
        e?.code === 'auth/operation-not-supported-in-this-environment' ||
        e?.code === 'auth/cancelled-popup-request'
      ) {
        return signInWithRedirect(auth, googleProvider);
      }
      throw e;
    }
  };

  const logout = async () => {
    setError(null);
    return signOut(auth);
  };

  const value = useMemo(
    () => ({ user, loading, error, signup, login, loginWithGoogle, logout }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

