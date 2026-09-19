"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, RefreshCw, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/config";
import { toast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { refreshNavigationForUser } from "@/lib/navigationSlice";

interface RoleToLinkRecord {
  ROLE_TO_LINK_ID_ROLE_TO_LINK: number;
  ROLE_NAME: string;
  LINK_NAME: string;
  STATUS: string;
}

interface RoleOption {
  ROLE_ID: number;
  ROLE_NAME: string;
}

interface LinkOption {
  LINK_ID: number;
  LINK_NAME: string;
}

const getUser = () => {
  if (typeof window === 'undefined') return 'Admin';
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const u = JSON.parse(userJson);
      return u.LOGIN_NAME || u.username || 'Admin';
    }
  } catch { }
  return 'Admin';
};

const getMacAddr = () => {
  if (typeof window === 'undefined') return 'WEB';
  let mac = localStorage.getItem('client_mac_id');
  if (!mac) {
    mac = 'WEB-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    localStorage.setItem('client_mac_id', mac);
  }
  return mac;
};

const toDbStatus = (val: string) => (val === "INACTIVE" ? "IN" : "AC");
const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : "INACTIVE";
};
const isAdminRole = (name?: string) => /^admin$/i.test((name || "").trim());
const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function RoleToLinkPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s: any) => s.auth.user);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [links, setLinks] = useState<LinkOption[]>([]);
  const [records, setRecords] = useState<RoleToLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formRoleId, setFormRoleId] = useState("");
  const [formLinkIds, setFormLinkIds] = useState<string[]>([]);
  const [linksOpen, setLinksOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("ACTIVE");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const PAGE_SIZES = [10, 25, 50, "ALL"] as const;
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, linksRes, recordsRes] = await Promise.all([
        fetch(`${API_URL}/roles`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`${API_URL}/links-and-pages`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`${API_URL}/role-to-link`, { cache: 'no-store' }).then(r => r.json()),
      ]);
      setRoles((rolesRes.data || []).map((r: any) => ({
        ROLE_ID: Number(r.ROLE_ID ?? r.roleId ?? 0),
        ROLE_NAME: r.ROLE_NAME || r.roleName
      })));
      setLinks((linksRes.data || []).map((l: any) => ({
        LINK_ID: Number(l.LINK_ID ?? l.linkId ?? 0),
        LINK_NAME: l.LINK_NAME || l.linkName
      })));
      setRecords(recordsRes.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load data", description: e.message, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(toDisplayStatus(r.STATUS)));
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    let list = records;
    if (selectedRoleFilter !== "ALL") {
      list = list.filter(r => r.ROLE_NAME === selectedRoleFilter);
    }
    if (statusFilter !== "ALL") {
      list = list.filter(r => toDisplayStatus(r.STATUS) === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.ROLE_NAME.toLowerCase().includes(q) || r.LINK_NAME.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.ROLE_TO_LINK_ID_ROLE_TO_LINK - a.ROLE_TO_LINK_ID_ROLE_TO_LINK);
  }, [records, selectedRoleFilter, statusFilter, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filteredRecords.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filteredRecords.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filteredRecords.length / effectivePageSize);
  const paginatedRecords = useMemo(() => {
    if (effectivePageSize === "ALL") return filteredRecords;
    const start = (currentPage - 1) * (effectivePageSize as number);
    return filteredRecords.slice(start, start + (effectivePageSize as number));
  }, [filteredRecords, currentPage, effectivePageSize]);

  const handlePageSizeChange = (val: string) => {
    setPageSize(val === "ALL" ? "ALL" : Number(val));
    setCurrentPage(1);
  };

  const roleOptions = useMemo(() => {
    const names = new Set(roles.map(r => r.ROLE_NAME));
    return Array.from(names).sort();
  }, [roles]);

  const handleRoleChange = (roleId: string) => {
    setFormRoleId(roleId);
    const role = roles.find(r => String(r.ROLE_ID) === roleId);
    if (role && isAdminRole(role.ROLE_NAME)) {
      setFormLinkIds(links.map(l => String(l.LINK_ID)));
    } else {
      setFormLinkIds([]);
    }
  };

  const openAdd = (prefillRole?: string) => {
    setEditing(null);
    setFormStatus("ACTIVE");
    setDialogOpen(true);
    if (prefillRole) {
      const role = roles.find(r => r.ROLE_NAME === prefillRole);
      if (role) {
        handleRoleChange(String(role.ROLE_ID));
        return;
      }
    }
    setFormRoleId("");
    setFormLinkIds([]);
  };

  const openEdit = (record: RoleToLinkRecord) => {
    const matchedRole = roles.find(r => r.ROLE_NAME === record.ROLE_NAME);
    setEditing(record);
    setFormRoleId(matchedRole ? String(matchedRole.ROLE_ID) : "");
    const assignedLinkIds = records
      .filter(r => r.ROLE_NAME === record.ROLE_NAME)
      .map(r => links.find(l => l.LINK_NAME === r.LINK_NAME))
      .filter((l): l is LinkOption => Boolean(l))
      .map(l => String(l.LINK_ID));
    setFormLinkIds(Array.from(new Set(assignedLinkIds)));
    setFormStatus(toDisplayStatus(record.STATUS));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formRoleId) {
      toast({ title: "Please select a Role first", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (formLinkIds.length === 0) {
      toast({ title: "At least one Link must be selected", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ROLE_ID_TO_LINK: Number(formRoleId),
        LINK_ID_ROLE_TO_LINK: formLinkIds.map(Number),
        STATUS_ROLE_TO_LINK: toDbStatus(formStatus),
        USER_ROLE_TO_LINK: getUser(),
        MAC_ADDR_ROLE_TO_LINK: getMacAddr(),
      };
      const res = await fetch(`${API_URL}/role-to-link/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save role links");
      }
      const json = await res.json();
      toast({
        title: json.message ?? "Role links saved successfully",
        description: `${json.added || 0} added, ${json.updated || 0} updated, ${json.deleted || 0} removed`,
        duration: DEFAULT_TOAST_DURATION,
      });
      setDialogOpen(false);
      await fetchAll();
      dispatch(refreshNavigationForUser(authUser));
    } catch (e: any) {
      toast({ title: e.message || "Error saving role links", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/role-to-link/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete");
      }
      const json = await res.json().catch(() => ({}));
      toast({ title: json.message ?? "Role link deleted successfully", duration: DEFAULT_TOAST_DURATION });
      setDeleteId(null);
      await fetchAll();
      dispatch(refreshNavigationForUser(authUser));
    } catch (e: any) {
      toast({ title: e.message || "Error deleting role link", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Role Links</h1>
          <p className="text-sm text-muted-foreground">Assign links to roles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => openAdd(selectedRoleFilter !== "ALL" ? selectedRoleFilter : undefined)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Assignment
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by role or link name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Role:</span>
              <Select value={selectedRoleFilter} onValueChange={(v) => { setSelectedRoleFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-45 h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {roleOptions.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availablePageSizes.map(s => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-16">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Role</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Link</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((rec) => {
                  const displayStatus = toDisplayStatus(rec.STATUS);
                  const isActive = displayStatus === "ACTIVE";
                  return (
                    <tr key={rec.ROLE_TO_LINK_ID_ROLE_TO_LINK} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-xs font-mono text-muted-foreground">{rec.ROLE_TO_LINK_ID_ROLE_TO_LINK}</td>
                      <td className="p-3 font-medium">{rec.ROLE_NAME}</td>
                      <td className="p-3">{rec.LINK_NAME}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold ${isActive
                              ? "bg-green-500/10 text-green-600 border-green-200"
                              : "bg-red-500/10 text-red-600 border-red-200"
                            }`}
                        >
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(rec)}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteId(rec.ROLE_TO_LINK_ID_ROLE_TO_LINK)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No role-link assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            <span className="text-foreground">{filteredRecords.length === 0 ? 0 : ((currentPage - 1) * (effectivePageSize === "ALL" ? 0 : (effectivePageSize as number))) + 1}</span>
            {" "}to{" "}
            <span className="text-foreground">{Math.min(currentPage * (effectivePageSize === "ALL" ? filteredRecords.length : (effectivePageSize as number)), filteredRecords.length)}</span>
            {" "}of <span className="text-foreground">{filteredRecords.length}</span> entries
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
                return (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Role <span className="text-destructive">*</span></Label>
              <Select
                value={formRoleId}
                onValueChange={handleRoleChange}
                disabled={!!editing || loading}
              >
                <SelectTrigger className={!formRoleId ? "border-destructive ring-1 ring-destructive/30" : ""}>
                  <SelectValue placeholder={loading ? "Loading roles..." : "Select Role"} />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem disabled value="">Loading roles...</SelectItem>
                  ) : (
                    roles.map(r => (
                      <SelectItem key={r.ROLE_ID} value={String(r.ROLE_ID)}>{r.ROLE_NAME}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Link <span className="text-destructive">*</span></Label>
              <Popover open={linksOpen} onOpenChange={setLinksOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={linksOpen}
                    className={cn("w-full justify-between min-h-10 h-auto p-2", formLinkIds.length === 0 ? "border-destructive ring-1 ring-destructive/30" : "")}
                    disabled={loading}
                  >
                    <div className="flex flex-wrap gap-1 items-center">
                      {formLinkIds.length > 0 ? (
                        <>
                          <Badge variant="secondary" className="font-normal">
                            {formLinkIds.length} selected
                          </Badge>
                          {formLinkIds.slice(0, 2).map(id => {
                            const link = links.find(l => String(l.LINK_ID) === id);
                            return (
                              <Badge key={id} variant="outline" className="font-normal hidden sm:inline-flex">
                                {link?.LINK_NAME}
                              </Badge>
                            );
                          })}
                          {formLinkIds.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{formLinkIds.length - 2} more</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground font-normal">{loading ? "Loading links..." : "Select Links..."}</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search link..." />
                    <CommandList>
                      <CommandEmpty>No link found.</CommandEmpty>
                      <CommandGroup>
                        {links.map((l) => (
                          <CommandItem
                            key={l.LINK_ID}
                            value={l.LINK_NAME}
                            onSelect={() => {
                              const sid = String(l.LINK_ID);
                              setFormLinkIds(prev =>
                                prev.includes(sid)
                                  ? prev.filter(p => p !== sid)
                                  : [...prev, sid]
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formLinkIds.includes(String(l.LINK_ID)) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.LINK_NAME}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Selected Links ({formLinkIds.length})</Label>
                {formLinkIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFormLinkIds(links.map(l => String(l.LINK_ID)))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFormLinkIds([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-md border p-2 max-h-40 overflow-y-auto">
                {formLinkIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No links selected</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {formLinkIds.map(id => {
                      const link = links.find(l => String(l.LINK_ID) === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                        >
                          {link?.LINK_NAME || id}
                          <button
                            type="button"
                            onClick={() => setFormLinkIds(prev => prev.filter(p => p !== id))}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              {editing ? (
                <Button onClick={handleSave} disabled={saving} className="bg-info text-info-foreground hover:bg-info/90">
                  {saving ? "Saving..." : "Update"}
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving ? "Saving..." : "Create"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this role-link assignment.
            </AlertDialogDescription>
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