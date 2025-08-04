import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SpinnerIcon } from '../components/common/Icons';

export default function PremiumUpgradePage({ user, setUser }) {
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async () => {
        if (!user) return;
        setIsUpgrading(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { isPremium: true });
            setUser(prev => ({ ...prev, isPremium: true }));
            alert("¡Felicidades! Ahora eres un miembro Premium.");
        } catch (error) {
            console.error("Error al actualizar a premium:", error);
            alert("Hubo un problema al procesar tu solicitud.");
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">🚀 Desbloquea tu Potencial con Premium</h1>
            <p className="text-gray-600 mb-8">Lleva tus ventas al siguiente nivel con herramientas exclusivas para vendedores serios.</p>

            <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">📊 Estadísticas Avanzadas</h3>
                    <p className="text-sm text-gray-600">Mira cuántas personas visitan y guardan tus anuncios en favoritos. Toma decisiones basadas en datos.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">⭐ Anuncios Destacados</h3>
                    <p className="text-sm text-gray-600">Haz que tus productos resalten en las búsquedas para atraer más compradores.</p>
                </div>
            </div>

            <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="bg-violet-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-violet-700 transition-colors w-full disabled:bg-violet-300"
            >
                {isUpgrading ? <SpinnerIcon /> : '¡Obtener Premium Ahora!'}
            </button>
            <p className="text-xs text-gray-500 mt-4">(Esto es una simulación para activar la funcionalidad)</p>
        </div>
    );
}