"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchSubMenuMappings,
  addSubMenuMapping,
  updateSubMenuMapping,
  deleteSubMenuMapping,
  clearSubMenuMappingError,
  type SubMenuMappingGridData,
} from "@/lib/subMenuMappingSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;
const NONE = "none";

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const toIdValue = (value: unknown): string =>
  value === undefined || value === null || value === "" || Number(value) <= 0
    ? NONE
    : String(Number(value));

export default function SubMenuMappingPage() {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((s) => s.subMenuMapping);
  const { toast } = useToast();

  const { data: subMenus } = useApiQuery("sub-menu-mapping-submenus", async () => {
    const res = await fetch(`${API_URL}/sub-menu`);
    if (!res.ok) throw new Error("Failed to fetch sub menus");
    const json = await res.json();
    return json.data || [];
  });

  const { data: links } = useApiQuery("sub-menu-mapping-links", async () => {
    const res = await fetch(`${API_URL}/links-and-pages`);
    if (!res.ok) throw new Error("Failed to fetch links");
    const json = await res.json();
    return json.data || [];
  });

  const subMenuOptions = useMemo(() => {
    if (!Array.isArray(subMenus)) return [];
    return subMenus
      .map((m: any) => ({
        value: String(Number(m.SUB_MENU_ID)),
        label: m.SUB_MENU_NAME || `Sub Menu #${m.SUB_MENU_ID}`,
      }))
      .filter((m: any) => m.value !== "NaN");
  }, [subMenus]);

  const linkOptions = useMemo(() => {
    if (!Array.isArray(links)) return [];
    return links
      .map((l: any) => ({
        value: String(Number(l.LINK_ID)),
        label: l.LINK_NAME
          ? `${l.LINK_NAME}${l.LINK_LOCATION ? ` (${l.LINK_LOCATION})` : ""}`
          : `Link #${l.LINK_ID}`,
      }))
      .filter((l: any) => l.value !== "NaN");
  }, [links]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);

  const selectedLinkLabel = useMemo(() => {
    const value = String(form.LINK_ID ?? NONE);
    if (value === NONE) return "None";
    return linkOptions.find((o) => o.value === value)?.label || `Link #${value}`;
  }, [form.LINK_ID, linkOptions]);

  const role = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try { return JSON.parse(userJson).role || 'Manager'; } catch { }
      }
    }
    return 'Manager';
  }, []);
  const isAdmin = String(role || "").trim().toLowerCase() === "admin";

  const filtered = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((d: any) => {
      const searchable = [d.PARENT_SUB_MENU_NAME, d.CHILD_SUB_MENU_NAME, d.MAP_LOCATION, d.LINK_NAME, d.LINK_LOCATION, d.STATUS_MASTER].join(" ").toLowerCase();
      if (!searchable.includes(search.toLowerCase())) return false;
      if (statusFilter !== "ALL" && normalizeStatus(d.STATUS_MASTER) !== normalizeStatus(statusFilter)) return false;
      return true;
    }).sort((a: any, b: any) => Number(b.MAP_ID) - Number(a.MAP_ID));
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
    dispatch(fetchSubMenuMappings(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearSubMenuMappingError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    MAP_ID: 0,
    SUB_MENU_PARENT_ID: NONE,
    CHILD_ID: NONE,
    MAP_LOCATION: "",
    LINK_ID: NONE,
    STATUS_MASTER: "ACTIVE",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      MAP_ID: item.MAP_ID || 0,
      SUB_MENU_PARENT_ID: toIdValue(item.SUB_MENU_PARENT_ID),
      CHILD_ID: toIdValue(item.CHILD_ID),
      MAP_LOCATION: item.MAP_LOCATION || "",
      LINK_ID: toIdValue(item.LINK_ID),
      STATUS_MASTER: normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (form.MAP_LOCATION && form.MAP_LOCATION.trim().length > 100) {
      toast({ title: "Map Location must be 100 characters or less", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.SUB_MENU_PARENT_ID === NONE && form.CHILD_ID === NONE && form.LINK_ID === NONE && !form.MAP_LOCATION?.trim()) {
      toast({ title: "Select a parent, child, link or map location", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const payload: Record<string, any> = {
      SUB_MENU_PARENT_ID: form.SUB_MENU_PARENT_ID === NONE ? null : Number(form.SUB_MENU_PARENT_ID),
      CHILD_ID: form.CHILD_ID === NONE ? null : Number(form.CHILD_ID),
      MAP_LOCATION: form.MAP_LOCATION?.trim() || null,
      LINK_ID: form.LINK_ID === NONE ? null : Number(form.LINK_ID),
      STATUS_MASTER: form.STATUS_MASTER === "ACTIVE" ? "AC" : "IA",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };

    try {
      if (editing) {
        payload.MAP_ID = Number(editing.id);
        const res = await dispatch(updateSubMenuMapping(payload as SubMenuMappingGridData)).unwrap();
        toast({ title: res?.message ?? "Sub menu mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addSubMenuMapping(payload as SubMenuMappingGridData)).unwrap();
        toast({ title: res?.message ?? "Sub menu mapping created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchSubMenuMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving sub menu mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteSubMenuMapping(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Sub menu mapping deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchSubMenuMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting sub menu mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderSelect = (key: string, label: string, options: { value: string; label: string }[]) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={form[key] || NONE} onValueChange={(v) => setForm({ ...form, [key]: v })}>
        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sub Menu Mapping</h1>
          <p className="text-sm text-muted-foreground">Manage parent / child sub menu and link mappings</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search mappings..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
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
                  {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Parent Sub Menu</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Child Sub Menu</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Map Location</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Link</th>
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
                    <td className="p-3 font-medium">{item.MAP_ID}</td>
                    <td className="p-3">{item.PARENT_SUB_MENU_NAME || "-"}</td>
                    <td className="p-3">{item.CHILD_SUB_MENU_NAME || "-"}</td>
                    <td className="p-3">{item.MAP_LOCATION || "-"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{item.LINK_NAME ? `${item.LINK_NAME}${item.LINK_LOCATION ? ` (${item.LINK_LOCATION})` : ""}` : "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {(normalizeStatus(item.STATUS_MASTER) === "ACTIVE") ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {renderSelect("SUB_MENU_PARENT_ID", "Parent Sub Menu", subMenuOptions)}
              {renderSelect("CHILD_ID", "Child Sub Menu", subMenuOptions)}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Link</Label>
                <Popover open={linkPickerOpen} onOpenChange={setLinkPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={linkPickerOpen}
                      className="h-9 justify-between text-xs font-normal"
                    >
                      <span className="truncate">{selectedLinkLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search link..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty>No link found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setForm({ ...form, LINK_ID: NONE });
                              setLinkPickerOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.LINK_ID === NONE ? "opacity-100" : "opacity-0")} />
                            None
                          </CommandItem>
                          {linkOptions.map((o) => (
                            <CommandItem
                              key={o.value}
                              value={o.label}
                              onSelect={() => {
                                setForm({ ...form, LINK_ID: o.value });
                                setLinkPickerOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(form.LINK_ID) === o.value ? "opacity-100" : "opacity-0")} />
                              {o.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "ACTIVE"} onValueChange={(v) => setForm({ ...form, STATUS_MASTER: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Map Location</Label>
              <Input
                type="text"
                value={form.MAP_LOCATION ?? ""}
                onChange={(e) => setForm({ ...form, MAP_LOCATION: e.target.value })}
                placeholder="e.g. /dashboard"
                className="h-9 text-xs"
                maxLength={100}
              />
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
            <AlertDialogDescription>This will permanently delete this sub menu mapping.</AlertDialogDescription>
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
