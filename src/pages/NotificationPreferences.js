import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SpinnerIcon } from '../components/common/Icons';

export default function NotificationPreferences({ user, setUser }) {
    const [prefs, setPrefs] = useState(user?.notifications || { newMessages: true, newJobs: true });
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { notifications: prefs });
            setUser(prev => ({ ...prev, notifications: prefs }));
            alert("Preferencias guardadas.");
        } catch (error) {
            console.error("Error al guardar preferencias:", error);
            alert("No se pudieron guardar los cambios.");
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Preferencias de Notificaciones</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="new-messages" className="font-medium text-gray-700">Nuevos Mensajes</label>
                    <div
                        onClick={() => handleToggle('newMessages')}
                        className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors ${prefs.newMessages ? 'bg-blue-600' : ''}`}
                    >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${prefs.newMessages ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="new-jobs" className="font-medium text-gray-700">Nuevas Ofertas de Empleo</label>
                    <div
                        onClick={() => handleToggle('newJobs')}
                        className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors ${prefs.newJobs ? 'bg-blue-600' : ''}`}
                    >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${prefs.newJobs ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-8">
                <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:bg-blue-300 flex items-center">
                    {isSaving ? <SpinnerIcon /> : 'Guardar'}
                </button>
            </div>
        </div>
    );
}