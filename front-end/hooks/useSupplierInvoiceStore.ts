"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Global State for Supplier Invoices with LocalStorage Persistence
 */

const STORAGE_KEY = "agromanage_supplier_invoices";

const listeners = new Set<Function>();
const notify = () => listeners.forEach(l => l());

const getStoredInvoices = (): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load Supplier Invoices from storage", e);
    return [];
  }
};

const saveInvoices = (invoices: any[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  notify();
};

export function useSupplierInvoiceStore() {
  const [invoices, setInvoices] = useState<any[]>(getStoredInvoices());

  useEffect(() => {
    const handleChange = () => setInvoices(getStoredInvoices());
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const addInvoice = useCallback((invoice: any) => {
    const current = getStoredInvoices();
    const newInvoice = { 
      ...invoice, 
      id: invoice.id || `INV-${Date.now()}`,
      createdAt: new Date().toISOString() 
    };
    saveInvoices([newInvoice, ...current]);
    return newInvoice;
  }, []);

  const updateInvoice = useCallback((id: string, updatedData: any) => {
    const current = getStoredInvoices();
    const updated = current.map(inv => (inv.id === id || inv.invoiceNo === id) ? { ...inv, ...updatedData } : inv);
    saveInvoices(updated);
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    const current = getStoredInvoices();
    const filtered = current.filter(inv => inv.id !== id && inv.invoiceNo !== id);
    saveInvoices(filtered);
  }, []);

  const getInvoiceById = useCallback((id: string) => {
    return getStoredInvoices().find(inv => inv.id === id || inv.invoiceNo === id);
  }, []);

  return {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    isLoading: false
  };
}
