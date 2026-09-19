"use client";

import { useApiQuery } from "@/lib/reduxQuery";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export function useDashboard() {
  return useApiQuery("dashboard", async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    const data = await response.json();
    
    return {
      stats: [
        { label: "TOTAL PURCHASES", value: `TZS ${Number(data.stats.totalPurchases).toLocaleString()}`, change: "+12%", icon: "ShoppingCart", color: "text-primary" },
        { label: "TOTAL SALES", value: `TZS ${Number(data.stats.totalSales).toLocaleString()}`, change: "+18%", icon: "DollarSign", color: "text-green-500" },
        { label: "PRODUCTS", value: data.stats.products.toString(), change: "Check Stock", icon: "Package", color: "text-blue-500" },
        { label: "REVENUE", value: `TZS ${Number(data.stats.revenue).toLocaleString()}`, change: "+23%", icon: "TrendingUp", color: "text-amber-500" },
        { label: "PENDING DELIVERIES", value: data.stats.pendingDeliveries.toString(), change: "Due today", icon: "Truck", color: "text-primary" },
        { label: "LOW STOCK", value: data.stats.lowStockAlerts.toString(), change: "Urgent", icon: "AlertTriangle", color: "text-destructive" },
      ],
      monthlyData: data.monthlyData,
      categories: data.categories,
      recentActivity: mapActivity(data.recentActivity)
    };
  });
}

export function usePurchaseDashboard() {
  return useApiQuery("dashboard-purchase", async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/dashboard/purchase`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch purchase dashboard");
    const data = await response.json();
    return {
      ...data,
      stats: [
        { label: "TOTAL POs", value: data.stats.totalPOs, icon: "Package", color: "text-primary" },
        { label: "APPROVED", value: data.stats.approvedPOs, icon: "CheckCircle2", color: "text-green-500" },
        { label: "PENDING", value: data.stats.pendingPOs, icon: "Clock", color: "text-amber-500" },
        { label: "TOTAL SPENT", value: `TZS ${Number(data.stats.totalSpent).toLocaleString()}`, icon: "DollarSign", color: "text-emerald-600" },
        { label: "ACTIVE SUPPLIERS", value: data.stats.activeSuppliers, icon: "Users", color: "text-blue-600" },
      ],
      recentActivity: mapActivity(data.recentActivity)
    };
  });
}

export function useSalesDashboard() {
  return useApiQuery("dashboard-sales", async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/dashboard/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch sales dashboard");
    const data = await response.json();
    return {
      ...data,
      stats: [
        { label: "TOTAL ORDERS", value: data.stats.totalOrders, icon: "ShoppingCart", color: "text-primary" },
        { label: "TAX INVOICES", value: data.stats.totalInvoices, icon: "FileText", color: "text-blue-500" },
        { label: "REVENUE", value: `TZS ${Number(data.stats.revenue).toLocaleString()}`, icon: "TrendingUp", color: "text-green-600" },
        { label: "CUSTOMERS", value: data.stats.activeCustomers, icon: "Users", color: "text-amber-600" },
      ],
      recentActivity: mapActivity(data.recentActivity)
    };
  });
}

function mapActivity(items: any[]) {
  return (items || []).map((a: any) => {
    let statusColor = "bg-slate-400";
    if (a.status === "Approved" || a.status === "RECEIVED" || a.status === "DELIVERED") statusColor = "bg-emerald-500";
    if (a.status === "PENDING") statusColor = "bg-amber-500";
    if (a.status === "Draft") statusColor = "bg-slate-300";
    return {
      ...a,
      amount: `TZS ${Number(a.amount).toLocaleString()}`,
      statusColor
    };
  });
}
