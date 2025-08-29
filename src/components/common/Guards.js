import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta a tu AuthContext sea correcta

// Componente para mostrar mientras se verifica la sesión
const AuthLoader = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-700">Verificando sesión...</div>
    </div>
);

/**
 * PROTECTED ROUTE
 * Solo permite el acceso si el usuario está autenticado.
 */
export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Imprime el estado actual para depuración
    console.log(`ProtectedRoute en "${location.pathname}": loading=${loading}, user=${!!user}`);

    if (loading) {
        // Muestra el loader mientras Firebase confirma la sesión del usuario.
        // Esto es CRUCIAL para evitar la redirección prematura.
        console.log("ProtectedRoute: Mostrando Loader porque la autenticación está en curso.");
        return <AuthLoader />;
    }

    if (!user) {
        // Si no hay usuario y la carga ha terminado, redirige al login.
        console.log("ProtectedRoute: Redirigiendo a /login porque no hay usuario.");
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    
    // Si hay un usuario, permite el acceso.
    console.log("ProtectedRoute: Acceso permitido. Renderizando contenido.");
    return <Outlet />;
};

/**
 * PUBLIC ONLY ROUTE
 * Solo permite el acceso si el usuario NO está autenticado.
 */
export const PublicOnlyRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Imprime el estado actual para depuración
    console.log(`PublicOnlyRoute en "${location.pathname}": loading=${loading}, user=${!!user}`);

    if (loading) {
        // Muestra el loader para evitar mostrar la página de login a un usuario que ya está conectado.
        console.log("PublicOnlyRoute: Mostrando Loader porque la autenticación está en curso.");
        return <AuthLoader />;
    }

    if (user) {
        // Si el usuario ya inició sesión, lo redirige a su perfil.
        console.log("PublicOnlyRoute: Redirigiendo a /account porque el usuario ya está logueado.");
        return <Navigate to="/account" replace />;
    }

    // Si no hay usuario, permite el acceso.
    console.log("PublicOnlyRoute: Acceso permitido. Renderizando contenido.");
    return <Outlet />;
};
