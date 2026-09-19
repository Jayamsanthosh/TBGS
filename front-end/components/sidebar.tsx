'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  LogOut,
  X,
  ChevronDown,
  UserCircle,
  Shield,
  LayoutList,
  Link2,
  Banknote,
  Scale,
  Globe,
  MapPinned,
  Layers,
  Building2,
  Tent,
  KeyRound,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { logoutUser, hydrateFromStorage } from '@/lib/authSlice';
import * as LucideIcons from 'lucide-react';
import { fetchNavigation, clearNavigation, NavMainMenu } from '@/lib/navigationSlice';
import { markMenuOpened } from '@/lib/navigationOrigin';
import ChangePasswordDialog from './ChangePasswordDialog';

// Context for managing sidebar state across the layout
interface UserData {
  id: string | number;
  loginName: string;
  mailId: string;
  role: string;
  stockShowStatus?: string;
  outsideAccessYn?: string;
  companyName?: string;
}

const SidebarContext = createContext({
  isCollapsed: false,
  isMobile: false,
  toggleSidebar: () => { },
  isMobileOpen: false,
  setIsMobileOpen: (open: boolean) => { },
  user: null as UserData | null,
  refreshUser: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function Header() {
  const { toggleSidebar, isCollapsed, user } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get initials
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U';
  };

  // Simple breadcrumb logic
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentPath = pathSegments[pathSegments.length - 1] || 'Dashboard';
  const pathLabelMap: Record<string, string> = {
    'leave-encashment-entries': 'Leave Encashment Response',
    'overtime-entries': 'Overtime Response',
    'bonus-entries': 'Bonus Response',
    'arrear-entries': 'Arrear Response',
    'promotion-demotion-transfer-entries': 'Promotion Demotion Transfer Response',
    'cash-advance': 'Cash Advance Response',
  };
  const formattedPath = pathLabelMap[currentPath] || (currentPath.charAt(0).toUpperCase() + currentPath.slice(1).replace(/-/g, ' '));

  // Don't show header on login or root home pages
  if (pathname === '/' || pathname === '/login') return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-primary transition-all active:scale-95 p-1"
        >
          {isCollapsed ? <PanelLeftOpen size={20} strokeWidth={2.5} /> : <PanelLeftClose size={20} strokeWidth={2.5} />}
        </button>
        <nav className="flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap">
          <span className="text-slate-400 font-medium hidden xs:inline">Dashboard</span>
          <span className="text-slate-300 hidden xs:inline">/</span>
          <span className="text-slate-900 font-bold">{formattedPath}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="relative w-40 sm:w-64 group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4 transition-colors" strokeWidth={2.5} />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
            placeholder="Search..."
            type="text"
          />
        </div>
        <button className="relative text-slate-400 hover:text-primary transition-colors active:scale-90 p-1">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="size-8 sm:size-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 shrink-0 hover:opacity-90 transition-opacity"
          >
            {getInitials(user?.loginName || 'User')}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.loginName || 'User'}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate mt-0.5">{user?.role || 'Guest'}</p>
                {user?.companyName && (
                  <p className="text-[11px] text-primary truncate mt-0.5">{user.companyName}</p>
                )}
              </div>
              <button
                onClick={() => { setDropdownOpen(false); setChangePasswordOpen(true); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <KeyRound size={14} />
                Change Password
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  dispatch(clearNavigation());
                  dispatch(logoutUser());
                  router.push('/login');
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  );
}

const getIcon = (iconName: string) => {
  if (!iconName) return LayoutList;
  const IconComp = (LucideIcons as any)[iconName];
  if (IconComp) return IconComp;
  
  const lower = iconName.toLowerCase();
  if (lower.includes('user')) return UserCircle;
  if (lower.includes('role') || lower.includes('shield')) return Shield;
  return LayoutList;
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const isMobile = useIsMobile();

  const refreshUser = React.useCallback(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);

  React.useEffect(() => {
    dispatch(hydrateFromStorage());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        dispatch(hydrateFromStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobile, toggleSidebar, isMobileOpen, setIsMobileOpen, user, refreshUser }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen, user } = useSidebar();
  const isMobile = useIsMobile();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load navigation from Redux slice (DB → SP → Service → Controller → API → Redux)
  const navMenus = useAppSelector((s: any) => s.navigation.menus) as NavMainMenu[];
  const navLoading = useAppSelector((s: any) => s.navigation.loading);
  const navLastRole = useAppSelector((s: any) => s.navigation.lastRole);

  React.useEffect(() => {
    if (user?.role && user.role !== navLastRole) {
      dispatch(clearNavigation());
      dispatch(fetchNavigation(user.role));
    }
  }, [user?.role, navLastRole, dispatch]);

  // ── Default collapse on load ─────────────────────────────────────────────
  // Collapse all sub menus by default on page load/refresh, but keep the
  // section (and nested sub-menu group) of the currently active screen open.
  // Uses the raw navigation fields (link_Location / page_action) since the
  // sanitized "_realLinks"/"_directHref" props are added later at render.
  // Set once (via the sidebarInitialized guard) so manual toggles are never
  // overridden afterward. Render-time state adjustment per the React docs.
  const hrefFor = (pageAction?: string, linkLocation?: string): string | null => {
    if (linkLocation && linkLocation.trim() !== "") return linkLocation;
    if (pageAction && pageAction.trim() !== "") {
      return pageAction.startsWith("/") ? pageAction : `/${pageAction}`;
    }
    return null;
  };
  const isPathActive = (href: string | null | undefined): boolean => {
    if (!href) return false;
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  };

  const [sidebarInitialized, setSidebarInitialized] = useState(false);
  if (!sidebarInitialized && !navLoading && Array.isArray(navMenus) && navMenus.length > 0) {
    const activeMainName = (() => {
      for (const mainMenu of navMenus) {
        const found = (mainMenu.subMenus || []).some((subMenu: any) => {
          const linkActive = (subMenu.links || []).some((l: any) =>
            isPathActive(hrefFor(l.page_action, l.link_Location))
          );
          const subActive = isPathActive(hrefFor(subMenu.page_action));
          return linkActive || subActive;
        });
        if (found) return mainMenu.main_menu_name;
      }
      return null;
    })();

    const initial: Record<string, boolean> = {};
    navMenus.forEach((mainMenu: any) => {
      initial[mainMenu.main_menu_name] = mainMenu.main_menu_name !== activeMainName;

      const sectionActive = mainMenu.main_menu_name === activeMainName;
      (mainMenu.subMenus || []).forEach((subMenu: any) => {
        const linkActive = (subMenu.links || []).some((l: any) =>
          isPathActive(hrefFor(l.page_action, l.link_Location))
        );
        const subActive = isPathActive(hrefFor(subMenu.page_action));
        initial[`sub-${subMenu.sub_menu_id}`] = !(sectionActive && (linkActive || subActive));
      });
    });

    setCollapsedSections(initial);
    setSidebarInitialized(true);
  }

  // Text typed into the sidebar's own menu search box (main menu / sub menu / links).
  const [menuSearch, setMenuSearch] = useState('');

  // Build a real, navigable href. Returns null when there is nothing mapped
  // (i.e. this item is not actually linked to a page), so it can be hidden.
  const buildHref = (pageAction?: string, linkLocation?: string) => {
    if (linkLocation && linkLocation.trim() !== '') return linkLocation;
    if (pageAction && pageAction.trim() !== '') {
      return pageAction.startsWith('/') ? pageAction : `/${pageAction}`;
    }
    return null;
  };

  // The API already returns only the main menus / sub menus / links that are
  // mapped to the current user's role (Load_Main_Menu_Using_Role_Id →
  // Load_Sub_Menu_Using_Rold_Main_Menu_Id → Load_Link_Using_Role_Sub_Menu_Id).
  // Here we additionally drop any entry that has no real page/link mapped to
  // it at all, so its name never shows up in the sidebar.
  const sanitizedNavigation = React.useMemo(() => {
    return (navMenus || [])
      .map((mainMenu: any) => {
        const subMenus = (mainMenu.subMenus || [])
          .map((subMenu: any) => {
            const realLinks = (subMenu.links || [])
              .filter((l: any) => buildHref(l.page_action, l.link_Location) !== null)
              .filter((l: any, idx: number, arr: any[]) =>
                arr.findIndex((x: any) => String(x.link_id) === String(l.link_id)) === idx
              );
            const directHref = realLinks.length === 0 ? buildHref(subMenu.page_action) : null;

            // No real links and no direct page mapped → not linked to this role, hide it.
            if (realLinks.length === 0 && !directHref) return null;

            return { ...subMenu, _realLinks: realLinks, _directHref: directHref };
          })
          .filter(Boolean);

        // Main menu with nothing usable under it → hide it too.
        if (subMenus.length === 0) return null;

        return { ...mainMenu, subMenus };
      })
      .filter(Boolean);
  }, [navMenus]);

  // Sidebar search filter — matches against main menu, sub menu and link names.
  const dynamicNavigation = React.useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    if (!term) return sanitizedNavigation;

    return sanitizedNavigation
      .map((mainMenu: any) => {
        const mainMatches = mainMenu.main_menu_name?.toLowerCase().includes(term);

        const subMenus = (mainMenu.subMenus || [])
          .map((subMenu: any) => {
            const subMatches = subMenu.sub_menu_name?.toLowerCase().includes(term);
            if (mainMatches || subMatches) return subMenu;

            const matchedLinks = (subMenu._realLinks || []).filter((l: any) =>
              l.link_name?.toLowerCase().includes(term)
            );
            if (matchedLinks.length === 0) return null;
            return { ...subMenu, _realLinks: matchedLinks };
          })
          .filter(Boolean);

        if (!mainMatches && subMenus.length === 0) return null;
        return { ...mainMenu, subMenus };
      })
      .filter(Boolean);
  }, [sanitizedNavigation, menuSearch]);

  const isSearchingMenu = menuSearch.trim().length > 0;

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    dispatch(clearNavigation());
    dispatch(logoutUser());
    router.push('/login');
  };

  if (pathname === '/' || pathname === '/login') return null;

  return (
    <>
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-500 ease-in-out sidebar-gradient text-sidebar-foreground overflow-hidden flex flex-col ${isMobile
          ? (isMobileOpen ? 'w-70 translate-x-0' : 'w-70 -translate-x-full')
          : (isCollapsed ? 'w-20' : 'w-65')
          }`}
      >
        <div className={`flex items-center gap-3 px-5 py-6 group cursor-pointer ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/10 shrink-0 transition-all duration-500 group-hover:scale-105 active:scale-95 ring-4 ring-white/5">
            <img
              src="/tbgs-logo.jpg"
              alt="tbgs Logo"
              className="w-24 h-24 object-contain transition-transform duration-500"
            />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
              <h1 className="font-bold text-lg text-white leading-none whitespace-nowrap transition-all duration-500 group-hover:translate-x-0.5">TBGS</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mt-1 whitespace-nowrap transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-white/80">ERP v1.0</p>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setIsMobileOpen(false)} className="ml-auto text-white/50 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Menu search filter — filters main menu, sub menu and link names */}
        <div className="px-3 pt-3 pb-1">
          {(!isCollapsed || isMobile) ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 size-4" strokeWidth={2.5} />
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search menu..."
                type="text"
                className="w-full bg-white/10 border border-white/10 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
              {menuSearch && (
                <button
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center py-2 text-white/40 hover:text-white transition-colors"
              title="Expand to search menu"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
          {navLoading ? (
             <div className="px-3 py-4 text-center text-white/50 text-xs animate-pulse">Loading menu...</div>
          ) : dynamicNavigation.length === 0 ? (
            <div className="px-3 py-4 text-center text-white/40 text-xs">
              {isSearchingMenu ? 'No matching menu found' : 'No menu mapped to this role'}
            </div>
          ) : (
            dynamicNavigation.map((mainMenu: any) => (
              <div key={mainMenu.main_menu_id} className="mb-2">
                {(!isCollapsed || isMobile) ? (
                  <button
                    onClick={() => toggleSection(mainMenu.main_menu_name)}
                    className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {React.createElement(getIcon(mainMenu.style_css), { className: "w-3.5 h-3.5 opacity-70 group-hover:opacity-100" })}
                      {mainMenu.main_menu_name}
                    </div>
                    <ChevronDown className={`w-3 h-3 transition-transform ${(!isSearchingMenu && collapsedSections[mainMenu.main_menu_name]) ? "-rotate-90" : ""}`} />
                  </button>
                ) : (
                  <div className="h-4 flex items-center justify-center">
                    {React.createElement(getIcon(mainMenu.style_css), { className: "w-4 h-4 text-white/40" })}
                  </div>
                )}

                {(isSearchingMenu || !collapsedSections[mainMenu.main_menu_name] || isCollapsed) && (
                  <div className="space-y-0.5">
                    {mainMenu.subMenus?.map((subMenu: any) => {
                      // Already sanitized: only sub menus with a real, role-mapped
                      // destination (links or a direct page) reach this point.
                      const realLinks = subMenu._realLinks || [];
                      const hasRealLinks = realLinks.length > 0;
                      const subHref = subMenu._directHref;

                      const isActive = !!subHref && (pathname === subHref || (subHref !== '/' && pathname.startsWith(subHref + '/')));
                      const Icon = getIcon(subMenu.style_css);

                      // If sub menu has real child links, render as expandable group
                      if (hasRealLinks) {
                        return (
                          <div key={`sub-${subMenu.sub_menu_id}`} className="space-y-0.5">
                            <button
                              onClick={() => toggleSection(`sub-${subMenu.sub_menu_id}`)}
                              className={`flex items-center w-full gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative text-white/70 hover:bg-white/10 hover:text-white ${isCollapsed && !isMobile ? 'justify-center px-0 mx-1' : ''}`}
                              title={isCollapsed ? subMenu.sub_menu_name : ''}
                            >
                              <Icon className="size-5 shrink-0 opacity-70" />
                              {(!isCollapsed || isMobile) && (
                                <>
                                  <span className="text-left flex-1 whitespace-normal break-words leading-tight">{subMenu.sub_menu_name}</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${(!isSearchingMenu && collapsedSections[`sub-${subMenu.sub_menu_id}`]) ? "-rotate-90" : ""}`} />
                                </>
                              )}
                            </button>
                            {(isSearchingMenu || (!collapsedSections[`sub-${subMenu.sub_menu_id}`] && (!isCollapsed || isMobile))) && (
                              <div className="pl-10 pr-2 space-y-0.5 pb-1">
                                {realLinks.map((link: any) => {
                                  const linkHref = link.link_Location?.trim()
                                    ? link.link_Location
                                    : (link.page_action?.startsWith('/') ? link.page_action : `/${link.page_action}`);
                                  const isLinkActive = pathname === linkHref;
                                  const LinkIcon = getIcon(link.style_css);
                                  return (
                                    <Link
                                      key={`link-${link.link_id}`}
                                      href={linkHref}
                                      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                                        isLinkActive
                                          ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                                          : "text-white/50 hover:bg-white/10 hover:text-white"
                                      }`}
onClick={() => {
                                        markMenuOpened(linkHref);
                                        if (isMobile) setIsMobileOpen(false);
                                      }}
                                    >
                                      <LinkIcon className={`size-5 shrink-0 transition-transform duration-300 ${isLinkActive ? 'scale-110' : 'opacity-70'}`} />
                                      <span className="whitespace-normal break-words leading-tight">
                                        {link.link_name}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Otherwise render as a direct navigation link (only when a real page is mapped)
                      if (!subHref) return null;

                      return (
                        <Link
                          key={`sub-${subMenu.sub_menu_id}`}
                          href={subHref}
                          className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                            isActive
                              ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          } ${isCollapsed && !isMobile ? 'justify-center px-0 mx-1' : ''}`}
                          title={isCollapsed ? subMenu.sub_menu_name : ''}
                          onClick={() => {
                            markMenuOpened(subHref);
                            if (isMobile) setIsMobileOpen(false);
                          }}
                        >
                          <Icon className={`size-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`} />
                          {(!isCollapsed || isMobile) && (
                            <span className="whitespace-normal break-words leading-tight animate-in fade-in slide-in-from-left-1 duration-300">
                              {subMenu.sub_menu_name}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </nav>

        {/* User Profile / Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-3">
          <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 ${isCollapsed && !isMobile ? 'justify-center px-0' : ''}`}>
            <div className="size-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
              {user?.loginName?.charAt(0).toUpperCase() || 'U'}
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                  {user?.loginName || 'User'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/30 truncate">
                  {user?.role || 'Guest'}
                </p>
                {user?.companyName && (
                  <p className="text-[10px] text-white/40 truncate mt-1">
                    {user.companyName}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">

            <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
              <LogOut size={16} />
              {(!isCollapsed || isMobile) && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Dynamic Spacer for Desktop Layout */}
      {!isMobile && (
        <div
          className={`hidden lg:block shrink-0 transition-all duration-500 ease-in-out h-screen ${isCollapsed ? 'w-20' : 'w-65'}`}
        />
      )}
    </>
  );
}