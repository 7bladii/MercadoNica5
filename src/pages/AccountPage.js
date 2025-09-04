import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { BriefcaseIcon, VerifiedIcon, StarIcon, DiamondIcon, HeartIcon, GearIcon, PublicProfileIcon, ListingsIcon, ShieldIcon, QuestionMarkIcon, BellIcon, ChevronRightIcon } from '../components/common/Icons';

// --- Componentes Internos ---

// Componente para el encabezado del perfil de usuario
const UserProfileHeader = ({ user }) => {
    const renderStars = (rating) => (
        Array.from({ length: 5 }, (_, index) => (
            <StarIcon key={index} filled={index < rating} />
        ))
    );

    return (
        <div className="flex items-center space-x-4 p-4">
            <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="Perfil" className="w-16 h-16 rounded-full" />
            <div className="flex-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    {user.displayName}
                    {user.isVerified && <VerifiedIcon />}
                </h2>
                <p className="text-sm text-gray-400">{user.location || 'Ubicación no definida'}</p>
                <div className="flex items-center mt-1">
                    <div className="flex">{renderStars(user.rating || 0)}</div>
                    <span className="text-xs text-gray-400 ml-2">({user.ratingCount || 0})</span>
                </div>
                <div className="flex space-x-4 text-sm mt-1">
                    <span><span className="font-bold">{user.followers || 0}</span> Seguidores</span>
                    <span><span className="font-bold">{user.following || 0}</span> Siguiendo</span>
                </div>
            </div>
        </div>
    );
};

// Componente "Esqueleto" para una mejor experiencia de carga
const AccountPageSkeleton = () => (
    <div className="bg-gray-900 text-white min-h-screen -m-4 md:m-0 md:rounded-lg">
        <div className="p-4 max-w-3xl mx-auto animate-pulse">
            <div className="flex items-center space-x-4 p-4">
                <div className="w-16 h-16 rounded-full bg-gray-700"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
            </div>
            <div className="px-4 mt-2 mb-4">
                <div className="h-14 bg-gray-800 rounded-lg"></div>
            </div>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="px-4 mt-6">
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="bg-gray-800 rounded-lg h-16"></div>
                </div>
            ))}
        </div>
    </div>
);

// Componente de Menú
const MenuItem = ({ icon, label, to, onClick }) => {
    const content = (
        <div className="flex items-center justify-between p-4 hover:bg-gray-700 transition-colors w-full">
            <div className="flex items-center space-x-4">
                {icon}
                <span className="text-white">{label}</span>
            </div>
            <ChevronRightIcon />
        </div>
    );

    return to ? <Link to={to}>{content}</Link> : <button onClick={onClick} className="w-full text-left">{content}</button>;
};


// --- Componente Principal de la Página ---

export default function AccountPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };
    
    if (!user) {
        return <AccountPageSkeleton />;
    }

    // Definición de la estructura del menú
    const menuSections = [
        {
            title: 'Negocio',
            items: user.businessId 
            ? [
                { 
                    icon: <BriefcaseIcon />, 
                    label: 'Administrar mi Tienda', 
                    to: `/tienda/${user.business?.slug}` 
                }
              ]
            : [
                { 
                    icon: <BriefcaseIcon />, 
                    label: 'Crear Perfil de Negocio', 
                    to: '/crear-tienda' 
                }
              ]
        },
        {
            title: 'Guardados',
            items: [
                { icon: <HeartIcon />, label: 'Artículos guardados', to: '/account/favorites' },
            ]
        },
        {
            title: 'Cuenta',
            items: [
                { icon: <GearIcon />, label: 'Ajustes de cuenta', to: '/account/settings' },
                { icon: <PublicProfileIcon />, label: 'Perfil público', to: `/profile/${user.uid}` },
                { icon: <ListingsIcon />, label: 'Mis Anuncios', to: '/account/my-listings' },
                { icon: <ShieldIcon />, label: 'Términos y Políticas', to: '/terms' },
            ]
        },
         {
            title: 'Notificaciones',
            items: [
                { icon: <BellIcon />, label: 'Preferencias', to: '/account/notifications' },
            ]
        },
        {
            title: 'Ayuda',
            items: [
                { icon: <QuestionMarkIcon />, label: 'Centro de ayuda', to: '/help' },
            ]
        }
    ];

    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:m-0 md:rounded-lg">
            <div className="p-4 max-w-3xl mx-auto">
                <h1 className="text-xl font-bold text-center py-4 md:hidden">Cuenta</h1>
                <UserProfileHeader user={user} />

                <div className="px-4 mt-2 mb-4">
                     <Link to={user.isPremium ? "/premium-dashboard" : "/premium-upgrade"} className="p-3 bg-gray-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                            <DiamondIcon />
                            <span className="font-semibold">
                                {user.isPremium ? 'Ir a tu Panel Premium' : 'Disfruta los beneficios Premium'}
                            </span>
                        </div>
                        <ChevronRightIcon />
                    </Link>
                </div>

                {menuSections.map((section) => (
                    <div key={section.title} className="px-4 mt-6">
                        <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">{section.title}</h3>
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            {section.items.map((item) => (
                                <MenuItem key={item.label} icon={item.icon} label={item.label} to={item.to} />
                            ))}
                        </div>
                    </div>
                ))}

                <div className="px-4 mt-8 pb-4 text-center">
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-semibold">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

