"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useGoodsReceiptStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: grns, loading: isLoading, refetch: refetchGrns } = useApiQuery("goods-receipts", async () => {
    const response = await fetch(`${API_URL}/goods-receipts`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch GRNs");
    return response.json();
  });

  const getGRNById = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/goods-receipts/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addGRN = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/goods-receipts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    dispatch(clearCacheKey("goods-receipts"));
    return response.json();
  }, [dispatch]);

  const updateGRN = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/goods-receipts/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    dispatch(clearCacheKey("goods-receipts"));
    return response.json();
  }, [dispatch]);

  const deleteGRN = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/goods-receipts/${encodedId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    dispatch(clearCacheKey("goods-receipts"));
    return response.json();
  }, [dispatch]);

  return {
    grns: grns ?? [],
    isLoading,
    refetchGrns,
    addGRN,
    updateGRN,
    deleteGRN,
    getGRNById
  };
}
