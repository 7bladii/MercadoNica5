import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-semibold text-gray-600 hover:text-blue-600 focus:outline-none"
        >
            <ArrowLeftIcon />
            Regresar
        </button>
    );
};
export default BackButton;