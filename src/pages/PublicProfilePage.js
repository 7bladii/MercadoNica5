import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // ✅ 1. Importar useParams para leer la URL
import { doc, getDocs, collection, query, where, orderBy, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext'; // ✅ Se importa useAuth
import ListingCard from '../components/listings/ListingCard';
import { StarIcon, VerifiedIcon, PhoneIcon, EmailIcon, FollowIcon } from '../components/common/Icons';

const StarRating = ({ rating = 0, count = 0 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(<StarIcon key={i} filled={i <= rating} />);
    }
    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="flex">{stars}</div>
            {count > 0 && <span className="text-gray-400">({count})</span>}
        </div>
    );
};

export default function PublicProfilePage() { // ✅ Se eliminan los props que no se usan
    const { userId } = useParams(); // ✅ 2. Obtener el userId de la URL
    const { user: currentUser } = useAuth(); // ✅ Se obtiene el usuario actual del contexto de autenticación

    const [profile, setProfile] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    // Cargar datos del perfil en tiempo real
    useEffect(() => {
        if (!userId) {
            setLoading(false); // Si no hay userId, dejar de cargar
            return;
        }
        const profileDocRef = doc(db, 'users', userId);
        
        const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            } else {
                setProfile(null); // Si el perfil no existe, establécelo a null
            }
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar el perfil público:", error);
            setLoading(false);
        });

        // Cargar los anuncios una sola vez
        const fetchListings = async () => {
             try {
                 const listingsQuery = query(collection(db, 'listings'), where('authorId', '==', userId), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
                 const listingsSnapshot = await getDocs(listingsQuery);
                 setUserListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
             } catch (error) {
                  console.error("Error al cargar los anuncios del usuario:", error);
             }
        };
        fetchListings();

        return () => unsubscribeProfile();
    }, [userId]);

    // Verificar si el usuario actual ya sigue a este perfil
    useEffect(() => {
        if (!currentUser || !userId || currentUser.uid === userId) return;
        const followingRef = doc(db, "users", currentUser.uid, "following", userId);
        const unsubscribe = onSnapshot(followingRef, (doc) => {
            setIsFollowing(doc.exists());
        });
        return () => unsubscribe();
    }, [currentUser, userId]);
    
    // Función para seguir/dejar de seguir
    const handleFollow = useCallback(async () => {
        if (!currentUser) {
            alert("Necesitas iniciar sesión para seguir a un usuario.");
            return;
        }
        
        const originalIsFollowing = isFollowing;
        setIsFollowing(!originalIsFollowing);

        const batch = writeBatch(db);
        const currentUserFollowingRef = doc(db, "users", currentUser.uid, "following", userId);
        const profileUserFollowersRef = doc(db, "users", userId, "followers", currentUser.uid);

        if (originalIsFollowing) {
            batch.delete(currentUserFollowingRef);
            batch.delete(profileUserFollowersRef);
        } else {
            batch.set(currentUserFollowingRef, { followedAt: serverTimestamp() });
            batch.set(profileUserFollowersRef, { followedBy: currentUser.uid, followedAt: serverTimestamp() });
        }

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error al seguir/dejar de seguir:", error);
            setIsFollowing(originalIsFollowing); 
            alert("Hubo un error al procesar la solicitud.");
        }
    }, [currentUser, userId, isFollowing]);


    if (loading) return <div className="text-center p-10">Cargando perfil...</div>;
    if (!profile) return <div className="text-center p-10">Este usuario no fue encontrado.</div>;
    
    const compliments = profile.compliments || [];

    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:-m-8">
            <div className="max-w-3xl mx-auto p-4">
                
                <div className="flex items-start space-x-4 mb-6">
                    <img src={profile.photoURL || `https://i.pravatar.cc/150?u=${userId}`} alt={profile.displayName} className="w-20 h-20 rounded-full border-2 border-gray-700" />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2">{profile.displayName} {profile.isVerified && <VerifiedIcon className="h-6 w-6 text-cyan-400" />}</h1>
                        <p className="text-gray-400">Se unió en {profile.createdAt?.toDate().toLocaleDateString('es-NI', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-gray-400">{profile.location || 'Ubicación no especificada'}</p>
                        <StarRating rating={profile.ratingAverage || 0} count={profile.ratingCount || 0} />
                    </div>
                </div>

                <div className="grid grid-cols-4 text-center mb-6">
                    <div><p className="font-bold text-lg">{profile.boughtCount || 0}</p><p className="text-sm text-gray-400">Comprado</p></div>
                    <div><p className="font-bold text-lg">{profile.soldCount || 0}</p><p className="text-sm text-gray-400">Vendido</p></div>
                    <div><p className="font-bold text-lg">{profile.followersCount || 0}</p><p className="text-sm text-gray-400">Seguidores</p></div>
                    <div><p className="font-bold text-lg">{profile.followingCount || 0}</p><p className="text-sm text-gray-400">Siguiendo</p></div>
                </div>

                {currentUser && currentUser.uid !== userId && (
                    <div className="mb-6">
                        <button 
                            onClick={handleFollow} 
                            className={`w-full ${isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-teal-500 hover:bg-teal-600'} text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2`}
                        >
                            <FollowIcon />
                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 text-center mb-8 border-t border-b border-gray-700 py-4">
                    <div><p className="font-semibold">Responde en minutos</p><p className="text-sm text-gray-400">Tiempo de respuesta</p></div>
                    <div><p className="font-semibold">Activo en la última hora</p><p className="text-sm text-gray-400">Actividad</p></div>
                </div>
                <div className="flex justify-center items-center space-x-8 mb-8">
                    <div className="flex items-center space-x-2 text-gray-400"><PhoneIcon className="h-5 w-5"/> <span>Teléfono confirmado</span></div>
                    <div className="flex items-center space-x-2 text-gray-400"><EmailIcon className="h-5 w-5"/> <span>Email confirmado</span></div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Cumplidos</h2>
                    {compliments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {compliments.map((comp, index) => (
                                <div key={index} className="bg-gray-700 rounded-full px-4 py-2 flex items-center space-x-2">
                                    <span className="bg-gray-800 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{comp.count}</span>
                                    <span className="text-sm">{comp.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">Aún no hay cumplidos.</p>}
                </div>
                
                <div>
                    <h2 className="text-xl font-bold mb-4">Artículos de este vendedor</h2>
                    {userListings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {userListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} user={currentUser} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Este vendedor no tiene artículos activos.</p>
                    )}
                </div>
            </div>
        </div>
    );
}