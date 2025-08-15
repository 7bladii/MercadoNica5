import React from 'react';
// ✅ Se importa Link para navegar a la página de inicio de sesión por teléfono
import { Link } from 'react-router-dom';
// ✅ Se importa el hook de autenticación para obtener las funciones de login
import { useAuth } from '../../context/AuthContext';
// ✅ Se importan los íconos necesarios
import { GoogleIcon, PhoneIcon } from './Icons';

// ✅ Se eliminan los props, el componente ahora obtiene todo del contexto
export default function PleaseLogIn() {
    const { loginWithGoogle } = useAuth();

    return (
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-4">Inicia Sesión para Continuar</h2>
            <p className="text-gray-600 mb-6">Elige tu método preferido para acceder a esta página.</p>
            <div className="flex flex-col space-y-3">
                <button
                    onClick={loginWithGoogle}
                    className="bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors w-full flex items-center justify-center"
                >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                    <span>Iniciar Sesión con Google</span>
                </button>

                {/* ✅ Botón de Facebook eliminado y reemplazado por el de Teléfono */}
                <Link
                    to="/login-phone"
                    className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors w-full flex items-center justify-center"
                >
                    <PhoneIcon className="w-5 h-5 mr-3" />
                    <span>Iniciar Sesión con Teléfono</span>
                </Link>
            </div>
        </div>
    );
}
