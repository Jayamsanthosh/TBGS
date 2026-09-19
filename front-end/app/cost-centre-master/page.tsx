"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCostCentres, addCostCentre, updateCostCentre, deleteCostCentre, clearCostCentreError, CostCentreGridData } from "@/lib/costCentreMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "COST_CENTRE_NAME",
    label: "Cost Centre Name",
    type: "text",
    required: true,
    placeholder: "e.g., Production Unit A"
  },
  {
    key: "COMPANY_ID",
    label: "Company",
    type: "select",
    required: true,
    options: [],
  },
  {
    key: "REMARKS",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes..."
  },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" }
    ],
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
  { key: "COST_CENTRE_NAME", label: "Cost Centre Name" },
  { key: "COMPANY_NAME", label: "Company" },
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

export default function CostCentreMasterPage() {
  const dispatch = useAppDispatch();
  const { centres, loading, error } = useAppSelector((s) => s.costCentre);
  const { toast } = useToast();

  const { data: companies } = useApiQuery("cost-centre-company-list", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const companyOptions = useMemo(() => {
    if (!Array.isArray(companies)) return [];
    return companies.map((c: any) => ({
      value: String(c.COMPANY_ID),
      label: c.COMPANY_NAME || `Company #${c.COMPANY_ID}`,
    }));
  }, [companies]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "COMPANY_ID") {
        return { ...f, options: companyOptions };
      }
      return f;
    });
  }, [companyOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(centres)) return [];
    return centres.map((u: any) => {
      const company = Array.isArray(companies)
        ? companies.find((c: any) => Number(c.COMPANY_ID) === Number(u.COMPANY_ID))
        : undefined;
      return {
        id: u.COST_CENTRE_ID,
        COST_CENTRE_ID: u.COST_CENTRE_ID,
        COST_CENTRE_NAME: u.COST_CENTRE_NAME,
        COMPANY_ID: String(u.COMPANY_ID ?? ""),
        REMARKS: u.REMARKS,
        STATUS_MASTER: u.STATUS_MASTER,
        COMPANY_NAME: company?.COMPANY_NAME || `ID: ${u.COMPANY_ID}`,
      };
    });
  }, [centres, companies]);

  useEffect(() => {
    dispatch(fetchCostCentres());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearCostCentreError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: CostCentreGridData) => {
      const res = await dispatch(addCostCentre(item)).unwrap();
      dispatch(fetchCostCentres());
      return res;
    },
    update: async (item: CostCentreGridData) => {
      const res = await dispatch(updateCostCentre(item)).unwrap();
      dispatch(fetchCostCentres());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCostCentre(id)).unwrap();
      dispatch(fetchCostCentres());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCostCentre(id)).unwrap();
      }
      dispatch(fetchCostCentres());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Cost Centre Master"
      description="Manage cost centre master data"
      idPrefix="CST"
      domain="cost-centre-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
