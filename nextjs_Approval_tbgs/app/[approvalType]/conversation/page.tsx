"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    X,
    MessageSquare,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronLeft,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ExpandableText from '@/app/components/ExpandableText';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchConversation, clearCurrentRecord } from '@/redux/slices/approvalSlice';

interface ConversationItem {
    sno: number;
    poRefNo: string;
    respondPerson: string;
    discussionDetails?: string;
    responseStatus: string;
    statusEntry: string;
    remarks: string;
    createdBy: string;
    createdDate: string;
}

const ConversationContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const poRefNo = searchParams ? searchParams.get('poRefNo') : "";
    const dispatch = useAppDispatch();

    const { conversations: data, loading } = useAppSelector((state: any) => state.approval);

    useEffect(() => {
        if (poRefNo) {
            dispatch(fetchConversation(poRefNo));
        }

        return () => {
            dispatch(clearCurrentRecord());
        };
    }, [poRefNo, dispatch]);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'PENDING': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'REJECTED': return 'text-rose-500 bg-rose-50 border-rose-100';
            case 'PROCESSED': return 'text-blue-500 bg-blue-50 border-blue-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return <CheckCircle2 size={14} strokeWidth={2.5} />;
            case 'PENDING': return <Clock size={14} strokeWidth={2.5} />;
            case 'REJECTED': return <X size={14} strokeWidth={2.5} />;
            case 'PROCESSED': return <CheckCircle2 size={14} strokeWidth={2.5} />;
            default: return <AlertCircle size={14} strokeWidth={2.5} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold uppercase text-[12px] tracking-widest leading-loose">Retrieving Secure<br />Conversation Thread...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">
                            Thread - {poRefNo || 'Unknown Ref'}
                        </h2>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Transaction Audit Logs
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm scale-110">
                            <MessageSquare size={48} strokeWidth={1} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-800 tracking-tight">Vault is Empty</p>
                            <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">No conversation history found for this record</p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="mt-6 px-10 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                        >
                            Return to List
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent pb-10">
                        {data.map((item: any, index: number) => (
                            <div key={item.sno} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: `${index * 150}ms` }}>

                                {/* Timeline Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white text-slate-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:ml-0 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-full h-full flex items-center justify-center bg-white">
                                        {getStatusIcon(item.responseStatus)}
                                    </div>
                                </div>

                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group-hover:border-indigo-100 group-hover:bg-indigo-50/5">

                                    {/* Connector Arrow for Desktop */}
                                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 group-even:-left-2 group-odd:-right-2 w-2 h-0 border-t-8 border-t-transparent group-even:border-r-8 group-even:border-r-white group-odd:border-l-8 group-odd:border-l-white border-b-8 border-b-transparent filter drop-shadow-sm"></div>

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl text-indigo-600 border border-slate-100 flex items-center justify-center shadow-inner group-hover:bg-indigo-100 transition-colors">
                                                <User size={20} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-black text-slate-800 capitalize leading-none mb-1.5 tracking-tight">
                                                    {item.respondPerson.replace('.', ' ')}
                                                </span>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                    {item.createdBy}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase border shadow-sm tracking-widest ${getStatusColor(item.responseStatus)}`}>
                                            {item.responseStatus}
                                        </div>
                                    </div>

                                    {item.discussionDetails && (
                                        <div className="mb-6 pb-6 border-b border-slate-50">
                                            <div className="flex items-center space-x-2 mb-2.5">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Subject</h4>
                                            </div>
                                            <div className="text-[14px] text-slate-600 leading-relaxed font-bold pl-4">
                                                <ExpandableText text={item.discussionDetails} limit={120} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative p-5 rounded-3xl bg-slate-50/80 border border-slate-100/50 group-hover:bg-white transition-colors duration-500">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                            <span className="w-1 h-3 bg-slate-200 rounded-full mr-2"></span>
                                            Resolution Remarks
                                        </h4>
                                        <div className="text-[14px] text-slate-700 leading-relaxed font-medium italic">
                                            "<ExpandableText text={item.remarks} limit={80} />"
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                            <Calendar size={13} className="text-slate-300" />
                                            <span className="text-[11px] font-black tracking-tight">{item.createdDate.split(' ')[0]}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                            <Clock size={13} className="text-slate-300" />
                                            <span className="text-[11px] font-black tracking-tight uppercase">{item.createdDate.split(' ')[1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Wrap in Suspense to avoid de-opt of entire page
export default function ConversationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
            <ConversationContent />
        </Suspense>
    );
}
