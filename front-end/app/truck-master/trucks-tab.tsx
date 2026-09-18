"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchTrucks,
  fetchTruckById,
  addTruck,
  updateTruck,
  deleteTruck,
  clearTruckError,
  type TruckGridData
} from "@/lib/truckMasterHdrSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { validateTanzaniaPhone, validateTin, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import EntityFilesViewerDialog from "@/components/EntityFilesViewerDialog";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const emptyForm = (): Record<string, any> => ({
  TRUCK_NO: "",
  TRUCK_TYPE_ID: "",
  TRUCK_CHASSIS_NO: "",
  TRAILER_ID: "",
  TRAILER_TYPE_ID: "",
  TRIP_INSIDE_OUTSIDE_STATUS: "",
  DRIVER_EMP_ID: "",
  DRIVER_NAME: "",
  COMPANY_ID: "",
  DEPARTMENT_ID: "",
  DESIGNATION_ID: "",
  DRIVER_PHONE_NO: "",
  DRIVING_LICENSE_NO: "",
  DRIVING_LICENSE_EXPIRY_DATE: "",
  TRUCK_COMPANY_ID: "",
  IMPORTED_COUNTRY_ID: "",
  PURCHASED_SUPPLIER_ID: "",
  PURCHASE_DATE: "",
  FUEL_TYPE_ID: "",
  TRUCK_CAPACITY: "",
  TRUCK_CHASES_NO: "",
  VEHICLE_CONTROL_NO: "",
  ENGINE_NO: "",
  ENGINE_CAPACITY: "",
  NO_OF_AXLES: "",
  AXLE_DISTANCE: "",
  TITLE_HOLDER: "",
  TITLE_HOLDER_TIN_NO: "",
  TITLE_HOLDER_ADDRESS: "",
  LATEST_INSURANCE_NO: "",
  INSURANCE_AMOUNT: "",
  MAKE: "",
  MODEL: "",
  MODEL_NO: "",
  BODY_TYPE: "",
  CLASS: "",
  MANUFACTURE_YEAR: "",
  SEATING_CAPACITY: "",
  TARE_WEIGHT: "",
  GROSS_WEIGHT: "",
  FIXED_ROUTE: "",
  TRUCK_STATUS: "",
  TARGET_KM_TRUCK: "",
  GOODS_CAPACITY: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

export default function TrucksTab({ onViewFiles, linkPagesId }: { onViewFiles?: (truckNo: string) => void; linkPagesId?: number }) {
  const dispatch = useAppDispatch();
  const { trucks, loading, error } = useAppSelector((s) => s.truckMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TruckGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [viewerTruckId, setViewerTruckId] = useState<string | number | null>(null);
  const [viewerTruckNo, setViewerTruckNo] = useState("");
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (linkPagesId === undefined) return;
    let cancelled = false;
    fetch(`${API_URL}/dms?linkPagesId=${encodeURIComponent(String(linkPagesId))}&status=ALL`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file counts");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const counts: Record<string, number> = {};
        for (const d of json?.data || []) {
          if (d.PAGE_REF_NO != null) {
            const k = String(d.PAGE_REF_NO);
            counts[k] = (counts[k] || 0) + 1;
          }
        }
        setFileCounts(counts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [linkPagesId, API_URL]);

  const { data: truckTypes } = useApiQuery("truck-master-truck-types", async () => {
    const res = await fetch(`${API_URL}/truck-type-master`);
    if (!res.ok) throw new Error("Failed to fetch truck types");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.TRUCK_TYPE_ID }));
  });

  const { data: trailers } = useApiQuery("truck-master-trailers", async () => {
    const res = await fetch(`${API_URL}/trailer-master`);
    if (!res.ok) throw new Error("Failed to fetch trailers");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.TRAILER_ID }));
  });

  const { data: trailerTypes } = useApiQuery("truck-master-trailer-types", async () => {
    const res = await fetch(`${API_URL}/trailer-type-master`);
    if (!res.ok) throw new Error("Failed to fetch trailer types");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.TRAILER_TYPE_ID }));
  });

  const { data: companies } = useApiQuery("truck-master-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: departments } = useApiQuery("truck-master-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.DEPARTMENT_ID }));
  });

  const { data: designations } = useApiQuery("truck-master-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.DESIGNATION_ID }));
  });

  const { data: deptDesigMappings } = useApiQuery("truck-master-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: countries } = useApiQuery("truck-master-countries", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const { data: suppliers } = useApiQuery("truck-master-suppliers", async () => {
    const res = await fetch(`${API_URL}/business-partner-master`);
    if (!res.ok) throw new Error("Failed to fetch suppliers");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.BP_ID }));
  });

  const { data: fuelTypes } = useApiQuery("truck-master-fuel-types", async () => {
    const res = await fetch(`${API_URL}/fuel-type-master/options`);
    if (!res.ok) throw new Error("Failed to fetch fuel types");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.FUEL_TYPE_ID }));
  });

  const { data: drivers } = useApiQuery("truck-master-drivers", async () => {
    const res = await fetch(`${API_URL}/driver-master/options`);
    if (!res.ok) throw new Error("Failed to fetch drivers");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.DRIVER_EMP_ID }));
  });

  const truckTypeOptions = useMemo(
    () => (Array.isArray(truckTypes) ? truckTypes.map((t: any) => ({ value: String(t.TRUCK_TYPE_ID), label: t.TRUCK_TYPE_NAME })) : []),
    [truckTypes]
  );

  const trailerOptions = useMemo(
    () => (Array.isArray(trailers) ? trailers.map((t: any) => ({ value: String(t.TRAILER_ID), label: t.TRAILER_NO })) : []),
    [trailers]
  );

  const trailerTypeOptions = useMemo(
    () => (Array.isArray(trailerTypes) ? trailerTypes.map((t: any) => ({ value: String(t.TRAILER_TYPE_ID), label: t.TRAILER_TYPE_NAME })) : []),
    [trailerTypes]
  );

  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies.map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })) : []),
    [companies]
  );

  const cascadeMaps = useMemo(() => {
    const companyDept = new Map<string, Set<string>>();
    const companyDeptDesig = new Map<string, Set<string>>();

    if (Array.isArray(deptDesigMappings)) {
      for (const m of deptDesigMappings) {
        if (m.COMPANY_ID == null || m.DEPARTMENT_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const dk = String(m.DEPARTMENT_ID);
        const deptSet = companyDept.get(ck) || new Set<string>();
        deptSet.add(dk);
        companyDept.set(ck, deptSet);
        if (m.DESIGNATION_ID != null) {
          const key = `${ck}#${dk}`;
          const desigSet = companyDeptDesig.get(key) || new Set<string>();
          desigSet.add(String(m.DESIGNATION_ID));
          companyDeptDesig.set(key, desigSet);
        }
      }
    }

    return { companyDept, companyDeptDesig };
  }, [deptDesigMappings]);

  const cascadeFiltered = (
    key: string,
    arr: any[] | undefined,
    nameKey: string,
    getIds: (form: Record<string, any>) => Set<string> | undefined
  ) =>
    (form: Record<string, any>) => {
      if (!Array.isArray(arr)) return [];
      const ids = getIds(form);
      const filtered = ids ? arr.filter((x: any) => ids.has(String(x[key]))) : [];
      const selected =
        form[key] != null && form[key] !== ""
          ? arr.find((x: any) => String(x[key]) === String(form[key]))
          : undefined;
      if (selected && !filtered.some((x: any) => String(x[key]) === String(selected[key]))) {
        return [...filtered, selected].map((x: any) => ({ value: String(x[key]), label: x[nameKey] || `ID: ${x[key]}` }));
      }
      return filtered.map((x: any) => ({ value: String(x[key]), label: x[nameKey] || `ID: ${x[key]}` }));
    };

  const departmentOptionsByCompany = useMemo(
    () =>
      cascadeFiltered("DEPARTMENT_ID", departments, "DEPARTMENT_NAME", (f) =>
        f.COMPANY_ID != null && f.COMPANY_ID !== ""
          ? cascadeMaps.companyDept.get(String(f.COMPANY_ID))
          : undefined
      ),
    [departments, cascadeMaps]
  );

  const designationOptionsByCompanyDept = useMemo(
    () =>
      cascadeFiltered("DESIGNATION_ID", designations, "DESIGNATION_NAME", (f) =>
        f.COMPANY_ID != null && f.COMPANY_ID !== "" && f.DEPARTMENT_ID != null && f.DEPARTMENT_ID !== ""
          ? cascadeMaps.companyDeptDesig.get(`${String(f.COMPANY_ID)}#${String(f.DEPARTMENT_ID)}`)
          : undefined
      ),
    [designations, cascadeMaps]
  );

  const countryOptions = useMemo(
    () => (Array.isArray(countries) ? countries.map((c: any) => ({ value: String(c.Country_Id), label: c.Country_Name })) : []),
    [countries]
  );

  const supplierOptions = useMemo(
    () => (Array.isArray(suppliers) ? suppliers.map((s: any) => ({ value: String(s.BP_ID), label: s.BP_NAME })) : []),
    [suppliers]
  );

  const fuelTypeOptions = useMemo(
    () => (Array.isArray(fuelTypes) ? fuelTypes.map((f: any) => ({ value: String(f.FUEL_TYPE_ID), label: f.FUEL_TYPE_NAME })) : []),
    [fuelTypes]
  );

  const driverOptions = useMemo(
    () => (Array.isArray(drivers) ? drivers.map((d: any) => ({ value: String(d.DRIVER_EMP_ID), label: `${d.DRIVER_FULL_NAME}` })) : []),
    [drivers]
  );

  const enrichedData = useMemo(() => {
    if (!Array.isArray(trucks)) return [];
    return trucks.map((t: any) => {
      const type = truckTypes?.find((x: any) => Number(x.TRUCK_TYPE_ID) === Number(t.TRUCK_TYPE_ID));
      const company = companies?.find((x: any) => Number(x.COMPANY_ID) === Number(t.TRUCK_COMPANY_ID));
      const country = countries?.find((x: any) => Number(x.Country_Id) === Number(t.IMPORTED_COUNTRY_ID));
      const supplier = suppliers?.find((x: any) => Number(x.BP_ID) === Number(t.PURCHASED_SUPPLIER_ID));
      const trailer = trailers?.find((x: any) => Number(x.TRAILER_ID) === Number(t.TRAILER_ID));
      const fuel = fuelTypes?.find((x: any) => Number(x.FUEL_TYPE_ID) === Number(t.FUEL_TYPE_ID));
      const driver = drivers?.find((x: any) => Number(x.DRIVER_EMP_ID) === Number(t.DRIVER_EMP_ID));
      return {
        ...t,
        TRUCK_TYPE_NAME: type?.TRUCK_TYPE_NAME || `ID: ${t.TRUCK_TYPE_ID}`,
        TRUCK_COMPANY_NAME: company?.COMPANY_NAME || `ID: ${t.TRUCK_COMPANY_ID}`,
        IMPORTED_COUNTRY_NAME: country?.Country_Name || `ID: ${t.IMPORTED_COUNTRY_ID}`,
        IMPORTED_SUPPLIER_NAME: supplier?.BP_NAME || `ID: ${t.PURCHASED_SUPPLIER_ID}`,
        TRAILER_NO: trailer?.TRAILER_NO || (t.TRAILER_ID != null ? `ID: ${t.TRAILER_ID}` : ""),
        FUEL_TYPE_NAME: fuel?.FUEL_TYPE_NAME || `ID: ${t.FUEL_TYPE_ID}`,
        DRIVER_FULL_NAME: driver?.DRIVER_FULL_NAME || t.DRIVER_NAME || "",
      };
    });
  }, [trucks, truckTypes, companies, countries, suppliers, trailers, fuelTypes, drivers]);

  useEffect(() => {
    dispatch(fetchTrucks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearTruckError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedData.filter((d: any) =>
      String(d.STATUS_MASTER) === statusFilter &&
      [
        d.TRUCK_NO,
        d.TRUCK_CHASSIS_NO,
        d.TRUCK_TYPE_NAME,
        d.DRIVER_FULL_NAME,
        d.DRIVER_PHONE_NO,
        d.MAKE,
        d.MODEL,
        d.MODEL_NO,
        d.TRUCK_COMPANY_NAME,
        d.VEHICLE_CONTROL_NO,
        d.TRUCK_STATUS,
        d.STATUS_MASTER,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [enrichedData, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const fillForm = (item: any) => {
    setForm({
      ...emptyForm(),
      ...item,
      TRUCK_TYPE_ID: item.TRUCK_TYPE_ID != null ? String(item.TRUCK_TYPE_ID) : "",
      TRAILER_ID: item.TRAILER_ID != null ? String(item.TRAILER_ID) : "",
      TRAILER_TYPE_ID: item.TRAILER_TYPE_ID != null ? String(item.TRAILER_TYPE_ID) : "",
      DRIVER_EMP_ID: item.DRIVER_EMP_ID != null ? String(item.DRIVER_EMP_ID) : "",
      DRIVER_PHONE_NO: formatTanzaniaPhone(item.DRIVER_PHONE_NO),
      COMPANY_ID: item.COMPANY_ID != null ? String(item.COMPANY_ID) : "",
      DEPARTMENT_ID: item.DEPARTMENT_ID != null ? String(item.DEPARTMENT_ID) : "",
      DESIGNATION_ID: item.DESIGNATION_ID != null ? String(item.DESIGNATION_ID) : "",
      TRUCK_COMPANY_ID: item.TRUCK_COMPANY_ID != null ? String(item.TRUCK_COMPANY_ID) : "",
      IMPORTED_COUNTRY_ID: item.IMPORTED_COUNTRY_ID != null ? String(item.IMPORTED_COUNTRY_ID) : "",
      PURCHASED_SUPPLIER_ID: item.PURCHASED_SUPPLIER_ID != null ? String(item.PURCHASED_SUPPLIER_ID) : "",
      FUEL_TYPE_ID: item.FUEL_TYPE_ID != null ? String(item.FUEL_TYPE_ID) : "",
      DRIVING_LICENSE_EXPIRY_DATE: item.DRIVING_LICENSE_EXPIRY_DATE ? String(item.DRIVING_LICENSE_EXPIRY_DATE).split("T")[0] : "",
      PURCHASE_DATE: item.PURCHASE_DATE ? String(item.PURCHASE_DATE).split("T")[0] : "",
    });
  };

  const openEdit = async (item: TruckGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    fillForm(item);
    try {
      const res: any = await dispatch(
        fetchTruckById(Number(item.TRUCK_ID) || Number(item.id))
      ).unwrap();
      if (res) {
        fillForm(res);
      }
    } catch {
      // fallback to grid row data
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.TRUCK_NO || !String(form.TRUCK_NO).trim()) {
      toast({ variant: "destructive", title: "Truck No is required" });
      return;
    }
    if (form.DRIVER_PHONE_NO && !validateTanzaniaPhone(String(form.DRIVER_PHONE_NO))) {
      toast({ variant: "destructive", title: "Driver Phone No must be in Tanzania format (e.g., +255XXXXXXXXX)" });
      return;
    }
    if (form.TITLE_HOLDER_TIN_NO && !validateTin(String(form.TITLE_HOLDER_TIN_NO))) {
      toast({ variant: "destructive", title: "Title Holder TIN No must be exactly 9 digits" });
      return;
    }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        DRIVER_PHONE_NO: cleanPhoneForStorage(form.DRIVER_PHONE_NO),
        TRUCK_NO: form.TRUCK_NO?.trim(),
        MAKE: form.MAKE?.trim(),
        MODEL: form.MODEL?.trim(),
        MODEL_NO: form.MODEL_NO?.trim(),
        ENGINE_NO: form.ENGINE_NO?.trim(),
        TITLE_HOLDER: form.TITLE_HOLDER?.trim(),
        REMARKS: form.REMARKS?.trim(),
        ENGINE_CAPACITY: form.ENGINE_CAPACITY === "" ? undefined : Math.max(0, Number(form.ENGINE_CAPACITY) || 0),
        NO_OF_AXLES: form.NO_OF_AXLES === "" ? undefined : Math.max(0, Number(form.NO_OF_AXLES) || 0),
        AXLE_DISTANCE: form.AXLE_DISTANCE === "" ? undefined : Math.max(0, Number(form.AXLE_DISTANCE) || 0),
        TARGET_KM_TRUCK: form.TARGET_KM_TRUCK === "" ? undefined : Math.max(0, Number(form.TARGET_KM_TRUCK) || 0),
        TRUCK_CAPACITY: form.TRUCK_CAPACITY === "" ? undefined : Math.max(0, Number(form.TRUCK_CAPACITY) || 0),
        TARE_WEIGHT: form.TARE_WEIGHT === "" ? undefined : Math.max(0, Number(form.TARE_WEIGHT) || 0),
        GROSS_WEIGHT: form.GROSS_WEIGHT === "" ? undefined : Math.max(0, Number(form.GROSS_WEIGHT) || 0),
        INSURANCE_AMOUNT: form.INSURANCE_AMOUNT === "" ? undefined : Math.max(0, Number(form.INSURANCE_AMOUNT) || 0),
      };
      if (editing) {
        const res: any = await dispatch(
          updateTruck({ ...cleanForm, TRUCK_ID: Number(editing.TRUCK_ID) || Number(editing.id) })
        ).unwrap();
        toast({ title: res?.message ?? "Truck updated successfully!" });
      } else {
        const res: any = await dispatch(addTruck({ ...cleanForm })).unwrap();
        if (!res?.TRUCK_ID) {
          throw new Error(res?.message || "Failed to retrieve new Truck ID");
        }
        toast({ title: res?.message ?? "Truck created successfully!" });
      }
      await dispatch(fetchTrucks());
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save truck") });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteTruck(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Truck deleted successfully!" });
      dispatch(fetchTrucks());
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete truck") });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteTruck(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Trucks deleted successfully!" });
      dispatch(fetchTrucks());
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete items!") });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.filter((i: any) => i && i.id).map((i: any) => i.id)));
    }
  };

  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(val === "ALL" ? "ALL" : Number(val));
    setCurrentPage(1);
  };

  const setField = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "DRIVER_EMP_ID") {
        const driver = drivers?.find((d: any) => String(d.DRIVER_EMP_ID) === String(value));
        if (driver) {
          next.DRIVER_NAME = driver.DRIVER_FULL_NAME;
          next.COMPANY_ID = driver.COMPANY_ID != null ? String(driver.COMPANY_ID) : "";
          next.DEPARTMENT_ID = driver.DEPARTMENT_ID != null ? String(driver.DEPARTMENT_ID) : "";
          next.DESIGNATION_ID = driver.DESIGNATION_ID != null ? String(driver.DESIGNATION_ID) : "";
          next.DRIVER_PHONE_NO = driver.PHONE_NUMBER ? formatTanzaniaPhone(driver.PHONE_NUMBER) : "";
          next.DRIVING_LICENSE_NO = driver.DRIVING_LICENSE_NUMBER ?? "";
          next.DRIVING_LICENSE_EXPIRY_DATE = driver.DRIVING_LICENSE_EXPIRY_DATE
            ? String(driver.DRIVING_LICENSE_EXPIRY_DATE).split("T")[0]
            : "";
        }
      }
      if (key === "TRAILER_ID") {
        const trailer = trailers?.find((t: any) => String(t.TRAILER_ID) === String(value));
        if (trailer) {
          next.TRAILER_TYPE_ID = trailer.TRAILER_TYPE_ID != null ? String(trailer.TRAILER_TYPE_ID) : "";
        }
      }
      if (key === "COMPANY_ID") {
        next.DEPARTMENT_ID = "";
        next.DESIGNATION_ID = "";
      }
      if (key === "DEPARTMENT_ID") {
        next.DESIGNATION_ID = "";
      }
      return next;
    });
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "date" | "textarea" | "select",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    formatter?: (val: any) => any,
    disabled?: boolean,
  ) => {
    const value = form[key] ?? "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => setField(key, v)}>
            <SelectTrigger className="w-full" disabled={disabled}>
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={String(value)} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
        ) : type === "date" ? (
          <DatePicker value={String(value)} onChange={(v) => setField(key, v)} placeholder={placeholder} />
        ) : (
          <Input
            type={type}
            value={String(value)}
            placeholder={placeholder}
            min={type === "number" ? "0" : undefined}
            step={type === "number" ? "any" : undefined}
            onChange={(e) => {
              let val: any = e.target.value;
              if (formatter) val = formatter(val);
              else if (type === "number") val = e.target.value === "" ? "" : Number(e.target.value);
              setField(key, val);
            }}
          />
        )}
      </div>
    );
  };

  const sectionTitle = (title: string) => (
    <h3 className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 mt-2">
      {title}
    </h3>
  );

  const statusBadge = (val: any) => {
    const sv = String(val ?? "").toLowerCase().trim();
    const isActive = sv === "active" || sv === "ac";
    const isInactive = sv === "inactive" || sv === "in";
    const colorClass = isActive
      ? "bg-success/10 text-success border-success/20"
      : isInactive
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-info/10 text-info border-info/20";
    return (
      <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
        {isActive ? "Active" : isInactive ? "Inactive" : String(val)}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Truck Master</h1>
          <p className="text-sm text-muted-foreground">Manage truck master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Truck
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trucks..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Active</SelectItem>
                  <SelectItem value="IN">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleting(true)}
                className="animate-in fade-in zoom-in duration-200 shadow-sm border border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePageSizes.map((s) => (
                  <SelectItem key={String(s)} value={String(s)}>
                    {String(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border w-4 h-4 accent-primary"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Files</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Truck No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Driver</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Driver Phone</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Make</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Model</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Truck Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr
                    key={item.id || `row-${idx}`}
                    className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.has(item.id) ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border w-4 h-4 accent-primary"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setViewerTruckId(item.TRUCK_ID);
                            setViewerTruckNo(item.TRUCK_NO || "");
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="View attached files for this Truck"
                        >
                          Files ({Number(fileCounts[String(item.TRUCK_NO ?? "")] ?? 0)})
                        </button>
                        <button
                          onClick={() => onViewFiles && onViewFiles(String(item.TRUCK_NO || ""))}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="View / Upload Files for this Truck"
                        >
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{item.TRUCK_NO}</td>
                    <td className="p-3">{item.TRUCK_TYPE_NAME}</td>
                    <td className="p-3">{item.DRIVER_FULL_NAME || "—"}</td>
                    <td className="p-3">{item.DRIVER_PHONE_NO || "—"}</td>
                    <td className="p-3">{item.MAKE || "—"}</td>
                    <td className="p-3">{item.MODEL || "—"}</td>
                    <td className="p-3">{item.MANUFACTURE_YEAR || "—"}</td>
                    <td className="p-3">{item.TRUCK_STATUS || "—"}</td>
                    <td className="p-3">{item.TRUCK_COMPANY_NAME}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-muted-foreground">
                      No records found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{filtered.length === 0 ? 0 : (currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize) + 1}</span>{" "}
            to <span className="text-foreground">{Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)}</span>{" "}
            of <span className="text-foreground">{filtered.length}</span> entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Truck" : "Add Truck"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {sectionTitle("Truck Details")}
              {renderField("TRUCK_NO", "Truck No", "text", undefined, true, "e.g., TRK-001")}
              {renderField("TRUCK_TYPE_ID", "Truck Type", "select", truckTypeOptions, false, "Select type")}
              {renderField("TRUCK_CHASSIS_NO", "Chassis No", "text", undefined, false, "e.g., CH-123456")}
              {renderField("TRUCK_CHASES_NO", "Chasis No (alt)", "text", undefined, false, "e.g., CH-654321")}
              {renderField("VEHICLE_CONTROL_NO", "Vehicle Control No", "text", undefined, false, "e.g., VC-001")}
              {renderField("ENGINE_NO", "Engine No", "text", undefined, false, "e.g., ENG-001")}
              {renderField("ENGINE_CAPACITY", "Engine Capacity", "number", undefined, false, "e.g., 6000")}
              {renderField("NO_OF_AXLES", "No of Axles", "number", undefined, false, "e.g., 6")}
              {renderField("AXLE_DISTANCE", "Axle Distance", "number", undefined, false, "e.g., 5200")}
              {renderField("MAKE", "Make", "text", undefined, false, "e.g., TATA")}
              {renderField("MODEL", "Model", "text", undefined, false, "e.g., LPT 3118")}
              {renderField("MODEL_NO", "Model No", "text", undefined, false, "e.g., 3118")}
              {renderField("BODY_TYPE", "Body Type", "text", undefined, false, "e.g., Flatbed")}
              {renderField("CLASS", "Class", "text", undefined, false, "e.g., N3")}
              {renderField("MANUFACTURE_YEAR", "Manufacture Year", "text", undefined, false, "e.g., 2020")}
              {renderField("SEATING_CAPACITY", "Seating Capacity", "text", undefined, false, "e.g., 3")}
              {renderField("FIXED_ROUTE", "Fixed Route", "text", undefined, false, "e.g., Dar - Arusha")}
              {renderField("TRUCK_STATUS", "Truck Status", "text", undefined, false, "e.g., Available")}
              {renderField("TARGET_KM_TRUCK", "Target KM / Truck", "number", undefined, false, "e.g., 2000")}
              {renderField("GOODS_CAPACITY", "Goods Capacity", "text", undefined, false, "e.g., 30 tons")}

              {sectionTitle("Trailer")}
              {renderField("TRAILER_ID", "Trailer", "select", trailerOptions, false, "Select trailer")}
              {renderField("TRAILER_TYPE_ID", "Trailer Type", "select", trailerTypeOptions, false, "Select type")}

              {sectionTitle("Driver / Trip")}
              {renderField("TRIP_INSIDE_OUTSIDE_STATUS", "Trip Inside/Outside", "text", undefined, false, "e.g., Inside")}
              {renderField("DRIVER_EMP_ID", "Driver", "select", driverOptions, false, "Select driver")}
              {renderField("DRIVER_NAME", "Driver Name", "text", undefined, false, "Auto-filled on driver select")}
              {renderField("DRIVER_PHONE_NO", "Driver Phone No", "text", undefined, false, "e.g., +255 700 000 000", formatTanzaniaPhone)}
              {renderField("DRIVING_LICENSE_NO", "Driving License No", "text", undefined, false, "e.g., DL-001")}
              {renderField("DRIVING_LICENSE_EXPIRY_DATE", "License Expiry Date", "date", undefined, false)}
              {renderField("COMPANY_ID", "Driver Company", "select", companyOptions, false, "Select company")}
              {renderField("DEPARTMENT_ID", "Department", "select", departmentOptionsByCompany(form), false, "Select department", undefined, !form.COMPANY_ID)}
              {renderField("DESIGNATION_ID", "Designation", "select", designationOptionsByCompanyDept(form), false, "Select designation", undefined, !form.DEPARTMENT_ID)}

              {sectionTitle("Ownership / Purchase")}
              {renderField("TRUCK_COMPANY_ID", "Truck Company", "select", companyOptions, false, "Select company")}
              {renderField("IMPORTED_COUNTRY_ID", "Imported Country", "select", countryOptions, false, "Select country")}
              {renderField("PURCHASED_SUPPLIER_ID", "Purchased Supplier", "select", supplierOptions, false, "Select supplier")}
              {renderField("PURCHASE_DATE", "Purchase Date", "date", undefined, false)}
              {renderField("FUEL_TYPE_ID", "Fuel Type", "select", fuelTypeOptions, false, "Select fuel type")}
              {renderField("TITLE_HOLDER", "Title Holder", "text", undefined, false, "e.g., TBGS Ltd")}
              {renderField("TITLE_HOLDER_TIN_NO", "Title Holder TIN No", "text", undefined, false, "e.g., 123456789")}
              {renderField("TITLE_HOLDER_ADDRESS", "Title Holder Address", "text", undefined, false, "e.g., Dar es Salaam")}

              {sectionTitle("Capacity / Weight / Insurance")}
              {renderField("TRUCK_CAPACITY", "Truck Capacity", "number", undefined, false, "e.g., 40000")}
              {renderField("TARE_WEIGHT", "Tare Weight (kg)", "number", undefined, false, "e.g., 8500")}
              {renderField("GROSS_WEIGHT", "Gross Weight (kg)", "number", undefined, false, "e.g., 40000")}
              {renderField("LATEST_INSURANCE_NO", "Latest Insurance No", "text", undefined, false, "e.g., INS-2024-001")}
              {renderField("INSURANCE_AMOUNT", "Insurance Amount", "number", undefined, false, "e.g., 1500000")}

              {sectionTitle("Remarks")}
              {renderField("STATUS_MASTER", "Status", "select", STATUS_OPTIONS, false, "Select status")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || editLoading} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this truck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple records?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityFilesViewerDialog
        open={viewerTruckId != null}
        entityId={viewerTruckId ?? ""}
        entityLabel={viewerTruckNo}
        onOpenChange={(open) => {
          if (!open) setViewerTruckId(null);
        }}
        listUrl={`${API_URL}/dms?linkPagesId=${encodeURIComponent(String(linkPagesId ?? 0))}&pageRefNo=${encodeURIComponent(String(viewerTruckNo ?? ""))}&status=ALL`}
        contentUrlBuilder={(row) => `${API_URL}/dms/${Number(row?.DMS_ID) || ""}`}
        emptyMessage="No files attached to this truck"
      />
    </div>
  );
}
