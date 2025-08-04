import React, { useState, useEffect, useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/config';
import { SpinnerIcon } from '../components/common/Icons';

export default function AccountSettings({ user, setUser }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
    const fileInputRef = useRef(null);
    const [companyInfo, setCompanyInfo] = useState({ name: '', description: '', website: '' });
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState('');
    const companyLogoInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoPreview(user.photoURL || '');
            setCompanyInfo({
                name: user.companyProfile?.name || '',
                description: user.companyProfile?.description || '',
                website: user.companyProfile?.website || ''
            });
            setCompanyLogoPreview(user.companyProfile?.logoUrl || '');
        }
    }, [user]);

    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleCompanyLogoChange = (e) => {
        if (e.target.files[0]) {
            setCompanyLogoFile(e.target.files[0]);
            setCompanyLogoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let newPhotoURL = user.photoURL;
            let companyProfileData = { ...companyInfo };

            if (photoFile) {
                const photoRef = ref(storage, `profile-pictures/${user.uid}`);
                await uploadBytes(photoRef, photoFile);
                newPhotoURL = await getDownloadURL(photoRef);
            }

            if (companyLogoFile) {
                const logoRef = ref(storage, `company-logos/${user.uid}`);
                await uploadBytes(logoRef, companyLogoFile);
                const newLogoUrl = await getDownloadURL(logoRef);
                companyProfileData.logoUrl = newLogoUrl;
            } else {
                companyProfileData.logoUrl = user.companyProfile?.logoUrl || '';
            }

            const updatedData = {
                displayName,
                photoURL: newPhotoURL,
                companyProfile: companyProfileData
            };

            await updateProfile(auth.currentUser, { displayName, photoURL: newPhotoURL });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, updatedData);
            setUser(prev => ({ ...prev, ...updatedData }));
            alert("Perfil actualizado con éxito.");

        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert("Hubo un error al actualizar tu perfil.");
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Ajustes de Cuenta</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center">
                    <img src={photoPreview || `https://i.pravatar.cc/150?u=${user?.uid}`} alt="Perfil" className="w-24 h-24 rounded-full mb-4 cursor-pointer" onClick={() => fileInputRef.current.click()} />
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:underline">Cambiar foto</button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Perfil de Empresa (para publicar empleos)</h3>
                    <div className="flex items-center space-x-4 mb-4">
                        <img src={companyLogoPreview || 'https://placehold.co/100x100/e2e8f0/64748b?text=Logo'} alt="Logo Empresa" className="w-24 h-24 rounded-md object-cover bg-gray-100" />
                        <div>
                            <input type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoChange} className="hidden" accept="image/*" />
                            <button type="button" onClick={() => companyLogoInputRef.current.click()} className="text-sm text-blue-600 hover:underline">Cambiar logo</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                        <input type="text" value={companyInfo.name} onChange={e => setCompanyInfo({ ...companyInfo, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Descripción de la Empresa</label>
                        <textarea value={companyInfo.description} onChange={e => setCompanyInfo({ ...companyInfo, description: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3"></textarea>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Sitio Web</label>
                        <input type="text" placeholder="https://..." value={companyInfo.website} onChange={e => setCompanyInfo({ ...companyInfo, website: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300 flex items-center">
                        {isSaving ? <SpinnerIcon /> : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}