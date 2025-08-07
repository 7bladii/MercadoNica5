import React from 'react';
import { VerifiedIcon, StarIcon, DiamondIcon, HeartIcon, GearIcon, PublicProfileIcon, DollarIcon, ShieldIcon, QuestionMarkIcon, BellIcon, ChevronRightIcon } from '../components/common/Icons';
import MenuItem from '../components/common/MenuItem';

export default function AccountPage({ user, setView, handleLogout }) {
    if (!user) return <p>Cargando perfil...</p>;

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<StarIcon key={i} filled={i <= rating} />);
        }
        return stars;
    };

    const handleNotImplemented = () => {
        alert("Esta función aún no está implementada.");
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:-m-8">
            <div className="p-4 max-w-3xl mx-auto">
                <h1 className="text-xl font-bold text-center py-4 md:hidden">Cuenta</h1>
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

                {/* --- BLOQUE PREMIUM COMENTADO --- */}
                {/* {user.isPremium ? (
                    <div onClick={() => setView({ page: 'premiumDashboard' })} className="mx-4 my-4 p-3 bg-violet-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-violet-700 transition-colors">
                        <div className="flex items-center space-x-3">
                            <DiamondIcon />
                            <span className="font-semibold">Ir a tu Panel Premium</span>
                        </div>
                        <ChevronRightIcon />
                    </div>
                ) : (
                    <div onClick={() => setView({ page: 'premiumUpgrade' })} className="mx-4 my-4 p-3 bg-gray-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                            <DiamondIcon />
                            <span className="font-semibold">Disfruta los beneficios Premium</span>
                        </div>
                        <ChevronRightIcon />
                    </div>
                )} */}

                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Guardados</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<HeartIcon isFavorite={true} className="w-6 h-6 text-gray-400" />} label="Artículos guardados" onClick={() => setView({ page: 'favorites' })} />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Cuenta</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<GearIcon />} label="Ajustes de cuenta" onClick={() => setView({ page: 'accountSettings' })} />
                        <MenuItem icon={<PublicProfileIcon />} label="Perfil público" onClick={() => setView({ page: 'publicProfile', userId: user.uid })} />
                        <MenuItem icon={<DollarIcon />} label="Mis Anuncios" onClick={() => setView({ page: 'myListings' })} />
                        <MenuItem icon={<ShieldIcon />} label="Términos y Políticas" onClick={handleNotImplemented} />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Notificaciones</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<BellIcon className="w-6 h-6 text-gray-400" />} label="Preferencias" onClick={() => setView({ page: 'notificationPreferences' })} />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Ayuda</h3>
                    <div className="bg-gray-800 rounded-lg">
                        <MenuItem icon={<QuestionMarkIcon />} label="Centro de ayuda" onClick={handleNotImplemented} />
                    </div>
                </div>
                <div className="px-4 mt-8 text-center">
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-semibold">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}