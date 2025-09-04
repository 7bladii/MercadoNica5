import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { SpinnerIcon, GoogleIcon } from '../components/common/Icons';

export default function LoginPage() {
    // --- ESTADOS PARA EL FORMULARIO ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

    // --- HOOKS DE AUTENTICACIÓN Y NAVEGACIÓN ---
    const { login, loginWithGoogle, user, loading } = useAuth();
    const navigate = useNavigate();

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
            // La redirección es manejada por el useEffect de arriba.
        } catch (err) {
            setError('Credenciales incorrectas. Por favor, verifica tus datos.');
            setIsSubmitting(false);
        }
    };

    // --- MANEJADOR PARA EL LOGIN CON GOOGLE ---
    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleSubmitting(true);
        try {
            await loginWithGoogle();
            // La redirección también es manejada por el useEffect.
        } catch (err) {
            console.error("Error en login con Google:", err);
            setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
            setIsGoogleSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Inicia Sesión</h2>

            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
            
            <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2 font-semibold">Correo electrónico</label>
                    <input
                        id="email"
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@correo.com"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-700 mb-2 font-semibold">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Tu contraseña"
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center font-bold"
                    disabled={isSubmitting || isGoogleSubmitting}
                >
                    {isSubmitting && <SpinnerIcon />}
                    {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
            
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 text-sm">o continúa con</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="flex flex-col space-y-3">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting || isGoogleSubmitting}
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
            
            <p className="text-center mt-6 text-gray-600">
                ¿No tienes una cuenta? <Link to="/signup" className="text-blue-600 hover:underline font-semibold">Regístrate aquí</Link>
            </p>
        </div>
    );
}

