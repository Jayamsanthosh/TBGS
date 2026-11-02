import { asset } from "./config";

export interface PdfLogo {
  dataUrl: string;
  width: number;
  height: number;
}

let cached: Promise<PdfLogo | null> | null = null;

export const loadPdfLogo = (): Promise<PdfLogo | null> => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!cached) {
    cached = (async () => {
      try {
        const response = await fetch(asset("/tbgs-logo.jpg"));
        if (!response.ok) return null;
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        const size = await new Promise<{ width: number; height: number }>((resolve) => {
          const image = new window.Image();
          image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ width: 0, height: 0 });
          image.src = dataUrl;
        });
        return {
          dataUrl,
          width: size.width || 428,
          height: size.height || 398,
        };
      } catch {
        return null;
      }
    })();
  }
  return cached;
};
