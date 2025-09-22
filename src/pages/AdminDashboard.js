import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ Se importa Link para los botones de editar
import { collection, getCountFromServer, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // ✅ Se importa deleteDoc
import { db } from '../firebase/config';
import { VerifiedIcon } from '../components/common/Icons';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, listings: 0 });
    const [allUsers, setAllUsers] = useState([]);
    const [allListings, setAllListings] = useState([]); // ✅ Nuevo estado para guardar todos los anuncios
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // --- Carga de Estadísticas y Usuarios (sin cambios) ---
                const usersColl = collection(db, "users");
                const listingsColl = collection(db, "listings");
                const userSnapshot = await getCountFromServer(usersColl);
                const listingSnapshot = await getCountFromServer(listingsColl);
                setStats({ users: userSnapshot.data().count, listings: listingSnapshot.data().count });

                const usersQuery = query(usersColl, orderBy("displayName"));
                const usersData = await getDocs(usersQuery);
                setAllUsers(usersData.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // ✅ --- Carga de todos los Anuncios ---
                const listingsQuery = query(listingsColl, orderBy("createdAt", "desc"));
                const listingsData = await getDocs(listingsQuery);
                setAllListings(listingsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const toggleVerification = async (userId, currentStatus) => {
        // ... (sin cambios en esta función)
        const userRef = doc(db, "users", userId);
        try {
            await updateDoc(userRef, { isVerified: !currentStatus });
            setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
            alert(`Usuario ${!currentStatus ? 'verificado' : 'desverificado'} con éxito.`);
        } catch (error) {
            console.error("Error al cambiar la verificación:", error);
            alert("No se pudo actualizar el estado del usuario.");
        }
    };

    // ✅ --- Nueva función para Eliminar cualquier Anuncio ---
    const handleDeleteListing = async (listingId) => {
        if (window.confirm("¿Seguro que quieres eliminar este anuncio de forma permanente? Esta acción no se puede deshacer.")) {
            try {
                await deleteDoc(doc(db, "listings", listingId));
                setAllListings(allListings.filter(l => l.id !== listingId)); // Actualiza la UI
                alert("Anuncio eliminado con éxito.");
            } catch (error) {
                console.error("Error al eliminar el anuncio:", error);
                alert("No se pudo eliminar el anuncio.");
            }
        }
    };


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">Panel de Administrador</h1>
            {loading ? (<p>Cargando datos...</p>) : (
                <>
                    {/* --- Sección de Estadísticas (sin cambios) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <h2 className="text-xl font-semibold text-gray-600">Usuarios Totales</h2>
                            <p className="text-4xl font-bold mt-2">{stats.users}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <h2 className="text-xl font-semibold text-gray-600">Anuncios Totales</h2>
                            <p className="text-4xl font-bold mt-2">{stats.listings}</p>
                        </div>
                    </div>

                    {/* --- Sección de Gestión de Usuarios (sin cambios) --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                       {/* ... tu tabla de usuarios para verificar ... */}
                    </div>

                    {/* ✅ --- Nueva Sección para Gestionar Anuncios --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Gestionar Anuncios</h2>
                        <p className="text-gray-600 mb-4">Modifica o elimina cualquier anuncio de la plataforma. Usa esta herramienta con responsabilidad.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Anuncio</th>
                                        <th className="p-2">Vendedor</th>
                                        <th className="p-2">Precio</th>
                                        <th className="p-2 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allListings.map(listing => (
                                        <tr key={listing.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-semibold">{listing.title}</td>
                                            <td className="p-2 text-gray-600">{allUsers.find(u => u.id === listing.authorId)?.displayName || 'Usuario no encontrado'}</td>
                                            <td className="p-2 text-gray-600">${listing.price}</td>
                                            <td className="p-2 text-center space-x-2">
                                                <Link to={`/edit-listing/${listing.id}`} className="px-3 py-1 text-sm font-semibold rounded-md text-white bg-blue-500 hover:bg-blue-600">
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteListing(listing.id)}
                                                    className="px-3 py-1 text-sm font-semibold rounded-md text-white bg-red-500 hover:bg-red-600"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}