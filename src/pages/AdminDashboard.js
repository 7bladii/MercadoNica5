import React, { useState, useEffect } from 'react';
import { collection, getCountFromServer, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { VerifiedIcon } from '../components/common/Icons';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, listings: 0 });
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const usersColl = collection(db, "users");
                const listingsColl = collection(db, "listings");
                const userSnapshot = await getCountFromServer(usersColl);
                const listingSnapshot = await getCountFromServer(listingsColl);
                setStats({ users: userSnapshot.data().count, listings: listingSnapshot.data().count });

                const usersQuery = query(usersColl, orderBy("displayName"));
                const usersData = await getDocs(usersQuery);
                setAllUsers(usersData.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const toggleVerification = async (userId, currentStatus) => {
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

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">Panel de Administrador</h1>
            {loading ? (<p>Cargando datos...</p>) : (
                <>
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

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Gestionar Verificación de Vendedores</h2>
                        <p className="text-gray-600 mb-4">Otorga o revoca la insignia de "Vendedor Verificado". Esto dará más confianza a los compradores.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Usuario</th>
                                        <th className="p-2">Email</th>
                                        <th className="p-2 text-center">Estado</th>
                                        <th className="p-2 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(u => (
                                        <tr key={u.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-semibold flex items-center gap-2">
                                                {u.displayName}
                                                {u.isVerified && <VerifiedIcon />}
                                            </td>
                                            <td className="p-2 text-gray-600">{u.email}</td>
                                            <td className="p-2 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {u.isVerified ? 'Verificado' : 'No Verificado'}
                                                </span>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => toggleVerification(u.id, u.isVerified)}
                                                    className={`px-3 py-1 text-sm font-semibold rounded-md text-white ${u.isVerified ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                                                >
                                                    {u.isVerified ? 'Revocar' : 'Verificar'}
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