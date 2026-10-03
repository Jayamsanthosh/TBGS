"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { FieldDescriptor, FieldGroup, WizardOption } from "./types";

const resolveOptions = (
  options: FieldDescriptor["options"],
  row: any
): WizardOption[] => (typeof options === "function" ? options(row) : options ?? []);

/* Labels and controls are deliberately tight so a whole detail line fits on one
   screen instead of running down two. The Input and SelectTrigger primitives hardcode
   h-10, so the !h-8 here is what actually delivers the 32px box the line is built
   around; without it the boxes would sit at two different heights. */
const labelCls = "text-[10px] leading-tight";
const boxCls = "!h-8 gap-1 text-xs";

const Field = ({
  field,
  row,
  onChange,
  invalid,
}: {
  field: FieldDescriptor;
  row: any;
  onChange: (key: string, value: any) => void;
  invalid?: boolean;
}) => {
  const border = invalid ? "border-destructive ring-1 ring-destructive/30" : "";
  /* Per-line lock, resolved once here so every editable kind below honours it. */
  const locked = typeof field.disabled === "function" ? !!field.disabled(row) : !!field.disabled;

  const label = (
    <Label className={labelCls}>
      {field.label}
      {field.required ? <span className="text-destructive ml-0.5">*</span> : null}
      {field.hint ? <span className="text-muted-foreground font-normal ml-1">({field.hint})</span> : null}
    </Label>
  );

  /* Computed and read-only cells never take input. */
  if (field.kind === "readOnly") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div
          className={cn(
            boxCls,
            "flex items-center rounded-md border border-input bg-muted/40 px-2 text-muted-foreground truncate"
          )}
        >
          {field.display ? field.display(row) : row[field.key] ?? "-"}
        </div>
      </div>
    );
  }

  if (field.kind === "computed") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div
          className={cn(
            boxCls,
            "flex items-center rounded-md border border-input bg-muted/40 px-2 tabular-nums",
            field.display ? "font-semibold" : ""
          )}
        >
          {field.display ? field.display(row) : row[field.key] ?? "-"}
        </div>
      </div>
    );
  }

if (field.kind === "select") {
    const options = resolveOptions(field.options, row);
    return (
      <div className="flex flex-col gap-1">
        {label}
        <Select
          value={row[field.key] == null ? "" : String(row[field.key])}
          onValueChange={(v) => { if (!locked) onChange(field.key, field.transform ? field.transform(v) : v); }}
          disabled={locked}
        >
          <SelectTrigger className={cn(boxCls, "w-full", border, locked && "opacity-70")}>
            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.kind === "date") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <DatePicker
          value={row[field.key] || ""}
          onChange={(v) => { if (!locked) onChange(field.key, v); }}
          placeholder={field.placeholder}
          disabled={locked}
          className={cn("!h-8", border) || undefined}
        />
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <Textarea
          value={row[field.key] || ""}
          onChange={(e) => { if (!locked) onChange(field.key, field.transform ? field.transform(e.target.value) : e.target.value); }}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={locked}
          /* The shared Textarea carries min-h-[80px], and a min-height always beats the
             h-8 in boxCls, so it has to be cleared explicitly. */
          className={cn(boxCls, "!min-h-0 resize-none !px-2 py-1", border, locked && "opacity-70")}
        />
      </div>
    );
  }

  const isNumber = field.kind === "number";
  return (
    <div className="flex flex-col gap-1">
      {label}
      <Input
        type={isNumber ? "number" : "text"}
        value={row[field.key] ?? ""}
        onChange={(e) => { if (!locked) onChange(field.key, field.transform ? field.transform(e.target.value) : e.target.value); }}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        min={field.min}
        max={field.max}
        step={field.step ?? (isNumber ? "any" : undefined)}
        disabled={locked}
        className={cn(boxCls, border, locked && "opacity-70")}
      />
    </div>
  );
};

/* One detail line. The groups run left to right on a single line and the card
   scrolls sideways, so a whole line is one short strip instead of a tall stack.
   The page owns the row and the change handler, so all the cascade logic
   (product -> category/uom, tax -> percentage) stays where it is. */
export default function DetailLineCard({
  title,
  subtitle,
  groups,
  row,
  onChange,
  onRemove,
  removeLabel = "Remove line",
  errors,
  anchor,
  invalidFieldKeys,
}: {
  title: string;
  subtitle?: string;
  groups: FieldGroup[];
  row: any;
  onChange: (key: string, value: any) => void;
  onRemove?: () => void;
  removeLabel?: string;
  errors?: string[];
  /* Scroll target for "jump to this line", e.g. from the review page. */
  anchor?: string;
  /* Field keys that failed validation, so the offending input gets a red ring
     next to the message. Optional: callers that don't validate per field simply
     omit it and only the banner shows. */
  invalidFieldKeys?: string[];
}) {
  const invalidSet = new Set(invalidFieldKeys ?? []);
  return (
    <div
      data-anchor={anchor}
      className="scroll-mt-4 overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-1.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{title}</p>
          {subtitle ? <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            title={removeLabel}
            className="shrink-0 rounded p-1.5 transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        ) : null}
      </div>

      {errors && errors.length > 0 ? (
        <ul className="space-y-1 border-b border-destructive/40 bg-destructive/5 px-3 py-2">
          {errors.map((message) => (
            <li key={message} className="text-xs text-destructive">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="wizard-scrollbar overflow-x-auto p-3">
        <div className="flex min-w-max items-start gap-4">
          {groups.map((group) => (
            <div key={group.title} className="flex shrink-0 flex-col gap-1.5">
              <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <div className="flex items-end gap-2">
                {group.fields.map((field) => (
                  <div
                    key={field.key}
                    className={cn("shrink-0", field.colSpan ? "w-[308px]" : "w-[150px]")}
                  >
                    <Field
                      field={field}
                      row={row}
                      onChange={onChange}
                      invalid={invalidSet.has(field.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
