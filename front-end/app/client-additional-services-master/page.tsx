"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchClientAdditionalServices,
  addClientAdditionalService,
  updateClientAdditionalService,
  deleteClientAdditionalService,
  clearClientAdditionalServicesError,
  ClientAdditionalServicesGridData,
} from "@/lib/clientAdditionalServicesMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

const statusFormatter = (val: any) => {
  const s = String(val || "").toUpperCase();
  if (s === "AC") return "ACTIVE";
  if (s === "IN") return "INACTIVE";
  return val;
};

const statusBadge = (val: any) => {
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
};

export default function ClientAdditionalServicesMasterPage() {
  const dispatch = useAppDispatch();
  const { services, loading, error } = useAppSelector((s) => s.clientAdditionalServices);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: currencies } = useApiQuery("cas-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CURRENCY_ID }));
  });

  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies)) return [];
    return currencies.map((c: any) => ({
      value: String(c.CURRENCY_ID),
      label: c.CURRENCY_NAME || `ID: ${c.CURRENCY_ID}`,
    }));
  }, [currencies]);

  const { data: uoms } = useApiQuery("cas-uoms", async () => {
    const res = await fetch(`${API_URL}/uom-master`);
    if (!res.ok) throw new Error("Failed to fetch UOMs");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.UOM_ID }));
  });

  const { data: employees } = useApiQuery("cas-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const uomOptions = useMemo(() => {
    if (!Array.isArray(uoms)) return [];
    return uoms.map((u: any) => ({
      value: String(u.UOM_NAME),
      label: u.UOM_NAME,
    }));
  }, [uoms]);

  const baseFields: MasterField[] = [
    { key: "SERVICES_NAME", label: "Service Name", type: "text", required: true, placeholder: "e.g., Installation Charges", maxLength: 50 },
    { key: "UOM", label: "UOM", type: "select", options: [], placeholder: "Select UOM" },
    { key: "UNIT_PRICE", label: "Unit Price", type: "number", required: true, placeholder: "e.g., 500.00" },
    { key: "CURRENCY_ID", label: "Currency", type: "select", required: true, options: [], placeholder: "Select currency" },
    {
      key: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID",
      label: "Section Head Employee",
      type: "employee",
      placeholder: "Search & select section head",
      storageFormatter: (v: any) => (v === "" || v == null ? null : Number(v)),
      renderField: ({ form, setForm }) => (
        <div className="flex flex-col gap-1.5">
          {/* <Label className="text-xs">Section Head Employee</Label> */}
          <EmployeeCombobox
            value={form.SECTION_HEAD_RESPONSE_PERSON_EMP_ID}
            onChange={(v) => setForm((f: any) => ({ ...f, SECTION_HEAD_RESPONSE_PERSON_EMP_ID: v }))}
            options={employees || []}
          />
        </div>
      ),
    },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks", maxLength: 1000 },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
      defaultValue: "AC",
      formatter: statusFormatter,
    },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      if (f.key === "CURRENCY_ID") return { ...f, options: currencyOptions };
      if (f.key === "UOM") return { ...f, options: uomOptions };
      return f;
    });
  }, [currencyOptions, uomOptions]);

  const columns = useMemo(() => [
    { key: "SERVICES_ID", label: "ID" },
    { key: "SERVICES_NAME", label: "Service Name" },
    { key: "UOM", label: "UOM" },
    { key: "UNIT_PRICE", label: "Unit Price" },
    { key: "CURRENCY_NAME", label: "Currency" },
    { key: "REMARKS", label: "Remarks" },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
  ], []);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(services)) return [];
    return services.map((u: any) => {
      const currency = Array.isArray(currencies)
        ? currencies.find((c: any) => Number(c.CURRENCY_ID) === Number(u.CURRENCY_ID))
        : undefined;
      return {
        ...u,
        id: u.SERVICES_ID,
        SERVICES_ID: u.SERVICES_ID,
        CURRENCY_ID: String(u.CURRENCY_ID ?? ""),
        CURRENCY_NAME: currency?.CURRENCY_NAME || u.CURRENCY_NAME || (u.CURRENCY_ID ? `ID: ${u.CURRENCY_ID}` : ""),
      };
    });
  }, [services, currencies]);

  useEffect(() => {
    dispatch(fetchClientAdditionalServices(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearClientAdditionalServicesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: ClientAdditionalServicesGridData) => {
      const res = await dispatch(addClientAdditionalService(item)).unwrap();
      dispatch(fetchClientAdditionalServices(currentStatus));
      return res;
    },
    update: async (item: ClientAdditionalServicesGridData) => {
      const res = await dispatch(updateClientAdditionalService(item)).unwrap();
      dispatch(fetchClientAdditionalServices(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteClientAdditionalService(id)).unwrap();
      dispatch(fetchClientAdditionalServices(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteClientAdditionalService(id)).unwrap();
      }
      dispatch(fetchClientAdditionalServices(currentStatus));
      return res;
    },
  }), [enrichedData, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Client Additional Services Master"
      description="Manage client additional services master data"
      idPrefix="SVC"
      domain="client-additional-services-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      onBeforeEdit={async (item) => {
        const id = Number(item.SERVICES_ID ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/client-additional-services-master/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
  );
}
