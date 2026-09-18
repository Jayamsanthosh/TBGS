"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchHotelResortMasters, addHotelResortMaster, updateHotelResortMaster, deleteHotelResortMaster, fetchHotelResortMasterById, clearHotelResortMasterError } from "@/lib/hotelResortMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const HOTEL_TYPE_OPTIONS = [
  { value: "Motels", label: "Motels" },
  { value: "Resort hotels", label: "Resort hotels" },
  { value: "Airport hotels", label: "Airport hotels" },
];

export default function HotelResortMasterPage() {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((s) => s.hotelResortMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  const { data: countries } = useApiQuery("hr-country", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const { data: regions } = useApiQuery("hr-region", async () => {
    const res = await fetch(`${API_URL}/region-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.REGION_ID }));
  });

  const { data: districts } = useApiQuery("hr-district", async () => {
    const res = await fetch(`${API_URL}/district-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.District_id }));
  });

  const countryOptions = useMemo(() =>
    (Array.isArray(countries) ? countries : []).map((c: any) => ({ value: String(c.Country_Id), label: c.Country_Name })),
    [countries]
  );

  const regionOptions = useMemo(() => {
    if (!Array.isArray(regions)) return [];
    const selectedCountry = form.COUNTRY_ID;
    let filtered = regions;
    if (selectedCountry) {
      const sc = Number(selectedCountry);
      filtered = regions.filter((r: any) => {
        const rc = Number(r.COUNTRY_ID ?? r.Country_Id ?? r.Country_ID);
        return rc === sc;
      });
    }
    return filtered
      .map((r: any) => ({ value: String(r.REGION_ID ?? r.Region_Id), label: r.REGION_NAME ?? r.Region_Name }))
      .filter((o) => o.label);
  }, [regions, form.COUNTRY_ID]);

  const districtOptions = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    const selectedRegion = form.REGION_ID;
    let filtered = districts;
    if (selectedRegion) {
      const sr = Number(selectedRegion);
      filtered = districts.filter((d: any) => {
        const dr = Number(d.Region_Id ?? d.REGION_ID ?? d.Region_ID);
        return dr === sr;
      });
    }
    return filtered
      .map((d: any) => ({ value: String(d.District_id ?? d.DISTRICT_ID), label: d.District_Name ?? d.DISTRICT_NAME }))
      .filter((o) => o.label);
  }, [districts, form.REGION_ID]);

  const filtered = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((d: any) => {
      const searchable = [d.HOTEL_NAME, d.HOTEL_TYPE, d.HOTEL_STAR, d.Country_Name, d.REGION_NAME, d.District_Name, d.LOCATION_NAME, d.HOTEL_ADDRESS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.HOTEL_ID || 0) - Number(a.HOTEL_ID || 0));
  }, [records, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchHotelResortMasters(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearHotelResortMasterError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    HOTEL_TYPE: "",
    HOTEL_NAME: "",
    HOTEL_STAR: "",
    COUNTRY_ID: "",
    REGION_ID: "",
    DISTRICT_ID: "",
    LOCATION_NAME: "",
    HOTEL_ADDRESS: "",
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

  const openEdit = async (item: any) => {
    setLoadingEdit(true);
    setEditing(item);
    try {
      const response = await dispatch(fetchHotelResortMasterById(Number(item.HOTEL_ID))).unwrap();
      if (response) {
        setForm({
          HOTEL_TYPE: response.HOTEL_TYPE || "",
          HOTEL_NAME: response.HOTEL_NAME || "",
          HOTEL_STAR: response.HOTEL_STAR || "",
          COUNTRY_ID: String(response.COUNTRY_ID || ""),
          REGION_ID: String(response.REGION_ID || ""),
          DISTRICT_ID: String(response.DISTRICT_ID || ""),
          LOCATION_NAME: response.LOCATION_NAME || "",
          HOTEL_ADDRESS: response.HOTEL_ADDRESS || "",
          REMARKS: response.REMARKS || "",
          STATUS_MASTER: response.STATUS_MASTER === "AC" ? "ACTIVE" : "INACTIVE",
          USER: "Admin",
          MAC_ADDRESS: "WEB",
        });
      }
      setDialogOpen(true);
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.message || "Error fetching record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_MASTER) !== "ACTIVE") {
      toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.HOTEL_NAME?.trim()) {
      toast({ title: "Hotel name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.HOTEL_NAME.trim().length > 10) {
      toast({ title: "Hotel name must be 10 characters or less", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        HOTEL_TYPE: form.HOTEL_TYPE?.trim() || null,
        HOTEL_NAME: form.HOTEL_NAME.trim(),
        HOTEL_STAR: form.HOTEL_STAR?.trim() || null,
        COUNTRY_ID: form.COUNTRY_ID ? Number(form.COUNTRY_ID) : null,
        REGION_ID: form.REGION_ID ? Number(form.REGION_ID) : null,
        DISTRICT_ID: form.DISTRICT_ID ? Number(form.DISTRICT_ID) : null,
        LOCATION_NAME: form.LOCATION_NAME?.trim() || null,
        HOTEL_ADDRESS: form.HOTEL_ADDRESS?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.HOTEL_ID = Number(editing.id);
        const res = await dispatch(updateHotelResortMaster(payload)).unwrap();
        toast({ title: res?.message ?? "Hotel updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addHotelResortMaster(payload)).unwrap();
        toast({ title: res?.message ?? "Hotel created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchHotelResortMasters(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.message || "Error saving hotel"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteHotelResortMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Hotel deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchHotelResortMasters(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.message || "Error deleting hotel"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea" | "date", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, maxLength?: number, searchable?: boolean) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = required && !String(form[key] || "").trim();
    const borderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" && searchable ? (
          <SearchableSelect
            value={form[key] || ""}
            onChange={(v) => {
              const reset: Record<string, any> = {};
              if (key === "COUNTRY_ID") { reset.REGION_ID = ""; reset.DISTRICT_ID = ""; }
              if (key === "REGION_ID") { reset.DISTRICT_ID = ""; }
              setForm({ ...form, [key]: v, ...reset });
            }}
            options={options || []}
            placeholder={placeholder || `Select ${label}`}
            className={borderClass}
          />
        ) : type === "select" ? (
          <Select
            value={form[key] || ""}
            onValueChange={(v) => {
              const reset: Record<string, any> = {};
              if (key === "COUNTRY_ID") { reset.REGION_ID = ""; reset.DISTRICT_ID = ""; }
              if (key === "REGION_ID") { reset.DISTRICT_ID = ""; }
              setForm({ ...form, [key]: v, ...reset });
            }}
          >
            <SelectTrigger className={`h-9 text-xs ${borderClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${borderClass}`} />
        ) : (
          <Input
            type="text"
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs ${borderClass}`}
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
          <h1 className="text-2xl font-bold text-foreground">Hotel Resort Master</h1>
          <p className="text-sm text-muted-foreground">Manage hotels and resorts</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Hotel
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search hotels..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Star</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Country</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Region</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">District</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Location</th>
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
                    <td className="p-3 font-medium">{item.HOTEL_ID}</td>
                    <td className="p-3">{item.HOTEL_NAME}</td>
                    <td className="p-3">{item.HOTEL_TYPE || "-"}</td>
                    <td className="p-3">{item.HOTEL_STAR || "-"}</td>
                    <td className="p-3">{item.Country_Name || "-"}</td>
                    <td className="p-3">{item.REGION_NAME || "-"}</td>
                    <td className="p-3">{item.District_Name || "-"}</td>
                    <td className="p-3">{item.LOCATION_NAME || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
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
            <DialogTitle>{editing ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
          </DialogHeader>
          {loadingEdit ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Hotel Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {renderField("HOTEL_NAME", "Hotel Name", "text", undefined, true, "e.g., SERENA", 10)}
                  {renderField("HOTEL_TYPE", "Type", "select", HOTEL_TYPE_OPTIONS, false, "Select hotel type")}
                  {renderField("HOTEL_STAR", "Star Rating", "text", undefined, false, "e.g., 5 Star")}
                  {renderField("LOCATION_NAME", "Location", "text", undefined, false, "e.g., Ngorongoro")}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Location</h3>
                <div className="grid grid-cols-3 gap-4">
                  {renderField("COUNTRY_ID", "Country", "select", countryOptions, false, "Select country", undefined, true)}
                  {renderField("REGION_ID", "Region", "select", regionOptions, false, "Select region", undefined, true)}
                  {renderField("DISTRICT_ID", "District", "select", districtOptions, false, "Select district", undefined, true)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Address & Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  {renderField("HOTEL_ADDRESS", "Address", "textarea", undefined, false, "Street, city, etc.")}
                  {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Notes</h3>
                <div className="grid grid-cols-1 gap-4">
                  {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
                <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this hotel.</AlertDialogDescription>
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
