import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, PhoneIcon } from '../components/common/Icons';

export default function LoginPage() {
    const { loginWithGoogle } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-lg mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Inicia Sesión</h2>
            <p className="text-gray-600 mb-6">Elige tu método preferido para ingresar a MercadoNica.</p>
            
            <div className="w-full space-y-3">
                {/* Botón de Google */}
                <button 
                    onClick={loginWithGoogle} 
                    className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                    Continuar con Google
                </button>

                {/* Botón de Teléfono */}
                <Link 
                    to="/login-phone"
                    className="w-full flex items-center justify-center bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                    <PhoneIcon className="w-5 h-5 mr-3" />
                    Continuar con Teléfono
                </Link>
            </div>
        </div>
    );
}
