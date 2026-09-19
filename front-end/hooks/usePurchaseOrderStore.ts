"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function usePurchaseOrderStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: orders, loading: isLoading, refetch: refetchOrders } = useApiQuery("purchase-orders", async () => {
    const response = await fetch(`${API_URL}/purchase-orders`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch POs");
    return response.json();
  });

  const getOrderById = useCallback(async (id: string) => {
    const response = await fetch(`${API_URL}/purchase-orders/${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addOrder = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/purchase-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create PO");
    dispatch(clearCacheKey("purchase-orders"));
    return response.json();
  }, [dispatch]);

  const updateOrder = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(encodeURIComponent(id));
    const response = await fetch(`${API_URL}/purchase-orders/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update PO");
    dispatch(clearCacheKey("purchase-orders"));
    return response.json();
  }, [dispatch]);

  const approveOrder = useCallback(async ({ id, level, status, remarks, user }: any) => {
    const response = await fetch(`${API_URL}/purchase-orders/approve/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ level, status, remarks, user })
    });
    if (!response.ok) throw new Error("Approval failed");
    dispatch(clearCacheKey("purchase-orders"));
    return response.json();
  }, [dispatch]);

  const deleteOrder = useCallback(async (id: string) => {
    const response = await fetch(`${API_URL}/purchase-orders/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete PO");
    dispatch(clearCacheKey("purchase-orders"));
    return id;
  }, [dispatch]);

  const updatePOD = useCallback(async ({ id, deliveryPerson, deliveryDate, remarks }: any) => {
    const response = await fetch(`${API_URL}/purchase-orders/pod/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ deliveryPerson, deliveryDate, remarks })
    });
    if (!response.ok) throw new Error("Failed to update POD");
    dispatch(clearCacheKey("purchase-orders"));
    return response.json();
  }, [dispatch]);

  return {
    orders: orders ?? [],
    isLoading,
    refetchOrders,
    addOrder,
    updateOrder,
    approveOrder,
    deleteOrder,
    updatePOD,
    getOrderById
  };
}
