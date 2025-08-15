import React, { createContext, useState, useEffect, useContext } from 'react';
// ✅ Import the necessary redirect functions
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getToken } from "firebase/messaging";
import { auth, db, googleProvider, facebookProvider, getFirebaseMessaging } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ This handles the result after the user is redirected back to your app
        getRedirectResult(auth)
            .catch((error) => {
                // Handle errors from the redirect flow here.
                console.error("Error processing redirect result:", error);
            });

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                } else {
                    const newUserProfile = {
                        displayName: currentUser.displayName || "Usuario Anónimo",
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        createdAt: serverTimestamp(),
                        location: "Ubicación no especificada",
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser({ uid: currentUser.uid, ...newUserProfile });
                }
                
                // Logic to get the notification token (FCM)
                try {
                    const messaging = await getFirebaseMessaging();
                    if (messaging) {
                        const currentToken = await getToken(messaging, { vapidKey: "BEmZeqVU-Ew145_Qg7BTHXm-Tj1e2lLgs2nRFLPICC_R8ul_PfXjVrIIfn9VHnUf4ycOYblQQMQLKEA55Kn4aX0" });
                        if (currentToken) {
                            await updateDoc(doc(db, "users", currentUser.uid), { fcmToken: currentToken });
                        }
                    }
                } catch (err) {
                    console.error("No se pudo obtener el token de notificación:", err);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ✅ Update the login functions to use signInWithRedirect
    const loginWithGoogle = () => signInWithRedirect(auth, googleProvider);
    const loginWithFacebook = () => signInWithRedirect(auth, facebookProvider);
    const logout = () => signOut(auth);

    const value = {
        user,
        loading,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        setUser // To update profile from AccountSettings
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};