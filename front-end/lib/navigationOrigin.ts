import type { Permission } from "@/context/AuthContext";

const KEY = "tbgs:menuOpenedRoots";

export const ALWAYS_OPEN = ["/", "/dashboard", "/report-dashboard", "/report-master", "/management-insights", "/login", "/unauthorized", "/403"];

const rootOf = (path: string): string => {
  if (!path) return "";
  if (path === "/") return "/";
  const segment = path.split("/").filter(Boolean)[0];
  return segment ? `/${segment}` : "/";
};

const loadRoots = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === "string") : [];
  } catch {
    return [];
  }
};

const saveRoots = (roots: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(roots));
  } catch {}
};

export const markMenuOpened = (path: string) => {
  const root = rootOf(path);
  if (!root || root === "/") return;
  const roots = loadRoots();
  if (!roots.includes(root)) saveRoots([...roots, root]);
};

export const isMenuOpened = (path: string): boolean => {
  const root = rootOf(path);
  if (!root || root === "/") return true;
  return loadRoots().includes(root);
};

/**
 * The first screen a user should land on after login.
 * Privileged roles (Admin/Manager) who own the Dashboard link land on
 * /dashboard; everyone else lands on their first permitted link.
 * A role with no screens assigned lands on "/" (Home shows a friendly
 * "no screens assigned" state instead of an Access Denied dead-end).
 */
export function getLandingPath(permissions: Permission[]): string {
  const list = permissions ?? [];
  if (list.some((p) => p.linkLocation === "/dashboard")) return "/dashboard";
  const first = list.find(
    (p) => p.linkLocation && p.linkLocation.startsWith("/") && p.linkLocation !== "/login" && p.linkLocation !== "/unauthorized" && p.linkLocation !== "/403"
  );
  return first?.linkLocation || "/";
}