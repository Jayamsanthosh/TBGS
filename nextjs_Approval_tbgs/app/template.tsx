"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Menu,
    X,
    PanelsTopLeft,
    PanelLeftClose,
    LogOut,
    LayoutDashboard,
    ShoppingCart,
    Briefcase,
    MessageCircle,
    Users,
    Settings
} from 'lucide-react';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Breadcrumbs from './components/Breadcrumbs';
import Footer from './components/Footer';
import FullscreenToggle from './components/FullscreenToggle';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchApprovalCounts, fetchDashboardCards } from '@/redux/slices/dashboardSlice';
import { logoutUser, hydrateFromStorage } from '@/redux/slices/authSlice';
import { API_URL } from '@/lib/config';

interface MenuItem {
    id: string;
    name: string;
    pendingCount: number;
    icon: string;
    path: string;
    permissionColumn?: string;
}

const STATIC_MENU_ITEMS: MenuItem[] = [
    { id: "dashboard", name: "Dashboard", pendingCount: 0, icon: "LayoutDashboard", path: "/dashboard", permissionColumn: "" },
  
];

// const ADMIN_MENU_ITEMS: MenuItem[] = [
//     { id: "admin-users", name: "Manage Users", pendingCount: 0, icon: "Users", path: "/admin/users", permissionColumn: "admin" },
//     { id: "admin-companies", name: "Manage Companies", pendingCount: 0, icon: "Building2", path: "/admin/companies", permissionColumn: "admin" },
//     { id: "admin-suppliers", name: "Manage Suppliers", pendingCount: 0, icon: "Truck", path: "/admin/suppliers", permissionColumn: "admin" },
//     { id: "admin-products", name: "Manage Products", pendingCount: 0, icon: "Package", path: "/admin/products", permissionColumn: "admin" },
//     { id: "admin-trucks", name: "Manage Trucks", pendingCount: 0, icon: "Navigation", path: "/admin/trucks", permissionColumn: "admin" },
//     { id: "admin-trailers", name: "Manage Trailers", pendingCount: 0, icon: "Container", path: "/admin/trailers", permissionColumn: "admin" },
//     { id: "admin-approvals", name: "Manage Approvals", pendingCount: 0, icon: "Settings", path: "/admin/approvals", permissionColumn: "admin" },
// ];


export default function Template({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const router = useRouter();

    const { user, accessToken } = useAppSelector((state: any) => state.auth);
    const { counts, cards, cardsLoading } = useAppSelector((state: any) => state.dashboard);

    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>(STATIC_MENU_ITEMS);
    const [isMenuLoading, setIsMenuLoading] = useState(false);
    const [validating, setValidating] = useState(true);

    const getPendingCount = (permissionColumn?: string, routePath?: string) => {
        const permissionCount = Number(counts?.[permissionColumn || ""] ?? 0);
        const routeSlug = (routePath || "").replace(/^\//, "");
        const routeCount = Number(counts?.[routeSlug] ?? 0);
        return Math.max(permissionCount, routeCount);
    };

    // Initial hydration of Redux from localStorage
    useEffect(() => {
        dispatch(hydrateFromStorage());
    }, [dispatch]);

    // Validate token on mount and auth sync
    useEffect(() => {
        const isPublicRoute = pathname ? (pathname === "/login" || pathname === "/qrscan") : false;

        const validateAndRedirect = async () => {
            const token = localStorage.getItem("accessToken");

            if (!token && !isPublicRoute) {
                router.push("/login");
                setValidating(false);
                return;
            }

            if (token && pathname === "/login") {
                router.push("/dashboard");
                setValidating(false);
                return;
            }

            // Validate the token with the backend
            if (token) {
                try {
                    const resp = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!resp.ok) throw new Error("invalid");
                } catch {
                    // Token is invalid/expired — clear and redirect to login
                    dispatch(logoutUser());
                    router.push("/login");
                    setValidating(false);
                    return;
                }
            }

            setValidating(false);
        };

        validateAndRedirect();
    }, [pathname, router, dispatch]);

    // Fetch counts and cards when authenticated
    useEffect(() => {
        if (accessToken && pathname && pathname !== "/qrscan" && pathname !== "/login") {
            dispatch(fetchApprovalCounts());
            dispatch(fetchDashboardCards());
        }
    }, [dispatch, accessToken, pathname]);

    // Update menu items: all approval cards as flat items
    useEffect(() => {
        if (!user) {
            setMenuItems(STATIC_MENU_ITEMS.filter(item => item.id === "dashboard"));
            return;
        }

        const allCards = cards || [];

        const isAllowed = (card: any) => {
            if (user.role?.toLowerCase() === 'admin') return true;
            const perms = user.permissions || [];
            return perms.some((p: any) => {
                const loc = (p.linkLocation || '').replace(/^\//, '');
                return loc === card.routeSlug || loc === (card.permissionColumn || '');
            });
        };

        const approvedCards = allCards
            .filter((card: any) => !card.parentId && isAllowed(card))
            .map((card: any) => ({
                id: `approval-${card.sno}`,
                name: card.cardTitle,
                pendingCount: getPendingCount(card.permissionColumn, `/${card.routeSlug}`),
                icon: card.iconKey,
                path: `/${card.routeSlug}`,
                permissionColumn: card.permissionColumn
            }));

        const staticItems = STATIC_MENU_ITEMS.map(item => ({
            ...item,
            pendingCount: getPendingCount(item.permissionColumn, item.path)
        }));

        let updatedMenu = [...staticItems, ...approvedCards];

        // if (user.role?.toLowerCase() === 'admin') {
        //     updatedMenu = [...updatedMenu, ...ADMIN_MENU_ITEMS];
        // }

        setMenuItems(updatedMenu);
        setIsMenuLoading(cardsLoading);
    }, [counts, cards, user, cardsLoading]);

    const handleLogout = () => {
        dispatch(logoutUser());
        toast.success('Logged out successfully');
        router.push('/login');
    };

    const handleMenuItemClick = (item: MenuItem) => {
        setIsMobileSidebarOpen(false);
        router.push(item.path);
    };

    // Extract user info safely
    const activeUser = user;
    const username = activeUser?.name || activeUser?.loginName || 'User';
    const userEmail = activeUser?.email || activeUser?.mailId || 'user@example.com';
    const isExpanded = isMobileSidebarOpen || isSidebarOpen;

    const isPublicRoute = pathname ? (pathname === "/login" || pathname === "/qrscan") : false;
    const isLoading = validating || (!accessToken && !isPublicRoute);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">Verifying secure session...</p>
            </div>
        );
    }

    if (isPublicRoute) {
        return children;
    }

    if (!accessToken) return null;

    return (
        <div className="relative flex max-h-screen w-full bg-white overflow-x-hidden content-scrollbar">

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-60 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-70 
                lg:static
                transform transition-all duration-300 ease-in-out
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
                bg-linear-to-b from-indigo-800 to-indigo-950
                text-white
                ${isExpanded ? 'w-72' : 'w-20'}
                h-screen
                shadow-2xl
                border-r border-white/10
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 h-16 shrink-0">
                    <div className={`flex items-center space-x-3 ${!isExpanded && 'justify-center w-full'}`}>
                        <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-white">
                            <img src="/tbgs-logo.jpg" alt="TBGS Logo" className="w-full h-full object-contain" />
                        </div>
                        {isExpanded && (
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold text-white truncate tracking-tight">TBGS Hub</h1>
                                <p className="text-[10px] text-indigo-200 font-bold uppercase opacity-70">Control Panel</p>
                            </div>
                        )}
                    </div>
                    {isMobileSidebarOpen && (
                        <button onClick={() => setIsMobileSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 py-4 px-2 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1">
                    {isMenuLoading ? (
                        /* Shimmer Loading State */
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={`flex items-center space-x-3 px-3 py-3 rounded-xl ${!isExpanded ? 'justify-center' : ''}`}>
                                <div className="w-[19px] h-[19px] bg-white/10 rounded shadow-inner animate-pulse shrink-0" />
                                {isExpanded && (
                                    <div className="h-4 bg-white/10 rounded w-32 animate-pulse" />
                                )}
                            </div>
                        ))
                    ) : (
                        menuItems.map((item) => {
                            const Icon = (Icons as any)[item.icon] || LayoutDashboard;
                            const hasPendingItems = item.pendingCount > 0;
                            const isActive = pathname ? (pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`))) : false;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuItemClick(item)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all group
                                        ${isActive ? 'bg-white/15 shadow-sm text-white' : 'text-indigo-100/70 hover:bg-white/10 hover:text-white'}
                                        ${!isExpanded && 'justify-center'}
                                    `}
                                >
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="relative shrink-0">
                                            <Icon size={19} className={`${isActive ? 'text-white' : 'group-hover:text-white transition-colors'}`} />
                                            {!isExpanded && hasPendingItems && (
                                                <span className="absolute -top-2.5 -right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-indigo-900 shadow-sm animate-pulse">
                                                    {item.pendingCount > 9 ? '9+' : item.pendingCount}
                                                </span>
                                            )}
                                        </div>
                                        {isExpanded && (
                                            <span className="font-semibold text-sm truncate tracking-tight">{item.name}</span>
                                        )}
                                    </div>
                                    {isExpanded && hasPendingItems && (
                                        <span className="shrink-0 font-black text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center shadow-lg shadow-red-900/40">
                                            {item.pendingCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors ${!isExpanded && 'justify-center'}`}
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                        {isExpanded && <span className="text-sm font-bold">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 w-full relative">

                {/* Integrated Top Navigation */}
                <header className="bg-white sticky top-0 z-50 w-full border-b border-slate-100 shadow-xs">
                    {/* Top Row: Mobile Toggle, Logo, Profile */}
                    <div className="flex items-center justify-between px-4 py-2 h-14 md:h-16 w-full">
                        <div className="flex items-center space-x-4 shrink-0">
                            {/* Sidebar Toggles */}
                            <button
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                            >
                                <Menu size={22} />
                            </button>

                            <button
                                onClick={() => setSidebarOpen(!isSidebarOpen)}
                                className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
                            >
                                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelsTopLeft size={20} />}
                            </button>

                            {/* Company Logo Group */}
                            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
                                <div className="h-8 md:h-10 w-px bg-slate-200" />
                                <img
                                    src="https://visioninfotech.co.tz/assets/images/vit-logo-dark.png"
                                    alt="Vision Infotech"
                                    className="h-7 md:h-9 object-contain"
                                />
                            </div>
                        </div>

                        {/* Right Group: Fullscreen, Profile */}
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="hidden sm:block">
                                <FullscreenToggle />
                            </div>
                            <div className="flex items-center space-x-3 cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-[#8E78FF] flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                                    {username.charAt(0)}
                                </div>
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-800 leading-none">{username}</span>
                                    <span className="text-[11px] font-medium text-slate-400 mt-1">{userEmail}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Breadcrumbs Section */}
                    {pathname !== "/dashboard" && pathname !== "/login" && (
                        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100">
                            <Breadcrumbs />
                        </div>
                    )}
                </header>

                {/* Dynamic Page Container */}
                <main className="flex-1 w-full p-2 sm:p-4 lg:p-6 overflow-x-hidden overflow-y-auto bg-slate-50/50">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>

                    {/* Footer */}
                    <Footer />
                </main>
            </div>
        </div>
    );
}
