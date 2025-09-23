import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { SpinnerIcon, GoogleIcon } from '../components/common/Icons';

export default function LoginPage() {
    // --- ESTADOS ---
    // Se eliminaron los estados 'email', 'password' y 'isSubmitting' que pertenecían al formulario removido.
    const [error, setError] = useState('');
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

    // --- HOOKS DE AUTENTICACIÓN Y NAVEGACIÓN ---
    // Se eliminó la función 'login' que ya no se usa.
    const { loginWithGoogle, user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirige al usuario si ya ha iniciado sesión.
    useEffect(() => {
        if (!loading && user) {
            navigate('/account', { replace: true });
        }
    }, [user, loading, navigate]);

    // --- MANEJADOR PARA EL LOGIN CON EMAIL Y CONTRASEÑA (REMOVIDO) ---
    // La función 'handleEmailLogin' fue eliminada por completo.

    // --- MANEJADOR PARA EL LOGIN CON GOOGLE ---
    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleSubmitting(true);
        try {
            await loginWithGoogle();
            // La redirección es manejada por el useEffect.
        } catch (err) {
            console.error("Error en login con Google:", err);
            setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
            setIsGoogleSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-8">Inicia Sesión</h2>

            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
            
            {/* --- SECCIÓN DE FORMULARIO REMOVIDA --- */}
            {/* El <form> para email y contraseña ha sido eliminado. */}
            {/* El divisor "o continúa con" también ha sido eliminado. */}
            
            <div className="flex flex-col space-y-4">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleSubmitting}
                    className="bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors w-full flex items-center justify-center disabled:bg-gray-200"
                >
                    {isGoogleSubmitting ? (
                        <SpinnerIcon />
                    ) : (
                        <GoogleIcon className="w-5 h-5 mr-3" />
                    )}
                    <span>{isGoogleSubmitting ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>

                <Link
                    to="/login-phone"
                    className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors w-full flex items-center justify-center text-center"
                >
                    <span>Iniciar Sesión con Teléfono</span>
                </Link>
            </div>
            
            <p className="text-center mt-8 text-gray-600">
                ¿No tienes una cuenta? <Link to="/signup" className="text-blue-600 hover:underline font-semibold">Regístrate aquí</Link>
            </p>
        </div>
    );
}