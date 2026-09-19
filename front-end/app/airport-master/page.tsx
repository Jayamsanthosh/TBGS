"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchItems, addItem, updateItem, deleteItem, clearError, type AirportGridData } from "@/lib/airportMasterSlice";
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

interface DropdownItem {
  value: string;
  label: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const renderField = (
  key: string,
  label: string,
  type: "text" | "select" | "textarea",
  form: Record<string, any>,
  setForm: (f: Record<string, any>) => void,
  options?: DropdownItem[],
  required?: boolean,
  placeholder?: string,
  disabled?: boolean,
) => {
  const reqInvalid = required && !(String(form[key] ?? "").trim());
  return (
  <div key={key} className={type === "textarea" ? "col-span-full flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
    <Label className="text-xs">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {type === "select" ? (
      <Select value={form[key] || ""} disabled={disabled} onValueChange={(v) => {
        let next: Record<string, any> = { ...form, [key]: v };
        if (key === "COUNTRY_ID") next = { ...next, REGION_ID: "", DISTRICT_ID: "" };
        if (key === "REGION_ID") next = { ...next, DISTRICT_ID: "" };
        setForm(next);
      }}>
        <SelectTrigger className={`h-9 text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}>
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {(options || []).map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : type === "textarea" ? (
      <Textarea
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className={`text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}
      />
    ) : (
      <Input
        type="text"
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className={`h-9 text-xs ${reqInvalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}
      />
    )}
  </div>
);
};

export default function AirportMasterPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.airportMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [regions, setRegions] = useState<DropdownItem[]>([]);
  const [districts, setDistricts] = useState<DropdownItem[]>([]);
  const [rawRegions, setRawRegions] = useState<Record<string, any>[]>([]);
  const [rawDistricts, setRawDistricts] = useState<Record<string, any>[]>([]);

  const fetchRaw = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch { return []; }
  }, []);

  useEffect(() => {
    fetchRaw(`${API_URL}/country-master`).then((data) =>
      setCountries(
        data.map((x: any) => ({
          value: String(x.Country_Id ?? x.COUNTRY_ID ?? x.id),
          label: x.Country_Name ?? x.COUNTRY_NAME ?? `Country ${x.Country_Id ?? x.COUNTRY_ID}`,
        }))
      )
    );
    fetchRaw(`${API_URL}/region-master`).then((data) => {
      setRawRegions(data);
      setRegions(
        data.map((x: any) => ({
          value: String(x.REGION_ID ?? x.id),
          label: x.REGION_NAME ?? x.NAME ?? `Region ${x.REGION_ID ?? x.id}`,
        }))
      );
    });
    fetchRaw(`${API_URL}/district-master`).then((data) => {
      setRawDistricts(data);
      setDistricts(
        data.map((x: any) => ({
          value: String(x.District_id ?? x.DISTRICT_ID ?? x.id),
          label: x.District_Name ?? x.DISTRICT_NAME ?? `District ${x.District_id ?? x.DISTRICT_ID ?? x.id}`,
        }))
      );
    });
  }, [fetchRaw]);

  const availableRegions = useMemo(() => {
    if (!form.COUNTRY_ID) return [];
    return regions.filter((r) => String(rawRegions.find((x) => String(x.REGION_ID ?? x.id) === r.value)?.COUNTRY_ID ?? "") === String(form.COUNTRY_ID));
  }, [rawRegions, regions, form.COUNTRY_ID]);

  const availableDistricts = useMemo(() => {
    if (!form.REGION_ID) return [];
    return districts.filter((d) => {
      const raw = rawDistricts.find((x) => String(x.District_id ?? x.DISTRICT_ID ?? x.id) === d.value);
      const parent = raw?.REGION_ID ?? raw?.Region_Id;
      return parent != null && String(parent) === String(form.REGION_ID);
    });
  }, [rawDistricts, districts, form.REGION_ID]);

  const getCountryName = useCallback((id: any) => countries.find(c => c.value === String(id))?.label || id, [countries]);
  const getRegionName = useCallback((id: any) => regions.find(r => r.value === String(id))?.label || id, [regions]);
  const getDistrictName = useCallback((id: any) => districts.find(d => d.value === String(id))?.label || id, [districts]);

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

  useEffect(() => {
    dispatch(fetchItems(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.AIRPORT_NAME, d.LOCATION_NAME, d.AIRPORT_ADDRESS, d.REMARKS,
        getCountryName(d.COUNTRY_ID), getRegionName(d.REGION_ID), getDistrictName(d.DISTRICT_ID),
      ].join(" ").toLowerCase();
      if (!searchable.includes(search.toLowerCase())) return false;
      if (normalizeStatus(d.STATUS_MASTER) !== normalizeStatus(statusFilter)) return false;
      return true;
    }).sort((a: any, b: any) => Number(b.AIRPORT_ID) - Number(a.AIRPORT_ID));
  }, [items, search, statusFilter, getCountryName, getRegionName, getDistrictName]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    AIRPORT_NAME: "",
    COUNTRY_ID: "",
    REGION_ID: "",
    DISTRICT_ID: "",
    LOCATION_NAME: "",
    AIRPORT_ADDRESS: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setForm({
      AIRPORT_NAME: item.AIRPORT_NAME || "",
      COUNTRY_ID: String(item.COUNTRY_ID ?? ""),
      REGION_ID: String(item.REGION_ID ?? ""),
      DISTRICT_ID: String(item.DISTRICT_ID ?? ""),
      LOCATION_NAME: item.LOCATION_NAME || "",
      AIRPORT_ADDRESS: item.AIRPORT_ADDRESS || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER === "ACTIVE" ? "AC" : item.STATUS_MASTER === "INACTIVE" ? "IA" : (item.STATUS_MASTER || "AC"),
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setEditing(item);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.AIRPORT_NAME?.trim()) {
      toast({ title: "Airport name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COUNTRY_ID) {
      toast({ title: "Country is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New airport cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const payload: Record<string, any> = {
      AIRPORT_NAME: form.AIRPORT_NAME.trim(),
      COUNTRY_ID: Number(form.COUNTRY_ID),
      REGION_ID: form.REGION_ID ? Number(form.REGION_ID) : null,
      DISTRICT_ID: form.DISTRICT_ID ? Number(form.DISTRICT_ID) : null,
      LOCATION_NAME: form.LOCATION_NAME?.trim() || null,
      AIRPORT_ADDRESS: form.AIRPORT_ADDRESS?.trim() || null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: editing ? form.STATUS_MASTER : "AC",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };

    try {
      if (editing) {
        payload.AIRPORT_ID = Number(editing.id);
        const res = await dispatch(updateItem(payload as AirportGridData)).unwrap();
        toast({ title: res?.message ?? "Airport updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addItem(payload as AirportGridData)).unwrap();
        toast({ title: res?.message ?? "Airport created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving airport"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteItem(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Airport deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting airport"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Airport Master</h1>
          <p className="text-sm text-muted-foreground">Manage airport master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Airport
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search airports..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IA">Inactive</SelectItem>
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
                  {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Country</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Region</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">District</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Location</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Address</th>
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
                    <td className="p-3 font-medium">{item.AIRPORT_ID}</td>
                    <td className="p-3">{item.AIRPORT_NAME}</td>
                    <td className="p-3">{getCountryName(item.COUNTRY_ID)}</td>
                    <td className="p-3">{getRegionName(item.REGION_ID)}</td>
                    <td className="p-3">{getDistrictName(item.DISTRICT_ID)}</td>
                    <td className="p-3">{item.LOCATION_NAME || "-"}</td>
                    <td className="p-3 max-w-[150px] truncate">{item.AIRPORT_ADDRESS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${item.STATUS_MASTER === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {item.STATUS_MASTER}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Airport" : "Add Airport"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Location Information</h3>
              </div>
              {renderField("COUNTRY_ID", "Country", "select", form, setForm, countries, true)}
              {renderField("REGION_ID", "Region", "select", form, setForm, availableRegions, false, undefined, !form.COUNTRY_ID)}
              {renderField("DISTRICT_ID", "District", "select", form, setForm, availableDistricts, false, undefined, !form.REGION_ID)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Airport Details</h3>
              </div>
              {renderField("AIRPORT_NAME", "Airport Name", "text", form, setForm, undefined, true, "e.g., JFK")}
              {renderField("LOCATION_NAME", "Location", "text", form, setForm, undefined, false, "e.g., Terminal 1")}
              {renderField("AIRPORT_ADDRESS", "Address", "text", form, setForm, undefined, false, "e.g., 123 Airport Rd")}
              {renderField("STATUS_MASTER", "Status", "select", form, setForm, [
                { value: "AC", label: "Active" },
                { value: "IA", label: "Inactive" },
              ])}
              {renderField("REMARKS", "Remarks", "textarea", form, setForm, undefined, false, "Additional notes...")}
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
            <AlertDialogDescription>This will permanently delete this airport record.</AlertDialogDescription>
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
