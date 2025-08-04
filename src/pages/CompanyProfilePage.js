import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ListingCard from '../components/listings/ListingCard';
import { VerifiedIcon } from '../components/common/Icons';

export default function CompanyProfilePage({ userId, setView, user }) {
    const [companyProfile, setCompanyProfile] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [companyListings, setCompanyListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUserProfile(userData);
                    if (userData.companyProfile) {
                        setCompanyProfile(userData.companyProfile);
                    }
                }

                const listingsQuery = query(
                    collection(db, 'listings'),
                    where('userId', '==', userId),
                    where('type', '==', 'trabajo'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc')
                );
                const listingsSnapshot = await getDocs(listingsQuery);
                const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompanyListings(listingsData);

            } catch (error) {
                console.error("Error al cargar el perfil de la empresa:", error);
            }
            setLoading(false);
        };

        fetchCompanyData();
    }, [userId]);

    if (loading) {
        return <div className="text-center p-10">Cargando perfil de la empresa...</div>;
    }

    if (!companyProfile) {
        return <div className="text-center p-10">Perfil de empresa no encontrado o no configurado.</div>;
    }

    return (
        <div className="container mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img src={companyProfile.logoUrl || 'https://placehold.co/150x150/e2e8f0/64748b?text=Logo'} alt={companyProfile.name} className="w-32 h-32 rounded-lg border-4 border-gray-200 object-cover" />
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
                        {companyProfile.name}
                        {userProfile?.isVerified && <VerifiedIcon className="h-7 w-7 text-blue-500" />}
                    </h1>
                    <p className="text-gray-600 mt-2">{companyProfile.description}</p>
                    {companyProfile.website && (
                        <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
                            Visitar sitio web
                        </a>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Vacantes Activas</h2>
                {companyListings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {companyListings.map(listing => (
                            <ListingCard key={listing.id} listing={listing} setView={setView} user={user} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Esta empresa no tiene vacantes activas en este momento.</p>
                )}
            </div>
        </div>
    );
}