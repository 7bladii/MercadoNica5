import React from 'react';
import { HomeIcon, MessagesIcon, PlusCircleIcon, ListingsIcon, AccountIcon } from '../common/Icons';

export default function BottomNavBar({ setView, currentView, goHome, hasUnreadMessages }) {
    const handlePublishClick = () => {
        setView({ page: 'publish', type: 'producto' })
    };

    const navItems = [
        { name: 'Inicio', icon: HomeIcon, page: 'home', action: goHome },
        { name: 'Mensajes', icon: MessagesIcon, page: 'messages', action: () => setView({ page: 'messages' }), notification: hasUnreadMessages },
        { name: 'Publicar', icon: PlusCircleIcon, page: 'publish', action: handlePublishClick, isCentral: true },
        { name: 'Anuncios', icon: ListingsIcon, page: 'myListings', action: () => setView({ page: 'myListings' }) },
        { name: 'Cuenta', icon: AccountIcon, page: 'account', action: () => setView({ page: 'account' }) },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t shadow-lg z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = item.page === 'account' ? ['account', 'accountSettings', 'myListings', 'favorites', 'notificationPreferences'].includes(currentView.page) : currentView.page === item.page;
                    const Icon = item.icon;
                    if (item.isCentral) {
                        return (
                            <button key={item.name} onClick={item.action} className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center -mt-6 shadow-lg">
                                <Icon />
                            </button>
                        );
                    }
                    return (
                        <button key={item.name} onClick={item.action} className="flex flex-col items-center justify-center text-xs w-16">
                            <Icon isActive={isActive} hasNotification={item.notification} />
                            <span className={`mt-1 truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}