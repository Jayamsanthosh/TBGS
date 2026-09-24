export const CRYPTO_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'agro-business-secret-key-123';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/tbgs-approval';
export const API_URL: string = `${BASE_PATH}/api/v1`;
export const apiUrl = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const asset = (path: string) => `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
