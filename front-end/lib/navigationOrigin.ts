const KEY = "tbgs:menuOpenedRoots";

export const ALWAYS_OPEN = ["/", "/dashboard", "/login", "/unauthorized", "/403"];

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