// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, FileText } from "lucide-react";
import toast from "react-hot-toast";
import DashboardCard from "../components/DashboardCard";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApprovalCounts, fetchDashboardCards } from "@/redux/slices/dashboardSlice";

const DashboardPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state: any) => state.auth);
    const { counts, cards, loading } = useAppSelector((state: any) => state.dashboard);

    const getPendingCount = (card: any) => {
        const permissionCount = Number(counts?.[card.permissionColumn] ?? 0);
        const routeCount = Number(counts?.[card.routeSlug] ?? 0);
        const approvalTypeCount = Number(counts?.[card.approvalType] ?? 0);
        return Math.max(permissionCount, routeCount, approvalTypeCount);
    };

    useEffect(() => {
        dispatch(fetchApprovalCounts());
        dispatch(fetchDashboardCards());
    }, [dispatch]);

    const handleCardClick = (card: any) => {
        router.push(`/${card.routeSlug}`);
    };

    const handleRefresh = async () => {
        dispatch(fetchApprovalCounts());
        toast.success('Dashboard refreshed successfully');
    };

    if (loading && cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                    <p className="text-gray-400 text-sm mt-2">Fetching pending approvals</p>
                </div>
            </div>
        );
    }

    const filteredCards = (cards || []).filter((card: any) => {
        const role = (user?.role || '').toLowerCase();
        const isAdmin = role === 'admin' || role === 'super admin';
        if (isAdmin) return !card.parentId;
        const perms = user?.permissions || [];
        return !card.parentId && perms.some((p: any) => {
            const loc = (p.linkLocation || '').replace(/^\//, '');
            return loc === card.routeSlug || loc === card.permissionColumn;
        });
    });

    const cardsWithCounts = filteredCards.map((card: any) => ({
        ...card,
        id: card.sno || card.id,
        title: card.cardTitle,
        value: getPendingCount(card)
    }));

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Overview of pending approvals and operational requests
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-lg shadow-indigo-100 disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        <span>Refresh</span>
                    </button>
                </div>

                {cardsWithCounts.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cards Available</h3>
                        <p className="text-gray-500">
                            You don't have permission to view any dashboard cards or there are no pending tasks.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {cardsWithCounts.map((card: any) => (
                            <DashboardCard
                                key={card.sno || card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
