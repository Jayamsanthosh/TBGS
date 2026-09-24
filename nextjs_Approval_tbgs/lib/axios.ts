import axios from 'axios';

let expiredNotified = false;

/**
 * Guards against the "401 storm" feedback loop.
 *
 * A dead session makes many axios requests 401 at once. Naively firing a
 * session-expired event for every one of them causes the logout handler to
 * run repeatedly. We only ever notify once per session; any successful
 * response (i.e. a real login) resets the flag.
 */
export function resetAuthExpiredFlag() {
  expiredNotified = false;
}

const api = axios.create({});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    expiredNotified = false;
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    // Login failures ("wrong password") and logout calls must never be treated
    // as an expired session.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/logout');

    if (
      typeof window !== 'undefined' &&
      !isAuthEndpoint &&
      status === 401 &&
      !expiredNotified
    ) {
      expiredNotified = true;
      window.dispatchEvent(new Event('auth-session-expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
