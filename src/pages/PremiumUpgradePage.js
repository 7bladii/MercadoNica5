import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DiamondIcon } from '../components/common/Icons';

// --- MEJORA 1: Centralizar la configuración ---
const PREMIUM_PLAN = {
    name: 'Premium',
    priceDisplay: '$9.99',
    amountInCents: 999,
    currency: 'USD',
    description: 'Desbloquea estadísticas de tus anuncios, mejora tu visibilidad en las búsquedas y mucho más.'
};

// --- MEJORA 2: Inicializar Firebase Functions una sola vez ---
const functions = getFunctions();
const createTilopayCharge = httpsCallable(functions, 'createTilopayCharge');


export default function PremiumUpgradePage({ user }) {
    // --- NUEVO: Ocultar el componente completamente ---
    return null;

    // El código de la función `handleUpgrade` y el JSX de la interfaz se mantienen intactos aquí abajo
    // pero no se ejecutarán ni renderizarán debido a la línea `return null;`
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);

        if (!user || !user.uid) {
            setError("Debes iniciar sesión para actualizar tu cuenta.");
            setLoading(false);
            return;
        }

        try {
            const result = await createTilopayCharge({
                amount: PREMIUM_PLAN.amountInCents,
                currency: PREMIUM_PLAN.currency,
                userId: user.uid,
                planName: PREMIUM_PLAN.name
            });
            
            const { url } = result.data;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No se recibió una URL de pago desde el servidor.");
            }
        } catch (err) {
            console.error("Error al iniciar el proceso de pago:", err);
            setError("No se pudo iniciar el proceso de pago. Por favor, inténtalo de nuevo más tarde.");
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <DiamondIcon className="h-16 w-16 text-violet-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Conviértete en {PREMIUM_PLAN.name}</h1>
            <p className="text-gray-600 mb-6">{PREMIUM_PLAN.description}</p>
            
            <div className="my-6 p-4 bg-gray-50 rounded-lg">
                <span className="text-4xl font-bold text-gray-900">{PREMIUM_PLAN.priceDisplay}</span>
                <span className="text-gray-500"> / mes</span>
            </div>

            <button
                onClick={handleUpgrade}
                disabled={loading || !user}
                className="w-full bg-violet-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-violet-700 transition disabled:bg-violet-300 disabled:cursor-not-allowed"
            >
                {loading ? 'Procesando...' : `Actualizar a ${PREMIUM_PLAN.name}`}
            </button>

            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
}