"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_URL = `${BASE}/sales-invoices`;

export function useSalesInvoiceStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: invoices, loading: isLoading, refetch: refetchInvoices } = useApiQuery("sales-invoices", async () => {
    const response = await fetch(`${API_URL}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Sales Invoices");
    return response.json();
  });

  const getInvoiceById = useCallback(async (id: string) => {
    if (!id) return null;
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addInvoice = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create Sales Invoice");
    dispatch(clearCacheKey("sales-invoices"));
    return response.json();
  }, [dispatch]);

  const updateInvoice = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update Sales Invoice");
    dispatch(clearCacheKey("sales-invoices"));
    return response.json();
  }, [dispatch]);

  const deleteInvoice = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete Sales Invoice");
    dispatch(clearCacheKey("sales-invoices"));
    return id;
  }, [dispatch]);

  return {
    invoices: invoices ?? [],
    isLoading,
    refetchInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById
  };
}
