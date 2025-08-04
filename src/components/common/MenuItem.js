import React from 'react';
import { ChevronRightIcon } from './Icons';

export default function MenuItem({ icon, label, onClick }) {
    return (
        <div onClick={onClick} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex items-center space-x-4">
                {icon}
                <span className="text-white">{label}</span>
            </div>
            <ChevronRightIcon />
        </div>
    );
}