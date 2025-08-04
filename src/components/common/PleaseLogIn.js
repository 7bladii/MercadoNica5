import React from 'react';
import { FacebookIcon, GoogleIcon } from './Icons';

export default function PleaseLogIn({ onLogin, onFacebookLogin }) {
    return (
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Inicia Sesión para Continuar</h2>
            <p className="text-gray-600 mb-6">Elige tu método preferido para acceder a esta página.</p>
            <div className="flex flex-col space-y-3">
                <button
                    onClick={onFacebookLogin}
                    className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
                >
                    <FacebookIcon />
                    <span className="ml-2">Iniciar Sesión con Facebook</span>
                </button>
                <button
                    onClick={onLogin}
                    className="bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors w-full flex items-center justify-center"
                >
                    <GoogleIcon />
                    <span className="ml-2">Iniciar Sesión con Google</span>
                </button>
            </div>
        </div>
    );
}