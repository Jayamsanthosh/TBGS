"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useJournalStore(companyId?: number, module?: string) {
  const dispatch = useAppDispatch();

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const authHeader = () => ({ Authorization: `Bearer ${getAuthToken()}` });

  const params = new URLSearchParams();
  if (companyId) params.set("companyId", String(companyId));
  if (module) params.set("module", module);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  const cacheKey = `journals-${companyId ?? "all"}-${module ?? "all"}`;

  const { data: journals, loading: isLoading, refetch } = useApiQuery(cacheKey, async () => {
    const res = await fetch(`${API_URL}/accounting/journals${queryStr}`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch journals");
    return res.json();
  });

  const getJournalById = useCallback(async (refNo: string) => {
    if (!refNo) return null;
    const res = await fetch(
      `${API_URL}/accounting/journals/detail?id=${encodeURIComponent(refNo)}`,
      { headers: authHeader() }
    );
    if (!res.ok) return null;
    return res.json();
  }, []);

  const deleteJournal = useCallback(async (refNo: string) => {
    const res = await fetch(
      `${API_URL}/accounting/journals?id=${encodeURIComponent(refNo)}`,
      { method: "DELETE", headers: authHeader() }
    );
    if (!res.ok) throw new Error("Failed to delete journal entry");
    dispatch(clearCacheKey(cacheKey));
    return refNo;
  }, [dispatch, cacheKey]);

  const createJournal = useCallback(async (payload: any) => {
    const res = await fetch(`${API_URL}/accounting/journals`, {
      method: "POST",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Failed to create journal entry");
    }
    dispatch(clearCacheKey(cacheKey));
    dispatch(clearCacheKey("trialBalance"));
    return res.json();
  }, [dispatch, cacheKey]);

  const getLedgerReport = useCallback(async (ledgerId?: number, groupId?: number) => {
    if (!ledgerId && !groupId) return [];
    let url = `${API_URL}/accounting/ledger-report?`;
    if (ledgerId) url += `ledgerId=${ledgerId}`;
    else if (groupId) url += `groupId=${groupId}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) return [];
    return res.json();
  }, []);

  return {
    journals: journals ?? [],
    isLoading,
    refetch,
    getJournalById,
    getLedgerReport,
    deleteJournal,
    createJournal,
  };
}
