"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchAmmunitionBrands, addAmmunitionBrand, updateAmmunitionBrand, deleteAmmunitionBrand, clearAmmunitionBrandError } from "@/lib/ammunitionBrandMasterSlice";
import type { AmmunitionBrandGridData } from "@/lib/ammunitionBrandMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { validateEmail, validateWebsite, validateTanzaniaPhone, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function AmmunitionBrandMasterPage() {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((s) => s.ammunitionBrand);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: countries } = useApiQuery("ab-country", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const countryOptions = useMemo(() =>
    (Array.isArray(countries) ? countries : []).map((c: any) => ({ value: String(c.Country_Id), label: c.Country_Name })),
    [countries]
  );

  const role = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try { return JSON.parse(userJson).role || 'Manager'; } catch { }
      }
    }
    return 'Manager';
  }, []);
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const filtered = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((d: any) => {
      if (![d.BRAND_NAME, d.COUNTRY_NAME, d.CONTACT_PERSON, d.CONTACT_NUMBER, d.EMAIL, d.WEBSITE, d.REMARKS].join(" ").toLowerCase().includes(search.toLowerCase())) return false;
      if (normalizeStatus(d.STATUS_MASTER) !== normalizeStatus(statusFilter)) return false;
      return true;
    }).sort((a: any, b: any) => Number(b.AMMUNITION_BRAND_ID) - Number(a.AMMUNITION_BRAND_ID));
  }, [records, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchAmmunitionBrands(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearAmmunitionBrandError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    BRAND_NAME: "",
    COUNTRY_OF_ORIGIN: "",
    CONTACT_PERSON: "",
    CONTACT_NUMBER: "",
    EMAIL: "",
    WEBSITE: "",
    REMARKS: "",
    STATUS_MASTER: "ACTIVE",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      BRAND_NAME: item.BRAND_NAME || "",
      COUNTRY_OF_ORIGIN: String(item.COUNTRY_OF_ORIGIN || ""),
      CONTACT_PERSON: item.CONTACT_PERSON || "",
      CONTACT_NUMBER: formatTanzaniaPhone(item.CONTACT_NUMBER),
      EMAIL: item.EMAIL || "",
      WEBSITE: item.WEBSITE || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER === "ACTIVE" || item.STATUS_MASTER === "AC" ? "ACTIVE" : "INACTIVE",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.BRAND_NAME?.trim()) {
      toast({ title: "Brand name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.BRAND_NAME.trim().length > 100) {
      toast({ title: "Brand name must be 100 characters or less", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.EMAIL && !validateEmail(String(form.EMAIL))) {
      toast({ title: "Invalid Email format", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.WEBSITE && !validateWebsite(String(form.WEBSITE))) {
      toast({ title: "Website must start with http:// or https://", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.CONTACT_NUMBER && !validateTanzaniaPhone(String(form.CONTACT_NUMBER))) {
      toast({ title: "Contact Number must be in Tanzania format (e.g., +255XXXXXXXXX)", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New brand cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        BRAND_NAME: form.BRAND_NAME.trim(),
        COUNTRY_OF_ORIGIN: form.COUNTRY_OF_ORIGIN ? Number(form.COUNTRY_OF_ORIGIN) : null,
        CONTACT_PERSON: form.CONTACT_PERSON?.trim() || null,
        CONTACT_NUMBER: cleanPhoneForStorage(form.CONTACT_NUMBER?.trim()) || null,
        EMAIL: form.EMAIL?.trim() || null,
        WEBSITE: form.WEBSITE?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: editing ? (form.STATUS_MASTER === "ACTIVE" ? "AC" : "IN") : "AC",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.AMMUNITION_BRAND_ID = Number(editing.id);
        const res = await dispatch(updateAmmunitionBrand(payload as AmmunitionBrandGridData)).unwrap();
        toast({ title: res?.message ?? "Brand updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addAmmunitionBrand(payload as AmmunitionBrandGridData)).unwrap();
        toast({ title: res?.message ?? "Brand created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchAmmunitionBrands(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving brand"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteAmmunitionBrand(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Brand deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchAmmunitionBrands(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting brand"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea" | "date", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, maxLength?: number, formatter?: (val: any) => any) => {
    const baseClass = "flex flex-col gap-1.5";
    const reqInvalid = required && !(String(form[key] ?? "").trim());
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
            <SelectTrigger className={`h-9 text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: formatter ? formatter(e.target.value) : e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            maxLength={maxLength}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ammunition Brand Master</h1>
          <p className="text-sm text-muted-foreground">Manage ammunition brand master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Brand
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search brands..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IN">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={(v) => { setPageSize(v === "ALL" ? "ALL" : Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availablePageSizes.map((s) => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <Skeleton className="h-4 w-4" />
                  {[...Array(9)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Brand</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Country</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Contact</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Phone</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Email</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Website</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.AMMUNITION_BRAND_ID}</td>
                    <td className="p-3">{item.BRAND_NAME}</td>
                    <td className="p-3">{item.COUNTRY_NAME || "-"}</td>
                    <td className="p-3">{item.CONTACT_PERSON || "-"}</td>
                    <td className="p-3">{item.CONTACT_NUMBER || "-"}</td>
                    <td className="p-3">{item.EMAIL || "-"}</td>
                    <td className="p-3">{item.WEBSITE || "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${String(item.STATUS_MASTER).toLowerCase().trim() === "active" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {(String(item.STATUS_MASTER).toLowerCase().trim() === "active") ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No records found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {filtered.length === 0 ? 0 : ((currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize)) + 1} to {Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)} of {filtered.length} entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>;
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Brand Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("BRAND_NAME", "Brand Name", "text", undefined, true, "e.g., Winchester", 100)}
                {renderField("COUNTRY_OF_ORIGIN", "Country of Origin", "select", countryOptions, false, "Select country")}
                {renderField("CONTACT_PERSON", "Contact Person", "text", undefined, false, "e.g., John Doe", 100)}
                {renderField("CONTACT_NUMBER", "Contact Number", "text", undefined, false, "e.g., +255 700 000 000", 30, formatTanzaniaPhone)}
                {renderField("EMAIL", "Email", "text", undefined, false, "e.g., info@brand.com", 100)}
                {renderField("WEBSITE", "Website", "text", undefined, false, "e.g., https://brand.com", 200)}
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Notes</h3>
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
              <Button onClick={handleSave} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this brand.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
