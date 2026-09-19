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
 *   2. gets redirected to /login or /unauthorized on 401 / 403,
 *      even if the calling code never checks the response status.
 *
 * This is what makes requirement "browser devtools should not bypass
 * permissions" hold even for code that predates this RBAC pass: the
 * enforcement lives at the network layer, not in each component.
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

    if (isApiCall && (response.status === 401 || response.status === 403)) {
      const path = window.location.pathname;
      const alreadyOnAuthPages = path === "/login" || path === "/unauthorized";

      if (!alreadyOnAuthPages) {
        if (response.status === 401) {
          window.dispatchEvent(new Event("auth-session-expired"));
        } else {
          window.dispatchEvent(new Event("auth-forbidden"));
        }
      }
    }

    return response;
  };
}
