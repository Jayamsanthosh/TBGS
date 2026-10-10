"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StepErrors } from "./types";

/* An extra pane shown alongside the main form, e.g. the Batch tab. The main
   form is always the first tab ("__form"); extra tabs are appended. */
export interface WizardExtraTab {
  key: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

/* The wizard is one long scrolling page inside the existing modal: the header,
   then every detail line, then the review. When `extraTabs` is provided a tab
   strip is rendered above the scroll pane and the panes are toggled with CSS so
   the main form keeps its state/refs while another tab is shown. Without
   `extraTabs` the behaviour is exactly as before (single scrolling form). */
export default function WizardShell({
  open,
  onOpenChange,
  title,
  errors,
  saving,
  savingLabel = "Saving...",
  saveLabel,
  onSave,
  saveClassName = "bg-primary text-primary-foreground hover:bg-primary/90",
  children,
  footerNote,
  focusStep,
  focusTab,
  extraTabs,
  formTabLabel = "Details",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  errors: StepErrors;
  saving: boolean;
  savingLabel?: string;
  saveLabel: string;
  onSave: () => void;
  saveClassName?: string;
  children: ReactNode;
  footerNote?: ReactNode;
  /* Lets the page jump anywhere on the page, e.g. the first thing that failed
     validation. Bump the nonce to request another scroll to the key. */
  focusStep?: { key: string; nonce: number } | null;
  extraTabs?: WizardExtraTab[];
  formTabLabel?: string;
  /* Lets the page request a named tab (e.g. open the Batch tab from a detail
     line). Bump the nonce to request it again. */
  focusTab?: { key: string; nonce: number } | null;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasTabs = !!(extraTabs && extraTabs.length);
  const [activeTab, setActiveTab] = useState("__form");

  const scrollToStep = useCallback((key: string) => {
    const pane = contentRef.current;
    if (!pane) return;
    const el =
      pane.querySelector<HTMLElement>(`[data-step-id="${key}"]`) ??
      pane.querySelector<HTMLElement>(`[data-anchor="${key}"]`);
    if (!el) return;
    /* Set scrollTop directly so the dialog itself never moves. */
    const top =
      el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 12;
    pane.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }, []);

  /* An externally requested jump, e.g. save found an error further up. The
     form tab must be showing first, then the scroll runs on the next pass. */
  useEffect(() => {
    if (!open || !focusStep) return;
    if (hasTabs && activeTab !== "__form") {
      setActiveTab("__form");
      return;
    }
    scrollToStep(focusStep.key);
  }, [focusStep?.nonce, open, activeTab, hasTabs, scrollToStep, focusStep]);

  /* An externally requested tab, e.g. a detail line's "Balance to Map" cell
     opening the Batch tab. */
  useEffect(() => {
    if (!open || !focusTab) return;
    setActiveTab(focusTab.key);
  }, [focusTab?.nonce, open, focusTab]);

  /* Start every open at the top (and on the main form) so a re-opened record
     is not left scrolled or on the Batch tab. */
  useEffect(() => {
    if (!open) return;
    setActiveTab("__form");
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [open]);

  const errorCount = Object.values(errors).reduce((n, list) => n + (list?.length ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl max-h-[90vh] flex-col overflow-hidden w-[calc(100vw-2rem)] p-0">
        <DialogHeader className="shrink-0 space-y-0 px-6 pt-6 pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {hasTabs ? (
          <div className="flex shrink-0 items-center gap-1 border-t border-border px-6 pt-3">
            <TabButton active={activeTab === "__form"} onClick={() => setActiveTab("__form")}>
              {formTabLabel}
            </TabButton>
            {(extraTabs || []).map((t) => (
              <TabButton
                key={t.key}
                active={activeTab === t.key}
                disabled={t.disabled}
                onClick={() => !t.disabled && setActiveTab(t.key)}
              >
                {t.label}
              </TabButton>
            ))}
          </div>
        ) : null}

        <div
          ref={contentRef}
          className="wizard-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto border-t border-border px-6 py-4"
        >
          {hasTabs ? (
            <>
              <div className={activeTab === "__form" ? undefined : "hidden"}>{children}</div>
              {(extraTabs || []).map((t) => (
                <div key={t.key} className={activeTab === t.key ? undefined : "hidden"}>
                  {t.content}
                </div>
              ))}
            </>
          ) : (
            children
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-6 py-4">
          <div className="text-[11px] text-muted-foreground">
            {errorCount > 0 ? (
              <span className="font-medium text-destructive">
                {errorCount} issue{errorCount === 1 ? "" : "s"} to fix
              </span>
            ) : (
              footerNote
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving} className={cn("text-xs", saveClassName)}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              {saving ? savingLabel : saveLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative -mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
