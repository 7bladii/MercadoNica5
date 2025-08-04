import React from 'react';

function SkeletonCard() {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-300"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-6 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            </div>
        </div>
    );
}

export default function ListingsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    );
}