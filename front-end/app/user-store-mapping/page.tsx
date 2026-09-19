"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchUserStoreMappings, addUserStoreMapping, updateUserStoreMapping, deleteUserStoreMapping, clearUserStoreMappingError, UserStoreMappingGridData } from "@/lib/userStoreMappingSlice";
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

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

export default function UserStoreMappingPage() {
  const dispatch = useAppDispatch();
  const { mappings, loading, error } = useAppSelector((s) => s.userStoreMapping);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserStoreMappingGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const currentUser = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch { }
    }
    return {};
  }, []);
  const role = currentUser.role || 'Manager';
  const currentLoginId = currentUser.LOGIN_ID || currentUser.id || null;
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const { data: users } = useApiQuery("usm-users", async () => {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.LOGIN_ID }));
  });

  const { data: companies } = useApiQuery("usm-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: camps } = useApiQuery("usm-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CAMP_ID }));
  });

  const { data: stores } = useApiQuery("usm-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((s: any) => ({ ...s, id: s.Store_Id }));
  });

  const { data: roles } = useApiQuery("usm-roles", async () => {
    const res = await fetch(`${API_URL}/roles`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((r: any) => ({ ...r, id: r.ROLE_ID }));
  });

  const { data: mappingsData } = useApiQuery("usm-company-camp-store", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data || [];
  });

  const userOptions = useMemo(() =>
    (Array.isArray(users) ? users : []).map((u: any) => ({ value: String(u.LOGIN_ID), label: u.LOGIN_NAME })),
    [users]
  );

  const companyOptions = useMemo(() =>
    (Array.isArray(companies) ? companies : []).map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })),
    [companies]
  );

  const companyCampMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!Array.isArray(mappingsData)) return map;
    for (const m of mappingsData) {
      if (m.COMPANY_ID != null && m.CAMP_ID != null) {
        const companyId = String(m.COMPANY_ID);
        const campId = String(m.CAMP_ID);
        const existing = map.get(companyId);
        if (existing) existing.add(campId);
        else map.set(companyId, new Set<string>([campId]));
      }
    }
    return map;
  }, [mappingsData]);

  const campOptions = useMemo(() => {
    if (!Array.isArray(camps)) return [];
    if (!form.COMPANY_ID) return [];
    const ids = companyCampMap.get(String(form.COMPANY_ID)) || new Set<string>();
    const filtered = camps.filter((c: any) => ids.has(String(c.CAMP_ID)));
    
    const selected = form.CAMP_ID ? camps.find((c: any) => String(c.CAMP_ID) === String(form.CAMP_ID)) : undefined;
    if (selected && !filtered.some((c: any) => String(c.CAMP_ID) === String(selected.CAMP_ID))) {
      return [...filtered, selected].map((c: any) => ({ value: String(c.CAMP_ID), label: c.CAMP_NAME }));
    }
    
    return filtered.map((c: any) => ({ value: String(c.CAMP_ID), label: c.CAMP_NAME }));
  }, [camps, companyCampMap, form.COMPANY_ID, form.CAMP_ID]);

  const storeOptions = useMemo(() => {
    if (!Array.isArray(stores)) return [];
    const selectedCamp = form.CAMP_ID;
    const filtered = selectedCamp ? stores.filter((s: any) => Number(s.Camp_Id || s.CAMP_ID) === Number(selectedCamp)) : stores;
    return filtered.map((s: any) => ({ value: String(s.Store_Id || s.STORE_ID), label: s.Store_Name || s.STORE_NAME }));
  }, [stores, form.CAMP_ID]);

  const roleOptions = useMemo(() =>
    (Array.isArray(roles) ? roles : []).map((r: any) => ({ value: String(r.ROLE_ID), label: r.ROLE_NAME })),
    [roles]
  );

  const enrichedData = useMemo(() => {
    if (!Array.isArray(mappings)) return [];
    return mappings.map((m: any) => {
      const user = Array.isArray(users) ? users.find((u: any) => Number(u.LOGIN_ID) === Number(m.LOGIN_ID)) : undefined;
      const company = Array.isArray(companies) ? companies.find((c: any) => Number(c.COMPANY_ID) === Number(m.COMPANY_ID)) : undefined;
      const camp = Array.isArray(camps) ? camps.find((c: any) => Number(c.CAMP_ID) === Number(m.CAMP_ID)) : undefined;
      const store = Array.isArray(stores) ? stores.find((s: any) => Number(s.Store_Id) === Number(m.STORE_ID)) : undefined;
      const role = Array.isArray(roles) ? roles.find((r: any) => Number(r.ROLE_ID) === Number(m.ROLE_ID)) : undefined;
      return {
        ...m,
        id: m.USER_TO_STORE_ID,
        USER_NAME: user?.LOGIN_NAME || `ID: ${m.LOGIN_ID}`,
        COMPANY_NAME: company?.COMPANY_NAME || `ID: ${m.COMPANY_ID}`,
        CAMP_NAME: camp?.CAMP_NAME || `ID: ${m.CAMP_ID}`,
        STORE_NAME: store?.Store_Name || `ID: ${m.STORE_ID}`,
        ROLE_NAME: role?.ROLE_NAME || `ID: ${m.ROLE_ID}`,
        Login_Id: m.LOGIN_ID,
        Store_Id: m.STORE_ID,
        Camp_Id: m.CAMP_ID,
      };
    });
  }, [mappings, users, companies, camps, stores, roles]);

  const scopedData = useMemo(() => {
    if (!Array.isArray(enrichedData)) return [];
    if (isAdmin) return enrichedData;
    return enrichedData.filter((d: any) => Number(d.LOGIN_ID) === Number(currentLoginId));
  }, [enrichedData, isAdmin, currentLoginId]);

  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(scopedData)) return [];
    const set = new Set<string>();
    scopedData.forEach((d: any) => {
      const s = d.STATUS_MASTER;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [scopedData]);

  const filtered = useMemo(() => {
    if (!Array.isArray(scopedData)) return [];
    return scopedData
      .filter((d: any) => {
        const matchesStatus = statusFilter === "ALL" || normalizeStatus(d.STATUS_MASTER) === normalizeStatus(statusFilter);
        if (!matchesStatus) return false;
        const searchable = [d.USER_NAME, d.COMPANY_NAME, d.CAMP_NAME, d.STORE_NAME, d.ROLE_NAME].join(" ").toLowerCase();
        return searchable.includes(search.toLowerCase());
      })
      .sort((a: any, b: any) => Number(b.id ?? b.USER_TO_STORE_ID ?? 0) - Number(a.id ?? a.USER_TO_STORE_ID ?? 0));
  }, [scopedData, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const currentUserMappings = useMemo(() => {
    if (!form.LOGIN_ID || !Array.isArray(enrichedData)) return [];
    return enrichedData.filter((d: any) => Number(d.LOGIN_ID) === Number(form.LOGIN_ID));
  }, [enrichedData, form.LOGIN_ID]);

  useEffect(() => {
    dispatch(fetchUserStoreMappings());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearUserStoreMappingError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    LOGIN_ID: "",
    COMPANY_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    ROLE_ID: "",
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
      LOGIN_ID: String(item.LOGIN_ID || ""),
      COMPANY_ID: String(item.COMPANY_ID || ""),
      CAMP_ID: String(item.CAMP_ID || ""),
      STORE_ID: String(item.STORE_ID || ""),
      ROLE_ID: String(item.ROLE_ID || ""),
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER || "ACTIVE",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!String(form.LOGIN_ID || "").trim()) {
      toast({ title: "User is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!String(form.ROLE_ID || "").trim()) {
      toast({ title: "Role is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!String(form.COMPANY_ID || "").trim()) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!String(form.CAMP_ID || "").trim()) {
      toast({ title: "Camp is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!String(form.STORE_ID || "").trim()) {
      toast({ title: "Store is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    try {
      const payload: Record<string, any> = {
        LOGIN_ID: form.LOGIN_ID ? Number(form.LOGIN_ID) : null,
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
        STORE_ID: form.STORE_ID ? Number(form.STORE_ID) : null,
        ROLE_ID: form.ROLE_ID ? Number(form.ROLE_ID) : null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: editing ? (form.STATUS_MASTER || "ACTIVE") : "ACTIVE",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.USER_TO_STORE_ID = Number(editing.id);
        const res = await dispatch(updateUserStoreMapping(payload)).unwrap();
        toast({ title: res?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addUserStoreMapping(payload)).unwrap();
        toast({ title: res?.message ?? "Mapping created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchUserStoreMappings());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteUserStoreMapping(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Mapping deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchUserStoreMappings());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, disabled?: boolean) => {
    const invalid = !!required && !form[key];
    const errorBorder = invalid ? "border-red-500" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : "flex flex-col gap-1.5"}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select
            value={form[key] || ""}
            onValueChange={(v) => {
              const update: Record<string, any> = { ...form, [key]: v };
              if (key === "COMPANY_ID") { update.CAMP_ID = ""; update.STORE_ID = ""; }
              if (key === "CAMP_ID") { update.STORE_ID = ""; }
              setForm(update);
            }}
            disabled={disabled}
          >
            <SelectTrigger className={`h-9 text-xs ${errorBorder}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${errorBorder}`} />
        ) : (
          <Input type={type === "number" ? "number" : "text"} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${errorBorder}`} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User to Store Mapping</h1>
          <p className="text-sm text-muted-foreground">Assign users to stores with role and scope</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Mapping
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search mappings..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-16">ID</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">User</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Role</th>
                   <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                 </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                   <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                     <td className="p-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                     <td className="p-3 flex gap-2">
                      {isAdmin && <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>}
                      {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.USER_NAME}</td>
                    <td className="p-3">{item.COMPANY_NAME}</td>
                    <td className="p-3">{item.CAMP_NAME}</td>
                    <td className="p-3">{item.STORE_NAME}</td>
                    <td className="p-3">{item.ROLE_NAME}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${String(item.STATUS_MASTER).toLowerCase() === "active" || String(item.STATUS_MASTER).toLowerCase() === "ac" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {(String(item.STATUS_MASTER).toLowerCase() === "active" || String(item.STATUS_MASTER).toLowerCase() === "ac") ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No mappings found</td></tr>
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
            <DialogTitle>{editing ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">User & Role</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("LOGIN_ID", "User", "select", userOptions, true, "Select user")}
                {renderField("ROLE_ID", "Role", "select", roleOptions, true, "Select role")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Scope</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
                {renderField("CAMP_ID", "Camp", "select", campOptions, true, form.COMPANY_ID ? "Select camp" : "Select company first", !form.COMPANY_ID)}
                {renderField("STORE_ID", "Store", "select", storeOptions, true, form.CAMP_ID ? "Select store" : "Select camp first", !form.CAMP_ID)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
                <div className="col-span-2">{renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}</div>
              </div>
            </div>
            
            {form.LOGIN_ID && currentUserMappings.length > 0 && (
              <div className="bg-muted/20 p-4 rounded-lg border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Existing Mappings for User</h3>
                <div className="max-h-40 overflow-y-auto w-full">
                  <table className="w-full text-xs border rounded-md">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-b">Role</th>
                        <th className="text-left p-2 border-b">Company</th>
                        <th className="text-left p-2 border-b">Camp</th>
                        <th className="text-left p-2 border-b">Store</th>
                        <th className="text-left p-2 border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUserMappings.map((m: any, idx: number) => (
                        <tr key={m.id || idx} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="p-2 font-medium">{m.ROLE_NAME}</td>
                          <td className="p-2">{m.COMPANY_NAME}</td>
                          <td className="p-2">{m.CAMP_NAME}</td>
                          <td className="p-2">{m.STORE_NAME}</td>
                          <td className="p-2">
                            <span className={`${String(m.STATUS_MASTER).toLowerCase() === "active" || String(m.STATUS_MASTER).toLowerCase() === "ac" ? "text-green-600" : "text-destructive"} font-medium`}>
                              {(String(m.STATUS_MASTER).toLowerCase() === "active" || String(m.STATUS_MASTER).toLowerCase() === "ac") ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
            <AlertDialogDescription>This will permanently delete this mapping.</AlertDialogDescription>
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
