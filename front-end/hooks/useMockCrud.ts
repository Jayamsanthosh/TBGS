'use client';

import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface UseCrudOptions {
  table: string;
}

export function useMockCrud<T extends { id: number | string }>({ table }: UseCrudOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize from mockData if available
  useEffect(() => {
    const initialData: any[] = [];
    // Convert sno to id if needed for compatibility
    const mapped = initialData.map((item: any) => ({
      ...item,
      id: item.id || item.sno || Math.random().toString(36).substr(2, 9)
    }));
    setData(mapped);
    setLoading(false);
  }, [table]);

  const fetchData = useCallback(async () => {
    // Already in state for mock
  }, []);

  const create = async (record: Partial<T>) => {
    const newRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
    } as T;
    setData(prev => [...prev, newRecord]);
    toast({ title: "Success", description: "Record created successfully (Mock)" });
    return true;
  };

  const update = async (id: number | string, record: Partial<T>) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, ...record } : item));
    toast({ title: "Success", description: "Record updated successfully (Mock)" });
    return true;
  };

  const remove = async (id: number | string) => {
    setData(prev => prev.filter(item => item.id !== id));
    toast({ title: "Success", description: "Record deleted successfully (Mock)" });
    return true;
  };

  return { data, loading, create, update, remove, refresh: fetchData };
}
