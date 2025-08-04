import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-white/80 backdrop-blur-sm mt-12 py-6 border-t hidden md:block">
            <div className="container mx-auto text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} MercadoNica. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}