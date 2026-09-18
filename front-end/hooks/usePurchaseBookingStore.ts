"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function usePurchaseBookingStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: bookings, loading: isLoading, refetch: refetchBookings } = useApiQuery("purchase-invoices", async () => {
    const response = await fetch(`${API_URL}/purchase-invoices`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Purchase Invoices");
    return response.json();
  });

  const getBookingById = useCallback(async (id: string) => {
    const response = await fetch(`${API_URL}/purchase-invoices?id=${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addBooking = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/purchase-invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    dispatch(clearCacheKey("purchase-invoices"));
    return response.json();
  }, [dispatch]);

  const updateBooking = useCallback(async (id: string, payload: any) => {
    const response = await fetch(`${API_URL}/purchase-invoices?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    dispatch(clearCacheKey("purchase-invoices"));
    return response.json();
  }, [dispatch]);

  const deleteBooking = useCallback(async (id: string) => {
    const response = await fetch(`${API_URL}/purchase-invoices?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const body = JSON.parse(text);
        message = body.msg || body.message || text;
      } catch {
        message = text;
      }
      throw new Error(message);
    }
    dispatch(clearCacheKey("purchase-invoices"));
    return response.json();
  }, [dispatch]);

  const uploadFile = useCallback(async (id: string, fileData: any) => {
    const response = await fetch(`${API_URL}/purchase-invoices/upload?id=${encodeURIComponent(id)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(fileData)
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  }, []);

  const getFiles = useCallback(async (id: string) => {
    const response = await fetch(`${API_URL}/purchase-invoices/files?id=${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return [];
    return response.json();
  }, []);

  return {
    bookings: bookings ?? [],
    isLoading,
    refetchBookings,
    addBooking,
    updateBooking,
    deleteBooking,
    getBookingById,
    uploadFile,
    getFiles
  };
}
