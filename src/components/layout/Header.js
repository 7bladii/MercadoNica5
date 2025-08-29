import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// ✅ Se vuelve a importar GoogleIcon
import { MessagesIcon, PhoneIcon, GoogleIcon } from '../common/Icons';
import { ADMIN_UID } from '../../constants';

export default function Header() {
    // ✅ Se vuelve a incluir loginWithGoogle
    const { user, logout, loginWithGoogle } = useAuth();
    const notificationCount = 0; // Placeholder

    return (
        <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50 hidden md:block">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Lado Izquierdo: Logo */}
                <Link to="/" className="flex items-center cursor-pointer">
                    <span className="text-2xl font-bold text-blue-600">Mercado<span className="text-sky-500">Nica</span></span>
                </Link>

                {/* Lado Derecho: Enlaces de Navegación y Perfil */}
                <div className="flex items-center space-x-6">
                    {/* Enlace de Admin */}
                    {user && user.uid === ADMIN_UID && (
                        <Link to="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
                            Admin
                        </Link>
                    )}

                    {/* Botón de Mensajes */}
                    {user && (
                        <Link to="/messages" className="text-gray-600 hover:text-blue-600 font-semibold flex items-center space-x-2 relative">
                            <MessagesIcon isActive={false} hasNotification={notificationCount > 0} />
                            <span>Mensajes</span>
                        </Link>
                    )}

                    {user && <div className="w-px h-6 bg-gray-300"></div>}

                    {/* Menú de Perfil o Botones de Inicio de Sesión */}
                    {user ? (
                        <div className="relative group">
                            <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-10 h-10 rounded-full cursor-pointer" />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                                <span className="block px-4 py-2 text-sm text-gray-700 font-semibold truncate">{user.displayName}</span>
                                <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Cuenta</Link>
                                <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                             <Link to="/login" className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                                Iniciar Sesión
                             </Link>
                            {/* ✅ Se vuelve a añadir el botón de Google */}
                            <button onClick={loginWithGoogle} className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 border border-gray-300 transition-colors" title="Iniciar con Google">
                                <GoogleIcon />
                            </button>
                            <Link to="/login-phone" className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors" title="Iniciar con Teléfono">
                                <PhoneIcon />
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
