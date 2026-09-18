"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
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
  fetchTrailers,
  addTrailer,
  updateTrailer,
  deleteTrailer,
  clearTrailerError,
  type TrailerGridData
} from "@/lib/trailerMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { TIN_LENGTH, tinLengthMessage } from "@/lib/validation";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const emptyForm = (): Record<string, any> => ({
  TRAILER_NO: "",
  TRAILER_TYPE_ID: "",
  TRAILER_CHASSIS_NO: "",
  TRAILER_DESCRIPTION: "",
  VEHICLE_CONTROL_NO: "",
  TRAILER_OWNED_COMPANY_ID: "",
  TITLE_HOLDER: "",
  TITLE_HOLDER_TIN_NO: "",
  TITLE_HOLDER_ADDRESS: "",
  MAKE: "",
  MODEL: "",
  MODEL_NO: "",
  BODY_TYPE: "",
  CLASS: "",
  MANUFACTURE_YEAR: "",
  TARE_WEIGHT: "",
  GROSS_WEIGHT: "",
  IMPORTED_COUNTRY_ID: "",
  IMPORTED_SUPPLIER_ID: "",
  PURCHASE_DATE: "",
  LATEST_INSURANCE_NO: "",
  INSURANCE_AMOUNT: "",
  GOODS_CAPACITY: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

export default function TrailersTab({ onViewFiles }: { onViewFiles?: (trailerNo: string) => void }) {
  const dispatch = useAppDispatch();
  const { trailers, loading, error } = useAppSelector((s) => s.trailer);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrailerGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const { data: trailerTypes } = useApiQuery("trailer-master-trailer-types", async () => {
    const res = await fetch(`${API_URL}/trailer-type-master`);
    if (!res.ok) throw new Error("Failed to fetch trailer types");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.TRAILER_TYPE_ID }));
  });

  const { data: companies } = useApiQuery("trailer-master-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: countries } = useApiQuery("trailer-master-countries", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const { data: suppliers } = useApiQuery("trailer-master-suppliers", async () => {
    const res = await fetch(`${API_URL}/business-partner-master`);
    if (!res.ok) throw new Error("Failed to fetch suppliers");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.BP_ID }));
  });

  const trailerTypeOptions = useMemo(
    () => (Array.isArray(trailerTypes) ? trailerTypes.map((t: any) => ({ value: String(t.TRAILER_TYPE_ID), label: t.TRAILER_TYPE_NAME })) : []),
    [trailerTypes]
  );

  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies.map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })) : []),
    [companies]
  );

  const countryOptions = useMemo(
    () => (Array.isArray(countries) ? countries.map((c: any) => ({ value: String(c.Country_Id), label: c.Country_Name })) : []),
    [countries]
  );

  const supplierOptions = useMemo(
    () => (Array.isArray(suppliers) ? suppliers.map((s: any) => ({ value: String(s.BP_ID), label: s.BP_NAME })) : []),
    [suppliers]
  );

  const enrichedData = useMemo(() => {
    if (!Array.isArray(trailers)) return [];
    return trailers.map((t: any) => {
      const type = trailerTypes?.find((x: any) => Number(x.TRAILER_TYPE_ID) === Number(t.TRAILER_TYPE_ID));
      const company = companies?.find((x: any) => Number(x.COMPANY_ID) === Number(t.TRAILER_OWNED_COMPANY_ID));
      const country = countries?.find((x: any) => Number(x.Country_Id) === Number(t.IMPORTED_COUNTRY_ID));
      const supplier = suppliers?.find((x: any) => Number(x.BP_ID) === Number(t.IMPORTED_SUPPLIER_ID));
      return {
        ...t,
        TRAILER_TYPE_NAME: type?.TRAILER_TYPE_NAME || `ID: ${t.TRAILER_TYPE_ID}`,
        OWNED_COMPANY_NAME: company?.COMPANY_NAME || `ID: ${t.TRAILER_OWNED_COMPANY_ID}`,
        IMPORTED_COUNTRY_NAME: country?.Country_Name || `ID: ${t.IMPORTED_COUNTRY_ID}`,
        IMPORTED_SUPPLIER_NAME: supplier?.BP_NAME || `ID: ${t.IMPORTED_SUPPLIER_ID}`,
      };
    });
  }, [trailers, trailerTypes, companies, countries, suppliers]);

  useEffect(() => {
    dispatch(fetchTrailers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearTrailerError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedData.filter((d: any) =>
      String(d.STATUS_MASTER) === statusFilter &&
      [
        d.TRAILER_NO,
        d.TRAILER_CHASSIS_NO,
        d.TRAILER_TYPE_NAME,
        d.MAKE,
        d.MODEL,
        d.MODEL_NO,
        d.OWNED_COMPANY_NAME,
        d.VEHICLE_CONTROL_NO,
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

  const openEdit = async (item: TrailerGridData) => {
    setEditing(item);
    setForm({
      ...emptyForm(),
      ...item,
      TRAILER_TYPE_ID: item.TRAILER_TYPE_ID != null ? String(item.TRAILER_TYPE_ID) : "",
      TRAILER_OWNED_COMPANY_ID: item.TRAILER_OWNED_COMPANY_ID != null ? String(item.TRAILER_OWNED_COMPANY_ID) : "",
      IMPORTED_COUNTRY_ID: item.IMPORTED_COUNTRY_ID != null ? String(item.IMPORTED_COUNTRY_ID) : "",
      IMPORTED_SUPPLIER_ID: item.IMPORTED_SUPPLIER_ID != null ? String(item.IMPORTED_SUPPLIER_ID) : "",
      PURCHASE_DATE: item.PURCHASE_DATE ? String(item.PURCHASE_DATE).split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.TRAILER_TYPE_ID || String(form.TRAILER_TYPE_ID).trim() === "") {
      toast({ variant: "destructive", title: "Trailer Type is required" });
      return;
    }
    if (!form.TRAILER_NO || !String(form.TRAILER_NO).trim()) {
      toast({ variant: "destructive", title: "Trailer No is required" });
      return;
    }
    if (form.TITLE_HOLDER_TIN_NO) {
      const tinErr = tinLengthMessage(String(form.TITLE_HOLDER_TIN_NO));
      if (tinErr) {
        toast({ variant: "destructive", title: tinErr });
        return;
      }
    }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        TRAILER_NO: form.TRAILER_NO?.trim(),
        MAKE: form.MAKE?.trim(),
        MODEL: form.MODEL?.trim(),
        MODEL_NO: form.MODEL_NO?.trim(),
        TITLE_HOLDER: form.TITLE_HOLDER?.trim(),
        REMARKS: form.REMARKS?.trim(),
        MANUFACTURE_YEAR: form.MANUFACTURE_YEAR === "" ? undefined : Math.max(0, Number(form.MANUFACTURE_YEAR) || 0),
        TARE_WEIGHT: form.TARE_WEIGHT === "" ? undefined : Math.max(0, Number(form.TARE_WEIGHT) || 0),
        GROSS_WEIGHT: form.GROSS_WEIGHT === "" ? undefined : Math.max(0, Number(form.GROSS_WEIGHT) || 0),
        INSURANCE_AMOUNT: form.INSURANCE_AMOUNT === "" ? undefined : Math.max(0, Number(form.INSURANCE_AMOUNT) || 0),
      };
      if (editing) {
        const res: any = await dispatch(
          updateTrailer({ ...cleanForm, TRAILER_ID: Number(editing.TRAILER_ID) || Number(editing.id) })
        ).unwrap();
        toast({ title: res?.message ?? "Trailer updated successfully!" });
      } else {
        const res: any = await dispatch(addTrailer({ ...cleanForm })).unwrap();
        if (!Number(res?.TRAILER_ID)) {
          throw new Error(res?.message || "Failed to retrieve new Trailer ID");
        }
        toast({ title: res?.message ?? "Trailer created successfully!" });
      }
      await dispatch(fetchTrailers());
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save trailer") });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteTrailer(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Trailer deleted successfully!" });
      dispatch(fetchTrailers());
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete trailer") });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteTrailer(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Trailers deleted successfully!" });
      dispatch(fetchTrailers());
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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "date" | "textarea" | "select",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    validationMessage?: string | null,
    hint?: string | null
  ) => {
    const value = form[key] ?? "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => setField(key, v)}>
            <SelectTrigger className="w-full">
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
            onChange={(e) => {
              let val: any = e.target.value;
              if (type === "number") val = e.target.value === "" ? "" : Number(e.target.value);
              setField(key, val);
            }}
          />
        )}
        {validationMessage ? (
          <p className="text-xs text-destructive mt-1">{validationMessage}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        ) : null}
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
          <h1 className="text-2xl font-bold text-foreground">Trailer Master</h1>
          <p className="text-sm text-muted-foreground">Manage trailer master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Trailer
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trailers..."
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Trailer No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Make</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Model</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Chassis No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Owned Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Tare Wt (kg)</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Gross Wt (kg)</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Purchase Date</th>
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
                      <button
                        onClick={() => onViewFiles && onViewFiles(String(item.TRAILER_NO || ""))}
                        className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="View / Upload Files for this Trailer"
                      >
                        Docs
                      </button>
                    </td>
                    <td className="p-3 font-medium">{item.TRAILER_NO}</td>
                    <td className="p-3">{item.TRAILER_TYPE_NAME}</td>
                    <td className="p-3">{item.MAKE || "—"}</td>
                    <td className="p-3">{item.MODEL || "—"}</td>
                    <td className="p-3">{item.TRAILER_CHASSIS_NO || "—"}</td>
                    <td className="p-3">{item.OWNED_COMPANY_NAME}</td>
                    <td className="p-3 text-right">{item.TARE_WEIGHT ?? "—"}</td>
                    <td className="p-3 text-right">{item.GROSS_WEIGHT ?? "—"}</td>
                    <td className="p-3">{formatDate(item.PURCHASE_DATE)}</td>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Trailer" : "Add Trailer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {renderField("TRAILER_NO", "Trailer No", "text", undefined, true, "e.g., TRA-001")}
              {renderField("TRAILER_TYPE_ID", "Trailer Type", "select", trailerTypeOptions, true, "Select type")}
              {renderField("TRAILER_CHASSIS_NO", "Chassis No", "text", undefined, false, "e.g., CH-123456")}
              {renderField("TRAILER_DESCRIPTION", "Description", "text", undefined, false, "e.g., Flatbed trailer")}
              {renderField("VEHICLE_CONTROL_NO", "Vehicle Control No", "text", undefined, false, "e.g., VC-001")}
              {renderField("TRAILER_OWNED_COMPANY_ID", "Owned Company", "select", companyOptions, false, "Select company")}
              {renderField("TITLE_HOLDER", "Title Holder", "text", undefined, false, "e.g., TBGS Ltd")}
              {renderField("TITLE_HOLDER_TIN_NO", "Title Holder TIN No", "text", undefined, false, "e.g., 123456789", tinLengthMessage(String(form.TITLE_HOLDER_TIN_NO || "")), `Must be ${TIN_LENGTH} digits (0-9 only)`)}
              {renderField("TITLE_HOLDER_ADDRESS", "Title Holder Address", "text", undefined, false, "e.g., Dar es Salaam")}
              {renderField("MAKE", "Make", "text", undefined, false, "e.g., TATA")}
              {renderField("MODEL", "Model", "text", undefined, false, "e.g., LPT 3118")}
              {renderField("MODEL_NO", "Model No", "text", undefined, false, "e.g., 3118")}
              {renderField("BODY_TYPE", "Body Type", "text", undefined, false, "e.g., Flatbed")}
              {renderField("CLASS", "Class", "text", undefined, false, "e.g., N3")}
              {renderField("MANUFACTURE_YEAR", "Manufacture Year", "number", undefined, false, "e.g., 2020")}
              {renderField("TARE_WEIGHT", "Tare Weight (kg)", "number", undefined, false, "e.g., 8500")}
              {renderField("GROSS_WEIGHT", "Gross Weight (kg)", "number", undefined, false, "e.g., 40000")}
              {renderField("IMPORTED_COUNTRY_ID", "Imported Country", "select", countryOptions, false, "Select country")}
              {renderField("IMPORTED_SUPPLIER_ID", "Imported Supplier", "select", supplierOptions, false, "Select supplier")}
              {renderField("PURCHASE_DATE", "Purchase Date", "date", undefined, false)}
              {renderField("LATEST_INSURANCE_NO", "Latest Insurance No", "text", undefined, false, "e.g., INS-2024-001")}
              {renderField("INSURANCE_AMOUNT", "Insurance Amount", "number", undefined, false, "e.g., 1500000")}
              {renderField("GOODS_CAPACITY", "Goods Capacity", "text", undefined, false, "e.g., 30 tons")}
              {renderField("STATUS_MASTER", "Status", "select", STATUS_OPTIONS, false, "Select status")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
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
              This action cannot be undone. This will permanently delete this trailer.
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
    </div>
  );
}