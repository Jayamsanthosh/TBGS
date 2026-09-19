"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useSalesProformaStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: proformas, loading: isLoading, refetch: refetchProformas } = useApiQuery("sales-proformas", async () => {
    const response = await fetch(`${API_URL}/sales-proformas`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Sales Proformas");
    return response.json();
  });

  const getProformaById = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-proformas/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addProforma = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/sales-proformas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create Sales Proforma");
    dispatch(clearCacheKey("sales-proformas"));
    return response.json();
  }, [dispatch]);

  const updateProforma = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-proformas/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update Sales Proforma");
    dispatch(clearCacheKey("sales-proformas"));
    return response.json();
  }, [dispatch]);

  const deleteProforma = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-proformas/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.msg || "Failed to delete Sales Proforma");
    }
    dispatch(clearCacheKey("sales-proformas"));
    return id;
  }, [dispatch]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const response = await fetch(`${API_URL}/sales-proformas/bulk-delete`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.msg || "Failed to delete Sales Proformas");
    }
    dispatch(clearCacheKey("sales-proformas"));
    return ids;
  }, [dispatch]);

  return {
    proformas: proformas ?? [],
    isLoading,
    refetchProformas,
    addProforma,
    updateProforma,
    deleteProforma,
    bulkDelete,
    getProformaById,
  };
}
