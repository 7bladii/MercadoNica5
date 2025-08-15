import React from 'react';
import { useAuth } from '../../context/AuthContext';
import PleaseLogIn from './PleaseLogIn';

const ProtectedRoute = ({ children }) => {
    const { user, loginWithGoogle, loginWithFacebook } = useAuth();

    if (!user) {
        // Option 1: Redirect to a login page
        // import { Navigate } from 'react-router-dom';
        // return <Navigate to="/login" replace />;

        // Option 2: Show the PleaseLogIn component on the same route
        return <PleaseLogIn onLogin={loginWithGoogle} onFacebookLogin={loginWithFacebook} />;
    }

    return children;
};

export default ProtectedRoute;