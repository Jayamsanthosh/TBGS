"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/lib/reduxQuery";
import { useAppDispatch } from "@/lib/store";
import { clearCacheKey } from "@/lib/reduxQuery";
import { BASE_PATH } from "@/lib/config";

const EMPTY_ARRAY: any[] = [];

export function useMasterData(domain: string, initialData: any[] = [], idPrefix: string = "ID") {
  const dispatch = useAppDispatch();
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

  const getAuditData = () => {
    if (typeof window === 'undefined') return { macAddress: 'SERVER', user: 'System' };
    
    let mac = localStorage.getItem('client_mac_id');
    if (!mac) {
      mac = 'WEB-' + Math.random().toString(36).substring(2, 15).toUpperCase();
      localStorage.setItem('client_mac_id', mac);
    }
    
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    let user = 'Admin';
    let role = 'Admin';
    try {
      if (userJson) {
        const u = JSON.parse(userJson);
        user = u.LOGIN_NAME || u.username || 'Admin';
        role = u.role || 'Admin';
      }
    } catch (e) {}
    
    return { macAddress: mac, user, token, role };
  };

  const handleAuthError = (status: number) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = `${BASE_PATH}/login`;
    }
  };

  const toCamel = (s: string) => s.toLowerCase().replace(/_([a-z])/g, (m, c) => c.toUpperCase());

  const mapItem = (item: any, index: number) => {
    const normalized: any = {};
    const keys = Object.keys(item);
    
    const idKey = keys.find(k => k.toUpperCase() === 'ID' || k.toLowerCase() === 'id') || 
                  keys.find(k => k.toUpperCase() === 'SNO') || 
                  keys.find(k => k.toUpperCase().endsWith('_REF_NO')) ||
                  keys.find(k => k.toUpperCase().endsWith('_ID')) || 
                  keys[0]; 
    
    keys.forEach(key => {
      if (key.includes('_') || key === key.toUpperCase()) {
        normalized[toCamel(key)] = item[key];
      } else {
        normalized[key] = item[key];
      }
    });
    
    return { ...normalized, id: item[idKey] ?? `temp-id-${index}` };
  };

  const initialMapped = useCallback(() => initialData.map((item, idx) => mapItem(item, idx)), [initialData]);

  const { data, loading: isLoading, error, refetch } = useApiQuery(domain, async () => {
    try {
      const { token } = getAuditData();
      const response = await fetch(`${BASE_URL}/${domain}`, {
          headers: { 
              'Authorization': `Bearer ${token}`
          }
      });

      if (response.status === 401 || response.status === 403) {
          handleAuthError(response.status);
          throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error(`Failed to fetch ${domain}`);
      const rawData = await response.json();
      // Handle both raw arrays and envelope format { data: [], success: true }
      const items = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [];
      const mapped = items.map((item: any, idx: number) => mapItem(item, idx));
      
      return mapped.length > 0 ? mapped : initialMapped();
    } catch (err) {
      console.warn(`Falling back to initial data for ${domain}`);
      return initialMapped();
    }
  });

  const add = useCallback(async (newItem: any) => {
    const { token, ...audit } = getAuditData();
    const response = await fetch(`${BASE_URL}/${domain}`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...newItem, audit })
    });
    if (!response.ok) {
      handleAuthError(response.status);
      let errMsg = 'Failed to create';
      try {
        const errBody = await response.json();
        errMsg = errBody?.msg || errBody?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    dispatch(clearCacheKey(domain));
    return response.json();
  }, [dispatch, domain]);

  const update = useCallback(async (updatedItem: any) => {
    const { id, ...body } = updatedItem;
    const { token, ...audit } = getAuditData();
    const response = await fetch(`${BASE_URL}/${domain}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...body, audit })
    });
    if (!response.ok) {
      handleAuthError(response.status);
      let errMsg = 'Failed to update';
      try {
        const errBody = await response.json();
        errMsg = errBody?.msg || errBody?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    dispatch(clearCacheKey(domain));
    return response.json();
  }, [dispatch, domain]);

  const remove = useCallback(async (id: string) => {
    const { token } = getAuditData();
    const response = await fetch(`${BASE_URL}/${domain}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 
          'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      handleAuthError(response.status);
      let errMsg = 'Failed to delete';
      try {
        const errBody = await response.json();
        errMsg = errBody?.msg || errBody?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    dispatch(clearCacheKey(domain));
    const body = await response.json();
    return body;
  }, [dispatch, domain]);

  const bulkRemove = useCallback(async (ids: string[]) => {
    const { token } = getAuditData();
    const response = await fetch(`${BASE_URL}/${domain}/bulk-delete`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      handleAuthError(response.status);
      let errMsg = 'Failed to bulk delete';
      try {
        const errBody = await response.json();
        errMsg = errBody?.msg || errBody?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    dispatch(clearCacheKey(domain));
    const body = await response.json();
    return body;
  }, [dispatch, domain]);

  return {
    data: data ?? EMPTY_ARRAY,
    isLoading,
    error,
    add,
    update,
    remove,
    bulkRemove,
  };
}
