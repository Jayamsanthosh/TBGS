"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_URL = `${BASE_URL}/customer-receipts`;

export function useCustomerReceiptStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: receipts, loading: isLoading, refetch: refetchReceipts } = useApiQuery("customer-receipts", async () => {
    const response = await fetch(`${API_URL}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Customer Receipts");
    return response.json();
  });

  const getReceiptById = useCallback(async (id: string) => {
    if (!id) return null;
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addReceipt = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create Customer Receipt");
    dispatch(clearCacheKey("customer-receipts"));
    return response.json();
  }, [dispatch]);

  const deleteReceipt = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete Customer Receipt");
    dispatch(clearCacheKey("customer-receipts"));
    return id;
  }, [dispatch]);

  const getUnpaidInvoicesByCustomerId = useCallback(async (customerId: number) => {
    if (!customerId) return [];
    try {
      const response = await fetch(`${BASE_URL}/sales-invoices`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.filter((inv: any) => Number(inv.customerId) === customerId);
    } catch {
      return [];
    }
  }, []);

  return {
    receipts: receipts ?? [],
    isLoading,
    refetchReceipts,
    addReceipt,
    deleteReceipt,
    getReceiptById,
    getUnpaidInvoicesByCustomerId
  };
}
