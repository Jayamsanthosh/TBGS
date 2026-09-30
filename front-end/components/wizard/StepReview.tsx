"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewColumn } from "./types";

const show = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
};

/* The final step: header and detail lines side by side on one page, so the
   whole record can be checked before saving. showLines=false drops the line
   table for pages where the editable lines are already on screen just above. */
export default function StepReview({
  headerTitle = "Header Summary",
  headerFields,
  dtlTitle = "Detail Lines",
  columns,
  rows,
  onEditLine,
  totals,
  emptyMessage,
  onAddLine,
  addLabel = "Add Line",
  showLines = true,
}: {
  headerTitle?: string;
  headerFields: { label: string; value: any }[];
  dtlTitle?: string;
  columns: ReviewColumn[];
  rows: any[];
  onEditLine?: (row: any) => void;
  totals?: { label: string; value: any }[];
  emptyMessage: string;
  onAddLine?: () => void;
  addLabel?: string;
  showLines?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border">
        <p className="border-b bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {headerTitle}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 sm:grid-cols-3">
          {headerFields.map((f) => (
            <div key={f.label} className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase text-muted-foreground font-medium">{f.label}</span>
              <span className="truncate text-xs font-medium text-foreground">{show(f.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {showLines ? (
        <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {dtlTitle} ({rows.length})
          </p>
          {onAddLine ? (
            <Button variant="outline" size="sm" onClick={onAddLine} className="h-7 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> {addLabel}
            </Button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="max-h-[40vh] overflow-auto">
            <table className="w-full text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/50 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  {columns.map((c) => (
                    <th
                      key={c.label}
                      className={`p-2 font-semibold ${c.numeric ? "text-right" : ""}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key ?? i} className="border-t hover:bg-muted/30 transition-colors">
                    {columns.map((c, ci) => {
                      const value = c.render(row);
                      const editableLink = ci === 0 && onEditLine;
                      return (
                        <td
                          key={c.label}
                          className={`p-2 ${
                            c.numeric ? "tabular-nums text-right" : ""
                          } ${c.emphasis ? "font-semibold" : ""}`}
                        >
                          {editableLink ? (
                            <button
                              type="button"
                              onClick={() => onEditLine(row)}
                              className="text-primary underline underline-offset-2 hover:text-primary/80"
                              title="Edit this line"
                            >
                              {show(value)}
                            </button>
                          ) : (
                            show(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      ) : null}

      {totals && totals.length > 0 ? (
        <div className="rounded-lg border border-border">
          <p className="border-b bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Totals
          </p>
          <div className="grid grid-cols-3 gap-3 p-3 sm:grid-cols-6">
            {totals.map((t) => (
              <div key={t.label} className="flex flex-col">
                <span className="text-[10px] uppercase text-muted-foreground font-medium">{t.label}</span>
                <span className="text-xs font-semibold tabular-nums">{show(t.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
