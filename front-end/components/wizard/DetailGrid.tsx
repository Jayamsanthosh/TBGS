"use client";

import { Fragment } from "react";
import { Trash2 } from "lucide-react";
import { Field } from "./DetailLineCard";
import type { FieldDescriptor, FieldGroup } from "./types";

const columnWidth = (field: FieldDescriptor) => {
  if (field.colSpan) return 300;
  if (field.key === "PRODUCT_ID") return 230;
  if (field.key === "DESCRIPTION" || field.key === "REASON") return 210;
  if (field.key === "MAIN_CATEGORY_ID" || field.key === "SUB_CATEGORY_ID") return 175;
  if (field.key === "REFERENCE_NO" || field.key === "TRUCK_ID") return 150;
  if (field.key === "REQUIRED_DATE") return 145;
  if (field.kind === "computed") return 105;
  if (field.kind === "number") return 95;
  if (field.kind === "date") return 145;
  return 140;
};

export default function DetailGrid({
  groups,
  rows,
  primaryField,
  errorsFor,
  onChange,
  onRemove,
  anchorFor,
}: {
  groups: FieldGroup[];
  rows: any[];
  primaryField?: FieldDescriptor;
  errorsFor?: (row: any) => string[] | undefined;
  onChange: (rowKey: string, field: string, value: any) => void;
  onRemove: (rowKey: string) => void;
  anchorFor?: (row: any) => string;
}) {
  const columns: FieldDescriptor[] = [];
  const seen = new Set<string>();
  const add = (field?: FieldDescriptor) => {
    if (!field || field.key === "LINE_NO" || seen.has(field.key)) return;
    seen.add(field.key);
    columns.push(field);
  };
  add(primaryField);
  groups.forEach((group) => group.fields.forEach(add));

  const isInvalid = (field: FieldDescriptor, row: any) =>
    Boolean(field.required && (row[field.key] === null || row[field.key] === undefined || row[field.key] === ""));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-12 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              #
            </th>
            {columns.map((field) => (
              <th
                key={field.key}
                className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ minWidth: columnWidth(field) }}
                title={field.hint}
              >
                {field.label}
                {field.required ? <span className="ml-0.5 text-destructive">*</span> : null}
              </th>
            ))}
            <th className="w-12 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowErrors = errorsFor?.(row) ?? [];
            return (
              <Fragment key={row.key}>
                <tr
                  data-anchor={anchorFor?.(row)}
                  className="scroll-mt-4 border-b align-top last:border-0 hover:bg-muted/20"
                >
                  <td className="px-2 py-2 font-semibold tabular-nums text-muted-foreground">
                    {row.LINE_NO ?? "-"}
                  </td>
                  {columns.map((field) => (
                    <td key={field.key} className="px-2 py-2" style={{ minWidth: columnWidth(field) }}>
                      <Field
                        field={field}
                        row={row}
                        invalid={rowErrors.length > 0 && isInvalid(field, row)}
                        onChange={(key, value) => onChange(row.key, key, value)}
                        hideLabel
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onRemove(row.key)}
                      title="Remove line"
                      className="rounded p-1.5 transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
                {rowErrors.length > 0 ? (
                  <tr className="border-b border-destructive/40 bg-destructive/5">
                    <td colSpan={columns.length + 2} className="px-3 py-2">
                      <ul className="space-y-0.5">
                        {rowErrors.map((message) => (
                          <li key={message} className="text-[11px] text-destructive">
                            {message}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
