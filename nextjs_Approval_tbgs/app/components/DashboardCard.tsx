// app/components/DashboardCard.tsx
import React from 'react';
import * as Icons from 'lucide-react';

interface DashboardCardProps {
    card: {
        id: number;
        title: string;
        value: number;
        iconKey: string;
        routeSlug: string;
        backgroundColor?: string;
        childCount?: number;
    };
    onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ card, onClick }) => {
    // Dynamically get icon component
    const IconComponent = (Icons as any)[card.iconKey] || Icons.FileCheck;

    const bgColorMap: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
        orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
        cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100',
        pink: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100',
        teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
        red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
        violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
        sky: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100',
        lime: 'bg-lime-50 text-lime-600 group-hover:bg-lime-100',
        fuchsia: 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100',
        green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
        yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
        slate: 'bg-slate-50 text-slate-600 group-hover:bg-slate-100',
    };

    const bgColor = bgColorMap[card.backgroundColor || 'indigo'];

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative group hover:-translate-y-1"
        >
            <div className="absolute top-0 left-0 h-1 w-full bg-indigo-600 rounded-t-xl" />

            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full transition-all duration-300 ${bgColor}`}>
                        <IconComponent className="h-7 w-7" />
                    </div>
                </div>

                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {card.title}
                </p>


                <p className="mt-3 text-4xl font-bold text-indigo-600">
                    {card.value}
                </p>

                {card.value > 0 ? (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium animate-pulse">
                        {card.value} Pending
                    </span>
                ) : (
                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        No Pending
                    </span>
                )}
            </div>
        </div>
    );
};

export default DashboardCard;