"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useExpenseStore() {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const { data: expenses, loading: isLoading, refetch: refetchExpenses } = useApiQuery("expenses", async () => {
    const response = await fetch(`${API_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to fetch expenses");
    return response.json();
  });

  const getExpenseById = useCallback(async (id: string) => {
    if (!id) return null;
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/expenses/${encodedId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) return null;
    return response.json();
  }, []);

  const addExpense = useCallback(async (payload: any) => {
    const response = await fetch(`${API_URL}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || "Failed to create expense");
    }
    dispatch(clearCacheKey("expenses"));
    return response.json();
  }, [dispatch]);

  const updateExpense = useCallback(async (id: string, payload: any) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/expenses/${encodedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || "Failed to update expense");
    }
    dispatch(clearCacheKey("expenses"));
    return response.json();
  }, [dispatch]);

  const deleteExpense = useCallback(async (id: string) => {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${API_URL}/expenses/${encodedId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete expense");
    dispatch(clearCacheKey("expenses"));
    return id;
  }, [dispatch]);

  return {
    expenses: expenses ?? [],
    isLoading,
    refetchExpenses,
    getExpenseById,
    addExpense,
    updateExpense,
    deleteExpense
  };
}
