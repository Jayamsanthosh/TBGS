"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useDeliveryNoteStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: notes, loading: isLoading, refetch: refetchNotes } = useApiQuery("delivery-notes", async () => {
    const response = await fetch(`${API_URL}/delivery-notes`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch Delivery Notes");
    return response.json();
  });

  const getNoteById = useCallback(async (id: string) => {
    if (!id) return null;
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/delivery-notes/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addNote = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/delivery-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create Delivery Note");
    dispatch(clearCacheKey("delivery-notes"));
    return response.json();
  }, [dispatch]);

  const updateNote = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/delivery-notes/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update Delivery Note");
    dispatch(clearCacheKey("delivery-notes"));
    return response.json();
  }, [dispatch]);

  const deleteNote = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/delivery-notes/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete Delivery Note");
    dispatch(clearCacheKey("delivery-notes"));
    return id;
  }, [dispatch]);

  return {
    notes: notes ?? [],
    isLoading,
    refetchNotes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById
  };
}
