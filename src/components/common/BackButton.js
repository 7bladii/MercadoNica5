import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

const BackButton = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <button
            onClick={handleGoBack}
            // ✅ CAMBIO: Se han añadido clases para hacerlo pegajoso (sticky)
            className="sticky top-20 z-10 flex items-center bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <ArrowLeftIcon />
            Regresar
        </button>
    );
};

export default BackButton;