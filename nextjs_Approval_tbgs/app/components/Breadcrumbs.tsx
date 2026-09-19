"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

interface BreadcrumbsProps {
    customTitle?: string;
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customTitle, className = "" }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { cards } = useAppSelector((state: any) => state.dashboard);

    if (!pathname) return null;

    const pathnames = pathname.split("/").filter((x) => x);
    const cardTitle = searchParams ? searchParams.get("cardTitle") : null;
    const allCards = Array.isArray(cards) ? cards : [];

    const findCardBySlug = (slug: string) =>
        allCards.find((c: any) => c.routeSlug === slug);

    const findCardById = (sno: number) =>
        allCards.find((c: any) => c.sno === sno);

    const formatSlug = (text: string) => {
        if (!text) return "";
        return text
            .split("-")
            .map(word => {
                const specialWords: Record<string, string> = {
                    'po': 'PO', 'pi': 'PI', 'pfl': 'PFL',
                    'pprb': 'PPRB', 'yn': 'YN'
                };
                const lowerWord = word.toLowerCase();
                return specialWords[lowerWord] ||
                    (lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1));
            })
            .join(" ");
    };

    const breadcrumbItems: Array<{
        path: string;
        title: string;
        icon?: React.ReactNode;
        isLast: boolean;
    }> = [];

    breadcrumbItems.push({
        path: "/dashboard",
        title: "Dashboard",
        icon: <Home className="w-4 h-4" />,
        isLast: false,
    });

    const usedPaths = new Set<string>();

    for (let i = 0; i < pathnames.length; i++) {
        const segment = pathnames[i];
        if (segment.toLowerCase() === "dashboard" && i === 0) continue;

        if (/^\d+$/.test(segment)) {
            const path = `/${pathnames.slice(0, i + 1).join("/")}`;
            breadcrumbItems.push({
                path,
                title: customTitle && i === pathnames.length - 1 ? customTitle : "Details",
                isLast: true,
            });
            continue;
        }

        const card = findCardBySlug(segment);

        if (card?.parentId != null) {
            const parent = findCardById(card.parentId);
            if (parent && !usedPaths.has(parent.routeSlug)) {
                usedPaths.add(parent.routeSlug);
                breadcrumbItems.push({
                    path: `/${parent.routeSlug}`,
                    title: parent.cardTitle || formatSlug(parent.routeSlug),
                    isLast: false,
                });
            }
        }

        const title = card?.cardTitle ||
            (segment.startsWith("approval") && cardTitle ? cardTitle : null) ||
            formatSlug(segment);

        const path = `/${pathnames.slice(0, i + 1).join("/")}`;
        breadcrumbItems.push({
            path,
            title,
            isLast: true,
        });
    }

    breadcrumbItems.forEach((item) => { item.isLast = false; });
    if (breadcrumbItems.length > 0) {
        breadcrumbItems[breadcrumbItems.length - 1].isLast = true;
    }

    return (
        <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1">
                {breadcrumbItems.map((item, index) => (
                    <li key={item.path + index} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-1 shrink-0" />
                        )}

                        {item.isLast ? (
                            <div className="flex items-center text-indigo-900 font-semibold px-2 py-1 bg-indigo-50/50 rounded-md">
                                {item.icon && <span className="mr-1.5 text-indigo-600">{item.icon}</span>}
                                <span className="truncate max-w-[150px] md:max-w-[250px]">{item.title}</span>
                            </div>
                        ) : (
                            <Link
                                href={item.path}
                                className="flex items-center text-gray-500 hover:text-indigo-600 hover:bg-white/50 px-2 py-1 rounded-md transition-all duration-200 group"
                            >
                                {item.icon && (
                                    <span className="mr-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="font-medium">{item.title}</span>
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;