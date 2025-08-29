import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { VerifiedIcon, StarIcon, DiamondIcon, HeartIcon, GearIcon, PublicProfileIcon, ListingsIcon, ShieldIcon, QuestionMarkIcon, BellIcon, ChevronRightIcon } from '../components/common/Icons';

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

export default function AccountPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };
    
    if (!user) return <p className="text-center p-10 text-white">Cargando perfil...</p>;

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<StarIcon key={i} filled={i <= rating} />);
        }
        return stars;
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen -m-4 md:m-0 md:rounded-lg">
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

                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Guardados</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <MenuItem icon={<HeartIcon isFavorite={true} className="w-6 h-6 text-gray-400" />} label="Artículos guardados" to="/account/favorites" />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Cuenta</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <MenuItem icon={<GearIcon />} label="Ajustes de cuenta" to="/account/settings" />
                        <MenuItem icon={<PublicProfileIcon />} label="Perfil público" to={`/profile/${user.uid}`} />
                        <MenuItem icon={<ListingsIcon className="w-6 h-6 text-gray-400" />} label="Mis Anuncios" to="/account/my-listings" />
                        {/* ✅ **CAMBIO: Se añade el enlace a la página de términos** */}
                        <MenuItem icon={<ShieldIcon />} label="Términos y Políticas" to="/terms" />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Notificaciones</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <MenuItem icon={<BellIcon className="w-6 h-6 text-gray-400" />} label="Preferencias" to="/account/notifications" />
                    </div>
                </div>
                <div className="px-4 mt-6">
                    <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Ayuda</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        {/* ✅ **CAMBIO: Se añade el enlace al centro de ayuda** */}
                        <MenuItem icon={<QuestionMarkIcon />} label="Centro de ayuda" to="/help" />
                    </div>
                </div>
                <div className="px-4 mt-8 pb-4 text-center">
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-semibold">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}