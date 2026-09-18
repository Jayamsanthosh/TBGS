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
import { EmployeeDropdown } from "@/components/EmployeeDropdown";
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
import { formatDate as formatDateDisplay } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDrivers,
  fetchDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
  clearDriverMasterError,
  type DriverMasterGridData
} from "@/lib/driverMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { validateTanzaniaPhone, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";
import EntityFilesViewerDialog from "@/components/EntityFilesViewerDialog";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const emptyForm = (): Record<string, any> => ({
  DRIVER_EMP_ID: "",
  DRIVER_FULL_NAME: "",
  COMPANY_ID: "",
  DEPARTMENT_ID: "",
  DESIGNATION_ID: "",
  PHONE_NUMBER: "",
  DRIVING_LICENSE_NUMBER: "",
  DRIVING_LICENSE_EXPIRY_DATE: "",
  VEHICLE_CATEGORIES_LICENSED: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

const formatDate = (v: any) => formatDateDisplay(v);

export default function DriversTab({ onViewFiles, linkPagesId }: { onViewFiles?: (driverEmpId: string) => void; linkPagesId?: number }) {
  const dispatch = useAppDispatch();
  const { drivers, loading, error } = useAppSelector((s) => s.driverMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverMasterGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [viewerDriverEmpId, setViewerDriverEmpId] = useState<string | number | null>(null);
  const [viewerDriverName, setViewerDriverName] = useState("");
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

  const { data: companies } = useApiQuery("driver-master-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: departments } = useApiQuery("driver-master-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.DEPARTMENT_ID }));
  });

  const { data: designations } = useApiQuery("driver-master-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.DESIGNATION_ID }));
  });

  const { data: deptDesigMappings } = useApiQuery("driver-master-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employeeRows } = useApiQuery("active-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

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

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDriverMasterError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drivers.filter((d: any) => {
      const matchesStatus = String(d.STATUS_MASTER) === statusFilter;
      if (!matchesStatus) return false;
      return (
        [
          d.DRIVER_EMP_ID,
          d.DRIVER_FULL_NAME,
          d.COMPANY_NAME,
          d.DEPARTMENT_NAME,
          d.DESIGNATION_NAME,
          d.PHONE_NUMBER,
          d.DRIVING_LICENSE_NUMBER,
          d.VEHICLE_CATEGORIES_LICENSED,
          d.STATUS_MASTER,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [drivers, search, statusFilter]);

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
      PHONE_NUMBER: formatTanzaniaPhone(item.PHONE_NUMBER),
      DRIVER_EMP_ID: item.DRIVER_EMP_ID != null ? String(item.DRIVER_EMP_ID) : "",
      COMPANY_ID: item.COMPANY_ID != null ? String(item.COMPANY_ID) : "",
      DEPARTMENT_ID: item.DEPARTMENT_ID != null ? String(item.DEPARTMENT_ID) : "",
      DESIGNATION_ID: item.DESIGNATION_ID != null ? String(item.DESIGNATION_ID) : "",
      DRIVING_LICENSE_EXPIRY_DATE: item.DRIVING_LICENSE_EXPIRY_DATE
        ? String(item.DRIVING_LICENSE_EXPIRY_DATE).split("T")[0]
        : "",
    });
  };

  const openEdit = async (item: DriverMasterGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    fillForm(item);
    try {
      const res: any = await dispatch(
        fetchDriverById(Number(item.SNO) || Number(item.id))
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
    if (!form.DRIVER_EMP_ID || form.DRIVER_EMP_ID === "") {
      toast({ variant: "destructive", title: "Driver Employee ID is required" });
      return;
    }
    if (!form.DRIVER_FULL_NAME || !String(form.DRIVER_FULL_NAME).trim()) {
      toast({ variant: "destructive", title: "Driver Full Name is required" });
      return;
    }
    if (!form.COMPANY_ID || form.COMPANY_ID === "") {
      toast({ variant: "destructive", title: "Company is required" });
      return;
    }
    if (!form.DEPARTMENT_ID || form.DEPARTMENT_ID === "") {
      toast({ variant: "destructive", title: "Department is required" });
      return;
    }
    if (!form.DESIGNATION_ID || form.DESIGNATION_ID === "") {
      toast({ variant: "destructive", title: "Designation is required" });
      return;
    }
    if (form.PHONE_NUMBER && !validateTanzaniaPhone(String(form.PHONE_NUMBER))) {
      toast({ variant: "destructive", title: "Phone Number must be in Tanzania format (e.g., +255XXXXXXXXX)" });
      return;
    }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        PHONE_NUMBER: cleanPhoneForStorage(form.PHONE_NUMBER),
        DRIVER_FULL_NAME: form.DRIVER_FULL_NAME?.trim(),
        DRIVING_LICENSE_NUMBER: form.DRIVING_LICENSE_NUMBER?.trim(),
        VEHICLE_CATEGORIES_LICENSED: form.VEHICLE_CATEGORIES_LICENSED?.trim(),
        REMARKS: form.REMARKS?.trim(),
      };
      if (editing) {
        const res: any = await dispatch(
          updateDriver({ ...cleanForm, SNO: Number(editing.SNO) || Number(editing.id) })
        ).unwrap();
        toast({ title: res?.message ?? "Driver updated successfully!" });
      } else {
        const res: any = await dispatch(addDriver({ ...cleanForm })).unwrap();
        if (!res?.SNO) {
          throw new Error(res?.message || "Failed to retrieve new Driver SNO");
        }
        toast({ title: res?.message ?? "Driver created successfully!" });
      }
      await dispatch(fetchDrivers());
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save driver") });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteDriver(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Driver deleted successfully!" });
      dispatch(fetchDrivers());
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete driver") });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteDriver(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Drivers deleted successfully!" });
      dispatch(fetchDrivers());
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
        const emp = employeeRows?.find((e: any) => String(e.EMP_ID) === String(value));
        if (emp) {
          next.DRIVER_FULL_NAME = [emp.FIRST_NAME, emp.MIDDLE_NAME, emp.LAST_NAME].filter(Boolean).join(" ") || "";
          const company = companies?.find((c: any) => c.COMPANY_NAME === emp.COMPANY_NAME);
          const department = departments?.find((d: any) => d.DEPARTMENT_NAME === emp.DEPARTMENT_NAME);
          const designation = designations?.find((dg: any) => dg.DESIGNATION_NAME === emp.DESIGNATION_NAME);
          next.COMPANY_ID = company?.COMPANY_ID != null ? String(company.COMPANY_ID) : "";
          next.DEPARTMENT_ID = department?.DEPARTMENT_ID != null ? String(department.DEPARTMENT_ID) : "";
          next.DESIGNATION_ID = designation?.DESIGNATION_ID != null ? String(designation.DESIGNATION_ID) : "";
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
    type: "text" | "number" | "date" | "textarea" | "select" | "employee",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    formatter?: (val: any) => any,
    disabled?: boolean,
  ) => {
    const value = form[key] ?? "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        {type === "employee" ? (
          <EmployeeDropdown
            label={label}
            required={required}
            value={String(value)}
            onChange={(v) => setField(key, v)}
            placeholder={placeholder}
          />
        ) : (
          <>
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
            onChange={(e) => {
              let val: any = e.target.value;
              if (formatter) val = formatter(val);
              else if (type === "number") val = e.target.value === "" ? "" : Number(e.target.value);
              setField(key, val);
            }}
          />
        )}
          </>
        )}
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-foreground">Driver Master</h1>
          <p className="text-sm text-muted-foreground">Manage driver master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Driver
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
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
                  <SelectValue placeholder="All Status" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">EMP ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Full Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Department</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Designation</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Phone</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">License No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">License Expiry</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Vehicle Categories</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
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
                            setViewerDriverEmpId(item.DRIVER_EMP_ID);
                            setViewerDriverName(item.DRIVER_FULL_NAME || "");
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="View attached files for this Driver"
                        >
                          Files ({Number(fileCounts[String(item.DRIVER_EMP_ID ?? "")] ?? 0)})
                        </button>
                        <button
                          onClick={() => onViewFiles && onViewFiles(String(item.DRIVER_EMP_ID || ""))}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="View / Upload Documents for this Driver"
                        >
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{item.DRIVER_EMP_ID}</td>
                    <td className="p-3">{item.DRIVER_FULL_NAME || "—"}</td>
                    <td className="p-3">{item.COMPANY_NAME || "—"}</td>
                    <td className="p-3">{item.DEPARTMENT_NAME || "—"}</td>
                    <td className="p-3">{item.DESIGNATION_NAME || "—"}</td>
                    <td className="p-3">{item.PHONE_NUMBER || "—"}</td>
                    <td className="p-3">{item.DRIVING_LICENSE_NUMBER || "—"}</td>
                    <td className="p-3">{formatDate(item.DRIVING_LICENSE_EXPIRY_DATE) || "—"}</td>
                    <td className="p-3">{item.VEHICLE_CATEGORIES_LICENSED || "—"}</td>
                    <td className="p-3">{item.REMARKS || "—"}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-muted-foreground">
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {renderField("DRIVER_EMP_ID", "Driver Employee ID", "employee", undefined, true, "Select Employee ID")}
              {renderField("DRIVER_FULL_NAME", "Full Name", "text", undefined, true, "e.g., John Doe")}
              {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
              {renderField("DEPARTMENT_ID", "Department", "select", departmentOptionsByCompany(form), true, "Select department", undefined, !form.COMPANY_ID)}
              {renderField("DESIGNATION_ID", "Designation", "select", designationOptionsByCompanyDept(form), true, "Select designation", undefined, !form.DEPARTMENT_ID)}
              {renderField("PHONE_NUMBER", "Phone Number", "text", undefined, false, "e.g., +255 700 000 000", formatTanzaniaPhone)}
              {renderField("DRIVING_LICENSE_NUMBER", "Driving License Number", "text", undefined, false, "e.g., TN01 20260012345")}
              {renderField("DRIVING_LICENSE_EXPIRY_DATE", "License Expiry Date", "date", undefined, false)}
              {renderField("VEHICLE_CATEGORIES_LICENSED", "Vehicle Categories Licensed", "text", undefined, false, "e.g., LMV, MCWG")}
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
              This action cannot be undone. This will permanently delete this driver.
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
        open={viewerDriverEmpId != null}
        entityId={viewerDriverEmpId ?? ""}
        entityLabel={viewerDriverName}
        onOpenChange={(open) => {
          if (!open) setViewerDriverEmpId(null);
        }}
        listUrl={`${API_URL}/dms?linkPagesId=${encodeURIComponent(String(linkPagesId ?? 0))}&pageRefNo=${encodeURIComponent(String(viewerDriverEmpId ?? ""))}&status=ALL`}
        contentUrlBuilder={(row) => `${API_URL}/dms/${Number(row?.DMS_ID) || ""}`}
        emptyMessage="No files attached to this driver"
      />
    </div>
  );
}
