"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useSalesOrderStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: orders, loading: isLoading, refetch: refetchOrders } = useApiQuery("sales-orders", async () => {
    const response = await fetch(`${API_URL}/sales-orders`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Sales Orders");
    return response.json();
  });

  const getOrderById = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-orders/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addOrder = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/sales-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create Sales Order");
    dispatch(clearCacheKey("sales-orders"));
    return response.json();
  }, [dispatch]);

  const updateOrder = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-orders/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update Sales Order");
    dispatch(clearCacheKey("sales-orders"));
    return response.json();
  }, [dispatch]);

  const deleteOrder = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/sales-orders/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.msg || "Failed to delete Sales Order");
    }
    dispatch(clearCacheKey("sales-orders"));
    return id;
  }, [dispatch]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const response = await fetch(`${API_URL}/sales-orders/bulk-delete`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.msg || "Failed to delete Sales Orders");
    }
    dispatch(clearCacheKey("sales-orders"));
    return ids;
  }, [dispatch]);

  return {
    orders: orders ?? [],
    isLoading,
    refetchOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    bulkDelete,
    getOrderById
  };
}
