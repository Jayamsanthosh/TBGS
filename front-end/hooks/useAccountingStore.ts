"use client";

import { useApiQuery } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useCashBook(year?: number, month?: number) {
  return useApiQuery(`cash-book-${year}-${month}`, async () => {
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));

    const response = await fetch(`${API_URL}/accounting/cash-book?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch cash book");
    return response.json();
  });
}

export function useCashFlow(year?: number, month?: number) {
  return useApiQuery(`cash-flow-${year}-${month}`, async () => {
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));

    const response = await fetch(`${API_URL}/accounting/cash-flow?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch cash flow");
    return response.json();
  });
}
