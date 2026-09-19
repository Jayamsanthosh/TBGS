"use client";

import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/store";
import { useMemo } from "react";

/**
 * Returns the LINK_ID for the current page by matching the pathname
 * against the navigation links stored in Redux. Falls back to the
 * provided `fallback` value if no match is found.
 */
export function useLinkPagesId(fallback = 0): number {
  const pathname = usePathname();
  const navItems = useAppSelector((s: any) => s.navigation?.menus ?? []);

  return useMemo(() => {
    // Flatten all links from navigation
    const allLinks: any[] = [];
    for (const main of navItems) {
      for (const sub of main.subMenus ?? []) {
        for (const link of sub.links ?? []) {
          allLinks.push(link);
        }
      }
    }
    const found = allLinks.find(
      (l) =>
        l.link_Location === pathname ||
        l.page_action === pathname ||
        l.link_Location === pathname.replace(/\/$/, "")
    );
    return found?.link_id ? Number(found.link_id) : fallback;
  }, [navItems, pathname, fallback]);
}
