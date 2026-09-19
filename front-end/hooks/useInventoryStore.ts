"use client";

import { useApiQuery } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useStockLedger(storeId: string) {
  return useApiQuery(`stock-ledger-${storeId}`, async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/inventory/stock-ledger?storeId=${storeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch stock ledger");
    return response.json();
  }, { enabled: !!storeId });
}
