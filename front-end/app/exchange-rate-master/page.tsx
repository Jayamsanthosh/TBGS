"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchExchangeRates, addExchangeRate, updateExchangeRate, deleteExchangeRate, clearExchangeRatesError, ExchangeRateGridData } from "@/lib/exchangeRateMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const monthOptions = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const YEAR_START = 2020;
const yearOptions = Array.from(
  { length: new Date().getFullYear() + 10 - YEAR_START + 1 },
  (_, i) => {
    const y = String(YEAR_START + i);
    return { label: y, value: y };
  }
);

const MONTH_NAME_TO_NUM: Record<string, string> = {
  january: "1", jan: "1",
  february: "2", feb: "2",
  march: "3", mar: "3",
  april: "4", apr: "4",
  may: "5",
  june: "6", jun: "6",
  july: "7", jul: "7",
  august: "8", aug: "8",
  september: "9", sep: "9",
  october: "10", oct: "10",
  november: "11", nov: "11",
  december: "12", dec: "12",
};

// Resolves the process month from the logged-in session ("August" or "8").
// Falls back to the current calendar month when the session has no value.
const resolveSessionMonth = (sessionMonth?: string): string => {
  const mp = String(sessionMonth || "").trim();
  if (/^\d{1,2}$/.test(mp) && Number(mp) >= 1 && Number(mp) <= 12) return String(Number(mp));
  const byName = MONTH_NAME_TO_NUM[mp.toLowerCase()];
  if (byName) return byName;
  return String(new Date().getMonth() + 1);
};

const resolveSessionYear = (sessionYear?: string): string => {
  const yp = String(sessionYear || "").trim();
  if (/^\d{4}$/.test(yp)) return yp;
  return String(new Date().getFullYear());
};

const baseFields: MasterField[] = [
  {
    key: "COMPANY_ID",
    label: "Company",
    type: "select",
    required: true,
    options: [],
  },
  {
    key: "MONTH_ENTERED",
    label: "Month",
    type: "select",
    required: true,
    options: monthOptions,
  },
  {
    key: "YEAR_ENTERED",
    label: "Year",
    type: "select",
    required: true,
    options: yearOptions,
  },
  {
    key: "DATE_OF_EXCHANGE",
    label: "Date of Exchange",
    type: "date",
    required: true,
  },
  {
    key: "FROM_CURRENCY_ID",
    label: "From Currency",
    type: "select",
    required: true,
    options: [],
  },
  {
    key: "TO_CURRENCY_ID",
    label: "To Currency",
    type: "select",
    required: true,
    options: [],
  },
  {
    key: "EXCHANGE_RATE",
    label: "Exchange Rate",
    type: "number",
    required: true,
    placeholder: "e.g., 1.00000",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(5);
    },
  },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }],
    defaultValue: "ACTIVE",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "ac") return "ACTIVE";
      if (s === "in") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "COMPANY_NAME", label: "Company" },
  { key: "MONTH_ENTERED", label: "Month" },
  { key: "YEAR_ENTERED", label: "Year" },
  { key: "DATE_OF_EXCHANGE", label: "Date" },
  { key: "FROM_CURRENCY_NAME", label: "From Currency" },
  { key: "TO_CURRENCY_NAME", label: "To Currency" },
  { key: "EXCHANGE_RATE", label: "Exchange Rate" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const isActive = sv === "active" || sv === "ac";
      const isInactive = sv === "inactive" || sv === "in";
      const colorClass = isActive
        ? "bg-green-500/10 text-green-600 border-green-200"
        : isInactive
          ? "bg-red-500/10 text-red-600 border-red-200"
          : "bg-blue-500/10 text-blue-600 border-blue-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {isActive ? "Active" : isInactive ? "Inactive" : val}
        </Badge>
      );
    },
  },
];

export default function ExchangeRateMasterPage() {
  const dispatch = useAppDispatch();
  const { exchangeRates, loading, error } = useAppSelector((s) => s.exchangeRates);
  const user = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();

  const { data: companies } = useApiQuery("exchange-rate-company-list", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: currencies } = useApiQuery("exchange-rate-currency-list", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CURRENCY_ID }));
  });

  const companyOptions = useMemo(() => {
    if (!Array.isArray(companies)) return [];
    return companies.map((c: any) => ({
      value: String(c.COMPANY_ID),
      label: c.COMPANY_NAME || `Company #${c.COMPANY_ID}`,
    }));
  }, [companies]);

  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies)) return [];
    return currencies.map((c: any) => ({
      value: String(c.CURRENCY_ID),
      label: c.CURRENCY_NAME || `Currency #${c.CURRENCY_ID}`,
    }));
  }, [currencies]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      if (f.key === "COMPANY_ID") return { ...f, options: companyOptions };
      if (f.key === "FROM_CURRENCY_ID" || f.key === "TO_CURRENCY_ID") return { ...f, options: currencyOptions };
      // Month/Year are locked to the logged-in session's process period
      if (f.key === "MONTH_ENTERED") {
        return { ...f, options: monthOptions, disabled: true, defaultValue: resolveSessionMonth(user?.monthProcess) };
      }
      if (f.key === "YEAR_ENTERED") {
        return { ...f, options: yearOptions, disabled: true, defaultValue: resolveSessionYear(user?.yearProcess) };
      }
      return f;
    });
  }, [companyOptions, currencyOptions, user?.monthProcess, user?.yearProcess]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(exchangeRates)) return [];
    return exchangeRates.map((u: any) => {
      const company = Array.isArray(companies)
        ? companies.find((c: any) => Number(c.COMPANY_ID) === Number(u.COMPANY_ID))
        : undefined;
      const fromCurrency = Array.isArray(currencies)
        ? currencies.find((c: any) => Number(c.CURRENCY_ID) === Number(u.FROM_CURRENCY_ID))
        : undefined;
      const toCurrency = Array.isArray(currencies)
        ? currencies.find((c: any) => Number(c.CURRENCY_ID) === Number(u.TO_CURRENCY_ID))
        : undefined;
      return {
        ...u,
        COMPANY_NAME: company?.COMPANY_NAME || `ID: ${u.COMPANY_ID}`,
        FROM_CURRENCY_NAME: fromCurrency?.CURRENCY_NAME || `ID: ${u.FROM_CURRENCY_ID}`,
        TO_CURRENCY_NAME: toCurrency?.CURRENCY_NAME || `ID: ${u.TO_CURRENCY_ID}`,
      };
    });
  }, [exchangeRates, companies, currencies]);

  useEffect(() => {
    dispatch(fetchExchangeRates());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearExchangeRatesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: ExchangeRateGridData) => {
      let res;
      try {
        res = await dispatch(addExchangeRate(item)).unwrap();
      } catch (e) {
        throw new Error(typeof e === 'string' ? e : (e as any)?.message || 'Failed to add exchange rate');
      }
      dispatch(fetchExchangeRates());
      return res;
    },
    update: async (item: ExchangeRateGridData) => {
      let res;
      try {
        res = await dispatch(updateExchangeRate(item)).unwrap();
      } catch (e) {
        throw new Error(typeof e === 'string' ? e : (e as any)?.message || 'Failed to update exchange rate');
      }
      dispatch(fetchExchangeRates());
      return res;
    },
    remove: async (id: string) => {
      let res;
      try {
        res = await dispatch(deleteExchangeRate(id)).unwrap();
      } catch (e) {
        throw new Error(typeof e === 'string' ? e : (e as any)?.message || 'Failed to delete exchange rate');
      }
      dispatch(fetchExchangeRates());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        try {
          res = await dispatch(deleteExchangeRate(id)).unwrap();
        } catch (e) {
          throw new Error(typeof e === 'string' ? e : (e as any)?.message || 'Failed to delete exchange rate');
        }
      }
      dispatch(fetchExchangeRates());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Exchange Rate Master"
      description="Manage exchange rate master data"
      idPrefix="EXR"
      domain="exchange-rate-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
