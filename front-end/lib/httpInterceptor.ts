"use client";

import { API_URL } from "./config";

/**
 * WHY THIS FILE EXISTS
 * ---------------------------------------------------------------------
 * The backend now authenticates every protected request via an
 * httpOnly cookie (`access_token`). Browsers only send cookies on
 * cross-origin fetches when the request explicitly opts in with
 * `credentials: "include"`.
 *
 * This codebase has 100+ Redux slices that all call the bare
 * `fetch(...)` API directly, none of which set `credentials`. Rather
 * than touch every single slice file, we patch `window.fetch` ONCE,
 * here, so every existing call automatically:
 *   1. sends the auth cookie when talking to our own API, and
 *   2. reacts to 401 (session died) by asking the app to log in again.
 *
 * NOTE ON 403s:
 * Permission enforcement lives in the BACKEND (RBAC middleware returns
 * 403 for any call the role is not mapped to), and in AuthGuard at the
 * route level. A 403 on a single data resource therefore must NOT
 * bounce the entire app to /unauthorized - a page can legitimately
 * call a mix of endpoints, and one denied sub-resource would otherwise
 * lock a fully authorised user out of their screen. We log the denied
 * request instead so the specific endpoint can be audited.
 * ---------------------------------------------------------------------
 */
let installed = false;

export function installAuthFetchInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const isApiCall = url.startsWith(API_URL);

    const token = localStorage.getItem("accessToken");
    const headers = new Headers(init.headers);
    if (isApiCall && token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const finalInit: RequestInit = isApiCall
      ? { ...init, headers, credentials: init.credentials ?? "include" }
      : init;

    const response = await originalFetch(input, finalInit);

    if (isApiCall && response.status === 401) {
      const path = window.location.pathname;
      const alreadyOnLogin = path === "/login" || path === "/unauthorized";

      if (!alreadyOnLogin) {
        window.dispatchEvent(new Event("auth-session-expired"));
      }
    } else if (isApiCall && response.status === 403) {
      // Denied by backend RBAC. Do NOT navigate away - the page shows
      // its own error/empty state, and AuthGuard already enforces
      // route-level access. Log it for auditing.
      console.warn(`[auth-interceptor] 403 Forbidden on ${url}`);
    }

    return response;
  };
}
