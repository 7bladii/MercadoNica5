import React from 'react';
import { ArrowLeftIcon } from './Icons';

export default function BackButton({ onClick }) {
    return (
        <button onClick={onClick} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-4">
            <ArrowLeftIcon /> Volver
        </button>
    );
}