import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, MessagesIcon, PlusCircleIcon, ListingsIcon, AccountIcon } from '../common/Icons';

export default function BottomNavBar({ hasUnreadMessages }) {
    const { user } = useAuth();

    const getNavLinkClass = ({ isActive }) =>
        `flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        }`;

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto font-medium">
                
                <NavLink to="/" className={getNavLinkClass} end>
                    {({ isActive }) => (
                        <>
                            <HomeIcon isActive={isActive} />
                            <span className="text-xs">Inicio</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/publish" className={getNavLinkClass}>
                     {({ isActive }) => (
                        <>
                            {/* ✅ Se añade el prop 'isActive' para consistencia */}
                            <PlusCircleIcon isActive={isActive} />
                            <span className="text-xs">Publicar</span>
                        </>
                    )}
                </NavLink>
                
                <NavLink to="/messages" className={getNavLinkClass}>
                     {({ isActive }) => (
                        <>
                            <MessagesIcon isActive={isActive} hasNotification={hasUnreadMessages} />
                            <span className="text-xs">Mensajes</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/listings" className={getNavLinkClass}>
                     {({ isActive }) => (
                        <>
                            <ListingsIcon isActive={isActive} />
                            <span className="text-xs">Anuncios</span>
                        </>
                    )}
                </NavLink>

                <NavLink to={user ? "/account" : "/login-phone"} className={getNavLinkClass}>
                     {({ isActive }) => (
                        <>
                            <AccountIcon isActive={isActive} />
                            <span className="text-xs">{user ? 'Cuenta' : 'Ingresar'}</span>
                        </>
                    )}
                </NavLink>
            </div>
        </div>
    );
};
