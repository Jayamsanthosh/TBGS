"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useTrialBalanceStore(companyId?: number) {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const authHeader = () => ({ Authorization: `Bearer ${getAuthToken()}` });

  const getLiveTrialBalance = useCallback(async (companyIdParam?: number) => {
    let url = `${API_URL}/accounting/trial-balance`;
    if (companyIdParam) url += `?companyId=${companyIdParam}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) throw new Error("Failed to fetch live trial balance");
    return res.json();
  }, []);

  const queryStr = companyId ? `?companyId=${companyId}` : "";
  const cacheKey = `savedTrialBalances-${companyId ?? "all"}`;

  const { data: savedTrialBalances, loading: isLoading, refetch } = useApiQuery(cacheKey, async () => {
    const res = await fetch(`${API_URL}/accounting/trial-balance/saved${queryStr}`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch saved trial balances");
    return res.json();
  });

  const getSavedTrialBalanceById = useCallback(async (tbRefNo: string) => {
    if (!tbRefNo) return null;
    const res = await fetch(
      `${API_URL}/accounting/trial-balance/saved/detail?id=${encodeURIComponent(tbRefNo)}`,
      { headers: authHeader() }
    );
    if (!res.ok) return null;
    return res.json();
  }, []);

  const saveTrialBalance = useCallback(async (payload: any) => {
    const res = await fetch(`${API_URL}/accounting/trial-balance/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save trial balance");
    dispatch(clearCacheKey(cacheKey));
    return res.json();
  }, [dispatch, cacheKey]);

  const deleteSavedTrialBalance = useCallback(async (tbRefNo: string) => {
    const res = await fetch(
      `${API_URL}/accounting/trial-balance/saved?id=${encodeURIComponent(tbRefNo)}`,
      { method: "DELETE", headers: authHeader() }
    );
    if (!res.ok) throw new Error("Failed to delete trial balance snapshot");
    dispatch(clearCacheKey(cacheKey));
    return tbRefNo;
  }, [dispatch, cacheKey]);

  return {
    savedTrialBalances: savedTrialBalances ?? [],
    isLoading,
    refetch,
    getLiveTrialBalance,
    getSavedTrialBalanceById,
    saveTrialBalance,
    deleteSavedTrialBalance,
  };
}
