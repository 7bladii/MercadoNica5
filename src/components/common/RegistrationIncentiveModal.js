// src/components/common/RegistrationIncentiveModal.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationIncentiveModal = ({ email, onClose }) => {
    const navigate = useNavigate();

    const handleRegister = () => {
        // Redirigimos a la página de login/registro y pasamos el email en la URL
        // para autocompletar el campo.
        navigate(`/login?email=${encodeURIComponent(email)}&action=register`);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">¡Tu anuncio ha sido publicado!</h2>
                <p className="text-gray-700 mb-6">
                    Para poder editar tu anuncio, chatear con interesados y recibir notificaciones, 
                    te recomendamos crear una cuenta gratuita.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleRegister}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        Crear una cuenta (con {email})
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
                    >
                        No, gracias
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationIncentiveModal;