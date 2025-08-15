import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to access the user

// You will need to import your icons, for example:
// import { HomeIcon, PlusCircleIcon, ChatBubbleLeftEllipsisIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const BottomNavBar = () => {
    const { user } = useAuth(); // Get the current user

    // This function lets NavLink apply different styles if the link is active
    const getNavLinkClass = ({ isActive }) => {
        return isActive
            ? 'flex flex-col items-center justify-center text-blue-600' // Style for the active link
            : 'flex flex-col items-center justify-center text-gray-500 hover:text-blue-600'; // Style for inactive links
    };

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                <NavLink to="/" className={getNavLinkClass} end>
                    {/* <HomeIcon className="w-6 h-6" /> */}
                    <span className="text-sm">Inicio</span>
                </NavLink>

                <NavLink to="/publish" className={getNavLinkClass}>
                    {/* <PlusCircleIcon className="w-6 h-6" /> */}
                    <span className="text-sm">Publicar</span>
                </NavLink>

                <NavLink to="/messages" className={getNavLinkClass}>
                    {/* <ChatBubbleLeftEllipsisIcon className="w-6 h-6" /> */}
                    <span className="text-sm">Mensajes</span>
                </NavLink>

                <NavLink to={user ? "/account" : "/"} className={getNavLinkClass}>
                    {/* <UserCircleIcon className="w-6 h-6" /> */}
                    <span className="text-sm">{user ? 'Cuenta' : 'Ingresar'}</span>
                </NavLink>
            </div>
        </div>
    );
};

export default BottomNavBar;