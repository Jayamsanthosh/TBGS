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
  fetchFuelTypes,
  addFuelType,
  updateFuelType,
  deleteFuelType,
  clearFuelTypeError,
  type FuelTypeGridData
} from "@/lib/fuelTypeMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const ACTIVE_STATUS_SET = ["AC", "ACTIVE", "A", "Y", "YES", "TRUE", "1", "ON", "ENABLED"];
const INACTIVE_STATUS_SET = ["IN", "INACTIVE", "IA", "I", "N", "NO", "FALSE", "0", "OFF", "DISABLED"];

const normalizeStatus = (val: any): string => {
  const raw = Array.isArray(val) ? val[0] ?? "" : val ?? "";
  const tokens = String(raw)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (tokens.some((t) => INACTIVE_STATUS_SET.includes(t))) return "INACTIVE";
  if (tokens.some((t) => ACTIVE_STATUS_SET.includes(t))) return "ACTIVE";
  return String(raw);
};

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const emptyForm = (): Record<string, any> => ({
  FUEL_TYPE_NAME: "",
  FUEL_TYPE_DESCRIPTION: "",
  ERP_PRODUCT_ID: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

export default function FuelTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { fuelTypes, loading, error } = useAppSelector((s) => s.fuelType);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FuelTypeGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const { data: products } = useApiQuery("fuel-type-products", async () => {
    const res = await fetch(`${API_URL}/product-master`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.PRODUCT_ID }));
  });

  const productOptions = useMemo(
    () => (Array.isArray(products) ? products.map((p: any) => ({ value: String(p.PRODUCT_ID), label: p.PRODUCT_NAME })) : []),
    [products]
  );

  useEffect(() => {
    dispatch(fetchFuelTypes(statusFilter || "ALL"));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearFuelTypeError());
    }
  }, [error, dispatch, toast]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(fuelTypes)) return [];
    return fuelTypes.map((t: any) => {
      const product = products?.find((x: any) => Number(x.PRODUCT_ID) === Number(t.ERP_PRODUCT_ID));
      return {
        ...t,
        ERP_PRODUCT_NAME:
          t.ERP_PRODUCT_ID != null && t.ERP_PRODUCT_ID !== ""
            ? product?.PRODUCT_NAME || `ID: ${t.ERP_PRODUCT_ID}`
            : "",
      };
    });
  }, [fuelTypes, products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedData.filter((d: any) =>
      [
        d.FUEL_TYPE_NAME,
        d.FUEL_TYPE_DESCRIPTION,
        d.ERP_PRODUCT_NAME,
        d.REMARKS,
        d.STATUS_MASTER,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    ).sort((a: any, b: any) => Number(b.FUEL_TYPE_ID) - Number(a.FUEL_TYPE_ID));
  }, [enrichedData, search]);

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

  const openEdit = (item: FuelTypeGridData) => {
    setEditing(item);
    setForm({
      ...emptyForm(),
      ...item,
      ERP_PRODUCT_ID: item.ERP_PRODUCT_ID != null ? String(item.ERP_PRODUCT_ID) : "",
      STATUS_MASTER: normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "AC" : "IN",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.FUEL_TYPE_NAME || !String(form.FUEL_TYPE_NAME).trim()) {
      toast({ variant: "destructive", title: "Fuel Type Name is required", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) !== "ACTIVE") {
      toast({ title: "New fuel type cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setSaving(true);
    try {
      let res: any;
      if (editing) {
        res = await dispatch(
          updateFuelType({ ...form, FUEL_TYPE_ID: Number(editing.FUEL_TYPE_ID) || Number(editing.id) })
        ).unwrap();
      } else {
        res = await dispatch(addFuelType({ ...form })).unwrap();
        if (!res?.FUEL_TYPE_ID) {
          throw new Error(res?.message || "Failed to retrieve new Fuel Type ID");
        }
      }
      await dispatch(fetchFuelTypes(statusFilter || "ALL"));
      setDialogOpen(false);
      toast({ title: res?.message ?? (editing ? "Fuel type updated successfully!" : "Fuel type created successfully!"), duration: DEFAULT_TOAST_DURATION });
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save fuel type"), duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res = await dispatch(deleteFuelType(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Fuel type deleted successfully!", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchFuelTypes(statusFilter || "ALL"));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete fuel type"), duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteFuelType(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Fuel types deleted successfully!", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchFuelTypes(statusFilter || "ALL"));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete items!"), duration: DEFAULT_TOAST_DURATION });
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
    placeholder?: string
  ) => {
    const value = form[key] ?? "";
    const reqClass = required && !String(value).trim() ? " border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => setField(key, v)}>
            <SelectTrigger className={`w-full${reqClass}`}>
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
          <Textarea value={String(value)} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} className={reqClass} />
        ) : (
          <Input
            type={type}
            value={String(value)}
            placeholder={placeholder}
            className={reqClass}
            onChange={(e) => {
              let val: any = e.target.value;
              if (type === "number") val = e.target.value === "" ? "" : Number(e.target.value);
              setField(key, val);
            }}
          />
        )}
      </div>
    );
  };

  const statusBadge = (val: any) => {
    const ns = normalizeStatus(val);
    const colorClass = ns === "ACTIVE"
      ? "bg-green-500/10 text-green-600 border-green-200"
      : "bg-red-500/10 text-red-600 border-red-200";
    return (
      <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
        {ns === "ACTIVE" ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fuel Type Master</h1>
          <p className="text-sm text-muted-foreground">Manage fuel type master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Fuel Type
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search fuel types..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IN">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Fuel Type Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ERP Product</th>
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
                    <td className="p-3 font-medium">{item.FUEL_TYPE_ID}</td>
                    <td className="p-3 font-medium">{item.FUEL_TYPE_NAME}</td>
                    <td className="p-3">{item.FUEL_TYPE_DESCRIPTION || "—"}</td>
                    <td className="p-3">{item.ERP_PRODUCT_NAME || "—"}</td>
                    <td className="p-3">{item.REMARKS || "—"}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fuel Type" : "Add Fuel Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {renderField("FUEL_TYPE_NAME", "Fuel Type Name", "text", undefined, true, "e.g., Diesel")}
              {renderField("FUEL_TYPE_DESCRIPTION", "Description", "text", undefined, false, "e.g., High-speed diesel")}
              {renderField("ERP_PRODUCT_ID", "ERP Product", "select", productOptions, false, "Select product")}
              {renderField("STATUS_MASTER", "Status", "select", STATUS_OPTIONS, false, "Select status")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className={editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}>
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
              This action cannot be undone. This will permanently delete this fuel type.
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
