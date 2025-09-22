// pages/BusinessDashboard.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Link } from 'react-router-dom';

export default function BusinessDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // 1. OBTENER SOLO LOS ANUNCIOS DEL USUARIO LOGUEADO
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "listings"), 
      where("ownerId", "==", user.uid) // ¡La clave está aquí!
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(userListings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. FUNCIÓN PARA ELIMINAR UN ANUNCIO
  const handleDelete = async (listingId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este anuncio?")) {
      try {
        await deleteDoc(doc(db, "listings", listingId));
        console.log("Anuncio eliminado con éxito");
      } catch (error) {
        console.error("Error al eliminar el anuncio: ", error);
      }
    }
  };

  if (loading) return <p>Cargando tu panel...</p>;

  // 3. MOSTRAR LA TABLA O LISTA DE PRODUCTOS
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-4">Panel de tu Tienda</h1>
      <Link to="/account/listings/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
        + Agregar Nuevo Anuncio
      </Link>

      <div className="mt-6">
        {listings.map(listing => (
          <div key={listing.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-2">
            <div>
              <p className="font-bold">{listing.title}</p>
              <p>Precio: ${listing.price}</p>
              <p>Cantidad: {listing.quantity || 'No especificada'}</p>
            </div>
            <div>
              <Link to={`/account/listings/${listing.id}/edit`} className="text-blue-500 mr-4">
                Editar
              </Link>
              <button onClick={() => handleDelete(listing.id)} className="text-red-500">
                Eliminar 🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}