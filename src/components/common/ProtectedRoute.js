import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Se elimina el componente PleaseLogIn, ahora se redirige.
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        // ✅ CAMBIO: Si no hay usuario, redirige a la página de login.
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
