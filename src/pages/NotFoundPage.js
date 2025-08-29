import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="text-center py-20">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="text-2xl font-light text-gray-600 mt-4 mb-6">Página No Encontrada</p>
            <p className="text-gray-500">Lo sentimos, la página que buscas no existe.</p>
            <div className="mt-8">
                <Link 
                    to="/" 
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}