export const CRYPTO_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'agro-business-secret-key-123';
export const API_URL: string = process.env.NEXT_PUBLIC_API_URL!;
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/tbgs-main';
export const asset = (path: string) => `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
