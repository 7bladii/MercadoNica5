import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext'; // Asegúrate que la ruta sea correcta
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    // --- ESTADOS PARA EL FORMULARIO ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // ✅ CAMBIO: Renombrado para evitar confusión con el 'loading' del contexto
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- HOOKS DE AUTENTICACIÓN Y NAVEGACIÓN ---
    // ✅ CAMBIO: Se obtiene el estado 'loading' global del contexto
    const { login, loginWithGoogle, user, loading } = useAuth();
    const navigate = useNavigate();

    // ✅ CAMBIO: El efecto ahora espera a que 'loading' sea false
    // Redirige al usuario si ya ha iniciado sesión, pero solo después de la verificación inicial.
    useEffect(() => {
        if (!loading && user) {
            navigate('/account', { replace: true });
        }
    }, [user, loading, navigate]);

    // --- MANEJADOR PARA EL LOGIN CON EMAIL Y CONTRASEÑA ---
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            // La redirección ahora es manejada de forma segura por el useEffect.
        } catch (err) {
            setError('Credenciales incorrectas. Por favor, verifica tus datos.');
            setIsSubmitting(false);
        }
    };

    // --- MANEJADOR PARA EL LOGIN CON GOOGLE ---
    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
            // La redirección también es manejada por el useEffect.
        } catch (err) {
            setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Inicia Sesión</h2>

            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            
            <form onSubmit={handleEmailLogin}>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Correo electrónico</label>
                    <input
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Contraseña</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
            
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500">o continúa con</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="flex flex-col space-y-3">
                <button
                    onClick={handleGoogleLogin}
                    className="bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors w-full flex items-center justify-center"
                >
                    <span>Iniciar Sesión con Google</span>
                </button>

                <Link
                    to="/login-phone"
                    className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors w-full flex items-center justify-center text-center"
                >
                    <span>Iniciar Sesión con Teléfono</span>
                </Link>
            </div>
            
            <p className="text-center mt-6">
                ¿No tienes una cuenta? <Link to="/signup" className="text-blue-500 hover:underline">Regístrate aquí</Link>
            </p>
        </div>
    );
}