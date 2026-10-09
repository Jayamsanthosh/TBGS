"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { useApiQuery, useApiMutation } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

const r3 = (n: number) => Math.round(n * 1000) / 1000;

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const money = (v: any) => (toNum(v) === 0 ? "-" : toNum(v).toFixed(3));

const pick = (row: any, ...keys: string[]) => {
  for (const k of keys) {
    if (row?.[k] !== undefined && row?.[k] !== null) return row[k];
  }
  return undefined;
};

interface AdditionalChargesPanelProps {
  entityRefNo?: string | null;
  defaultExchangeRate?: any;
  isAdmin: boolean;
  /* When there is no saved quotation yet, charges are staged through this
     lifted list instead of being written to the API immediately. */
  charges?: any[];
  onChargesChange?: (rows: any[]) => void;
}

const emptyForm = (exchangeRate: any) => ({
  ADDITIONAL_CHARGE_TYPE_ID: "",
  DESCRIPTION: "",
  QUANTITY: "1",
  UOM_ID: "1",
  RATE: "",
  TAX_ID: "",
  TAX_PERCENTAGE: "",
  EXCHANGE_RATE: exchangeRate == null || exchangeRate === "" ? "" : String(exchangeRate),
  REMARKS: "",
  LINE_NO: "",
});

export default function AdditionalChargesPanel({
  entityRefNo,
  defaultExchangeRate,
  isAdmin,
  charges,
  onChargesChange,
}: AdditionalChargesPanelProps) {
  const refNo = entityRefNo || "";
  /* No quotation number and a parent that can hold staged rows: the panel edits
     a local list and the quotation's Create action persists it afterwards. */
  const staged = !refNo && typeof onChargesChange === "function";
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>(() => emptyForm(defaultExchangeRate));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingCharge, setSavingCharge] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    const json = await res.json();
    return json.data || [];
  };

  const listKey = refNo ? `pq-charges-${refNo}` : "pq-charges-none";
  const { data: listData, loading } = useApiQuery(
    listKey,
    () => fetchList(`${API_URL}/purchase-quotation/charges/${encodeURIComponent(refNo)}`),
    { enabled: !!refNo }
  );
  const fetchedRows = Array.isArray(listData) ? listData : [];
  const rows = staged ? (Array.isArray(charges) ? (charges as any[]) : []) : fetchedRows;

  const { mutateAsync } = useApiMutation([listKey]);

  /* Reuses the same cache keys as the quotation page where the masters already
     exist, so a charge form never double-fetches its dropdowns. */
  const { data: chargeTypesData } = useApiQuery("pq-master-charge-types", () =>
    fetchList(`${API_URL}/additional-charge-type-master/load?includeInactive=false`)
  );
  const { data: uomsData } = useApiQuery("pq-master-uoms", () => fetchList(`${API_URL}/uom-master`));
  const { data: taxesData } = useApiQuery("pq-master-taxes", () => fetchList(`${API_URL}/tax-master`));

  const chargeTypes = Array.isArray(chargeTypesData) ? chargeTypesData : [];
  const uoms = Array.isArray(uomsData) ? uomsData : [];
  const taxes = Array.isArray(taxesData) ? taxesData : [];

  const nextLineNo = useMemo(
    () => (rows as any[]).reduce((m, r) => Math.max(m, toNum(r.LINE_NO)), 0) + 1,
    [rows]
  );

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  /* Taxes that can actually be picked, in dropdown order. A new charge defaults
     to the first tax (index 0), so most added charges carry the intended rate
     without picking. */
  const taxOptionsForCharge = (taxes as any[]).filter((o) => pick(o, "TAX_ID", "taxId") != null);
  const defaultTaxForCharge = taxOptionsForCharge[0] ?? null;
  const taxPctOf = (t: any) => {
    const v = pick(t, "TAX_PERCENTAGE", "taxPercentage");
    return v != null && v !== "" ? String(v) : "";
  };

  /* Readable names for staged rows, which have no joined SHOW columns yet. */
  const typeDisplay = (id: any) => {
    const found = chargeTypes.find((o: any) => String(pick(o, "ADDITIONAL_CHARGE_TYPE_ID", "additionalChargeTypeId")) === String(id));
    return pick(found, "ADDITIONAL_CHARGE_TYPE_NAME", "additionalChargeTypeName") ?? "";
  };
  const uomDisplay = (id: any) => {
    const found = uoms.find((o: any) => String(pick(o, "UOM_ID", "uomId")) === String(id));
    return pick(found, "UOM_NAME", "uomName") ?? "";
  };
  const taxDisplay = (id: any) => {
    const found = taxes.find((o: any) => String(pick(o, "TAX_ID", "taxId")) === String(id));
    return pick(found, "TAX_NAME", "taxName") ?? "";
  };

  const handleTaxChange = (value: string) => {
    const t = taxes.find((x: any) => String(pick(x, "TAX_ID", "taxId")) === value);
    setForm((prev) => ({
      ...prev,
      TAX_ID: value,
      TAX_NAME: pick(t, "TAX_NAME", "taxName") ?? "",
      TAX_PERCENTAGE: taxPctOf(t),
    }));
  };

  const startAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm(defaultExchangeRate),
      LINE_NO: String(nextLineNo),
      TAX_ID: defaultTaxForCharge ? String(pick(defaultTaxForCharge, "TAX_ID", "taxId")) : "",
      TAX_NAME: defaultTaxForCharge ? pick(defaultTaxForCharge, "TAX_NAME", "taxName") ?? "" : "",
      TAX_PERCENTAGE: taxPctOf(defaultTaxForCharge),
    });
    setFormErrors({});
    setOpen(true);
  };

  const startEdit = (row: any) => {
    setEditing(row);
    setForm({
      LINE_NO: pick(row, "LINE_NO") ?? "",
      ADDITIONAL_CHARGE_TYPE_ID: pick(row, "ADDITIONAL_CHARGE_TYPE_ID") ?? "",
      DESCRIPTION: row?.DESCRIPTION ?? "",
      QUANTITY: pick(row, "QUANTITY") ?? "1",
      UOM_ID: pick(row, "UOM_ID") ?? "1",
      RATE: pick(row, "RATE") ?? "",
      TAX_ID: pick(row, "TAX_ID") ?? "",
      TAX_PERCENTAGE: pick(row, "TAX_PERCENTAGE") ?? "",
      EXCHANGE_RATE: pick(row, "EXCHANGE_RATE") ?? defaultExchangeRate ?? "",
      REMARKS: row?.REMARKS ?? "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const preview = useMemo(() => {
    const qty = toNum(form.QUANTITY);
    const rate = toNum(form.RATE);
    const taxPct = toNum(form.TAX_PERCENTAGE);
    const exRate = toNum(form.EXCHANGE_RATE);
    const totalFc = r3(qty * rate);
    const taxFc = r3((totalFc * taxPct) / 100);
    const finalFc = r3(totalFc + taxFc);
    return {
      totalFc,
      taxFc,
      finalFc,
      totalLc: r3(totalFc * exRate),
      taxLc: r3(taxFc * exRate),
      finalLc: r3(finalFc * exRate),
      exRate,
    };
  }, [form]);

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (!form.ADDITIONAL_CHARGE_TYPE_ID) {
      next.ADDITIONAL_CHARGE_TYPE_ID = "Select the charge type, e.g. Freight";
    }
    if (form.RATE === "") {
      next.RATE = "Rate is required";
    } else if (toNum(form.RATE) < 0) {
      next.RATE = "Rate cannot be negative";
    }
    if (!form.EXCHANGE_RATE) {
      next.EXCHANGE_RATE = "Exchange rate is required";
    } else if (toNum(form.EXCHANGE_RATE) <= 0) {
      next.EXCHANGE_RATE = "Exchange rate must be greater than 0";
    }
    setFormErrors(next);
    if (Object.keys(next).length) return;

    const payload: any = {
      PURCHASE_QUOTATION_NO: refNo,
      LINE_NO: form.LINE_NO === "" ? null : Number(form.LINE_NO),
      ADDITIONAL_CHARGE_TYPE_ID: form.ADDITIONAL_CHARGE_TYPE_ID === "" ? null : Number(form.ADDITIONAL_CHARGE_TYPE_ID),
      DESCRIPTION: form.DESCRIPTION ?? "",
      QUANTITY: toNum(form.QUANTITY),
      UOM_ID: form.UOM_ID === "" ? null : Number(form.UOM_ID),
      RATE: toNum(form.RATE),
      TAX_ID: form.TAX_ID === "" || form.TAX_ID === "__none__" ? null : Number(form.TAX_ID),
      TAX_PERCENTAGE: form.TAX_PERCENTAGE === "" ? 0 : toNum(form.TAX_PERCENTAGE),
      EXCHANGE_RATE: toNum(form.EXCHANGE_RATE),
      REMARKS: form.REMARKS ?? "",
      STATUS_ENTRY: "AC",
    };

    /* Staged rows keep the readable names the SHOW query would have joined, so
       the grid looks identical while the quotation is still unsaved. */
    if (staged) {
      payload.ADDITIONAL_CHARGE_TYPE_NAME = typeDisplay(payload.ADDITIONAL_CHARGE_TYPE_ID);
      payload.UOM_NAME = uomDisplay(payload.UOM_ID);
      payload.TAX_NAME = taxDisplay(payload.TAX_ID);
      if (editing) {
        onChargesChange?.((rows as any[]).map((r) => (r === editing ? payload : r)));
        toast({ title: "Additional Charge updated", duration: DEFAULT_TOAST_DURATION });
      } else {
        onChargesChange?.([...(rows as any[]), payload]);
        toast({ title: "Additional Charge added - saved when you create the quotation", duration: DEFAULT_TOAST_DURATION });
      }
      setOpen(false);
      setEditing(null);
      return;
    }

    setSavingCharge(true);
    try {
      const res: any = await mutateAsync(async () => {
        if (editing) {
          const id = Number(pick(editing, "PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID"));
          const response = await fetch(`${API_URL}/purchase-quotation/charge/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await response.json().catch(() => ({}));
          if (!response.ok) throw json.message || "Failed to update additional charge";
          return json;
        }
        const response = await fetch(`${API_URL}/purchase-quotation/charge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw json.message || "Failed to save additional charge";
        return json;
      });
      toast({
        title: res?.message || (editing ? "Additional Charge updated successfully" : "Additional Charge saved successfully"),
        duration: DEFAULT_TOAST_DURATION,
      });
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to save the additional charge",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setSavingCharge(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    /* A staged row is only in the local list - removing it needs no API call. */
    if (staged) {
      onChargesChange?.((rows as any[]).filter((r) => r !== deleteTarget));
      setDeleteTarget(null);
      return;
    }

    const id = Number(pick(deleteTarget, "PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID"));
    const authUser = user as any | null;
    const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
    const ROLE = authUser?.role || authUser?.ROLE || "Admin";

    setDeleting(true);
    try {
      const res: any = await mutateAsync(async () => {
        const response = await fetch(
          `${API_URL}/purchase-quotation/charge/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
          { method: "DELETE" }
        );
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw json.message || "Failed to delete additional charge";
        return json;
      });
      toast({
        title: res?.message || "Additional Charge deleted successfully",
        duration: DEFAULT_TOAST_DURATION,
      });
      setDeleteTarget(null);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to delete the additional charge",
        duration: DEFAULT_TOAST_DURATION,
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const chargeTypeName = (row: any) =>
    row?.ADDITIONAL_CHARGE_TYPE_NAME ||
    (row?.ADDITIONAL_CHARGE_TYPE_ID != null ? `#${row.ADDITIONAL_CHARGE_TYPE_ID}` : "-");

  /* Amounts use the persisted SHOW columns when present (small child rows in
     edit mode) and the same r3 formulas when the row is still staged. */
  const chargeTotalsFor = (row: any) => {
    const qty = toNum(pick(row, "QUANTITY"));
    const rate = toNum(pick(row, "RATE"));
    const taxPct = toNum(pick(row, "TAX_PERCENTAGE"));
    const exRate = toNum(pick(row, "EXCHANGE_RATE"));
    const totalFc = r3(qty * rate);
    const taxFc = r3((totalFc * taxPct) / 100);
    const finalFc = r3(totalFc + taxFc);
    return {
      TOTAL_AMOUNT_FC: pick(row, "TOTAL_AMOUNT_FC") != null ? toNum(pick(row, "TOTAL_AMOUNT_FC")) : totalFc,
      TAX_AMOUNT_FC: pick(row, "TAX_AMOUNT_FC") != null ? toNum(pick(row, "TAX_AMOUNT_FC")) : taxFc,
      FINAL_AMOUNT_FC: pick(row, "FINAL_AMOUNT_FC") != null ? toNum(pick(row, "FINAL_AMOUNT_FC")) : finalFc,
      FINAL_AMOUNT_LC: pick(row, "FINAL_AMOUNT_LC") != null ? toNum(pick(row, "FINAL_AMOUNT_LC")) : r3(finalFc * exRate),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {!refNo
            ? "Charges are saved when you create the quotation."
            : `${rows.length} additional charge${rows.length === 1 ? "" : "s"} for ${refNo}.`}
          {staged && (
            <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {rows.length} not saved yet
            </span>
          )}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={!refNo && !staged}
          onClick={startAdd}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Charge
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
          No additional charges added to this Purchase Quotation.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Line</TableHead>
                <TableHead className="whitespace-nowrap">Charge Type</TableHead>
                <TableHead className="whitespace-nowrap">Description</TableHead>
                <TableHead className="whitespace-nowrap text-right">Qty</TableHead>
                <TableHead className="whitespace-nowrap">UOM</TableHead>
                <TableHead className="whitespace-nowrap text-right">Rate</TableHead>
                <TableHead className="whitespace-nowrap text-right">Total FC</TableHead>
                <TableHead className="whitespace-nowrap text-right">Tax FC</TableHead>
                <TableHead className="whitespace-nowrap text-right">Final FC</TableHead>
                <TableHead className="whitespace-nowrap text-right">Final LC</TableHead>
                <TableHead className="whitespace-nowrap">Remarks</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows as any[]).map((r, i) => (
                <TableRow key={pick(r, "PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID", "ID") ?? i}>
                  <TableCell className="whitespace-nowrap">{pick(r, "LINE_NO") ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{chargeTypeName(r)}</TableCell>
                  <TableCell className="whitespace-nowrap">{r?.DESCRIPTION || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(pick(r, "QUANTITY"))}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r?.UOM_NAME || (pick(r, "UOM_ID") != null ? `#${r.UOM_ID}` : "-")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(pick(r, "RATE"))}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(chargeTotalsFor(r).TOTAL_AMOUNT_FC)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(chargeTotalsFor(r).TAX_AMOUNT_FC)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(chargeTotalsFor(r).FINAL_AMOUNT_FC)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{money(chargeTotalsFor(r).FINAL_AMOUNT_LC)}</TableCell>
                  <TableCell className="whitespace-nowrap">{r?.REMARKS || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(r)} className="h-7 px-2">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(r)} className="h-7 px-2 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit Additional Charge (Line ${form.LINE_NO || "-"})` : "Add Additional Charge"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Line No</Label>
              <Input
                type="number"
                value={form.LINE_NO ?? ""}
                onChange={(e) => setField("LINE_NO", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Charge Type
                <span className="text-destructive"> *</span>
              </Label>
              <Select value={String(form.ADDITIONAL_CHARGE_TYPE_ID ?? "")} onValueChange={(v) => setField("ADDITIONAL_CHARGE_TYPE_ID", v)}>
                <SelectTrigger className="!h-9 text-xs">
                  <SelectValue placeholder="Select charge type" />
                </SelectTrigger>
                <SelectContent>
                  {(chargeTypes as any[])
                    .filter((o: any) => pick(o, "ADDITIONAL_CHARGE_TYPE_ID", "additionalChargeTypeId") != null)
                    .map((o: any) => (
                      <SelectItem key={String(pick(o, "ADDITIONAL_CHARGE_TYPE_ID", "additionalChargeTypeId"))} value={String(pick(o, "ADDITIONAL_CHARGE_TYPE_ID", "additionalChargeTypeId"))}>
                        {pick(o, "ADDITIONAL_CHARGE_TYPE_NAME", "additionalChargeTypeName")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formErrors.ADDITIONAL_CHARGE_TYPE_ID && (
                <span className="text-[11px] text-destructive">{formErrors.ADDITIONAL_CHARGE_TYPE_ID}</span>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={form.DESCRIPTION ?? ""}
                onChange={(e) => setField("DESCRIPTION", e.target.value)}
                placeholder="e.g. Ocean freight Bombay -> Lagos"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                step="any"
                value={form.QUANTITY ?? ""}
                onChange={(e) => setField("QUANTITY", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">UOM</Label>
              <Select value={String(form.UOM_ID ?? "1")} onValueChange={(v) => setField("UOM_ID", v)}>
                <SelectTrigger className="!h-9 text-xs">
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {(uoms as any[])
                    .filter((o: any) => pick(o, "UOM_ID", "uomId") != null)
                    .map((o: any) => (
                      <SelectItem key={String(pick(o, "UOM_ID", "uomId"))} value={String(pick(o, "UOM_ID", "uomId"))}>
                        {pick(o, "UOM_NAME", "uomName")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Rate
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                type="number"
                step="any"
                value={form.RATE ?? ""}
                onChange={(e) => setField("RATE", e.target.value)}
                placeholder="0.000"
              />
              {formErrors.RATE && (
                <span className="text-[11px] text-destructive">{formErrors.RATE}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tax</Label>
              <Select value={form.TAX_ID === "" || form.TAX_ID == null ? "__none__" : String(form.TAX_ID)} onValueChange={handleTaxChange}>
                <SelectTrigger className="!h-9 text-xs">
                  <SelectValue placeholder="No tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Tax</SelectItem>
                  {(taxes as any[])
                    .filter((o: any) => pick(o, "TAX_ID", "taxId") != null)
                    .map((o: any) => (
                      <SelectItem key={String(pick(o, "TAX_ID", "taxId"))} value={String(pick(o, "TAX_ID", "taxId"))}>
                        {pick(o, "TAX_NAME", "taxName")} ({pick(o, "TAX_PERCENTAGE", "taxPercentage")}%)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">
                Exchange Rate
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                type="number"
                step="any"
                value={form.EXCHANGE_RATE ?? ""}
                onChange={(e) => setField("EXCHANGE_RATE", e.target.value)}
                placeholder="1.000000"
              />
              {formErrors.EXCHANGE_RATE && (
                <span className="text-[11px] text-destructive">{formErrors.EXCHANGE_RATE}</span>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Remarks</Label>
              <Textarea
                value={form.REMARKS ?? ""}
                onChange={(e) => setField("REMARKS", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Total FC: <b>{money(preview.totalFc)}</b>
              </span>
              <span>
                Tax FC: <b>{money(preview.taxFc)}</b>
              </span>
              <span>
                Final FC: <b>{money(preview.finalFc)}</b>
              </span>
              <span>
                @ {preview.exRate > 0 ? preview.exRate.toFixed(6) : "-"}
              </span>
              <span>
                Final LC: <b>{money(preview.finalLc)}</b>
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={savingCharge}>
              {savingCharge && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete additional charge?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the change from the Purchase Quotation. Deleting is not
              allowed once the quotation has been submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}