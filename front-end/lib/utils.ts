import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function successMessage(res: unknown, fallback: string): string {
    if (res && typeof res === "object") {
        const r = res as { message?: unknown; payload?: { message?: unknown } };
        const msg = r?.message ?? r?.payload?.message;
        if (typeof msg === "string" && msg.trim()) return msg;
    }
    return fallback;
}

export function errorMessage(e: unknown, fallback: string): string {
    if (typeof e === "string" && e.trim()) return e;
    if (e && typeof e === "object") {
        const err = e as { message?: unknown; payload?: { message?: unknown } };
        const msg = err?.message ?? err?.payload?.message;
        if (typeof msg === "string" && msg.trim()) return msg;
    }
    return fallback;
}


export const MONTHS = [
      { label: "January", value: "January" },
      { label: "February", value: "February" },
      { label: "March", value: "March" },
      { label: "April", value: "April" },
      { label: "May", value: "May" },
      { label: "June", value: "June" },
      { label: "July", value: "July" },
      { label: "August", value: "August" },
      { label: "September", value: "September" },
      { label: "October", value: "October" },
      { label: "November", value: "November" },
      { label: "December", value: "December" },
    ];

export const TIMEZONES = [
  "Select Time Zone", "EAT (East Africa Time)", "UTC", "GMT"
];

export const YEARS = Array.from({ length: 71 }, (_, i) => (new Date().getFullYear() + i).toString());

export const SALARY_DEDUCTION_TYPE = ['SALARY','DEDUCTION'];

export const BONUS_TYPE = [
  'Diwali',
  'Pongal',
  'Annual',
  'Performance',
  'Festival',
  'Special',
  'Other',
];
