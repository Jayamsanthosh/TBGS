"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StepErrors } from "./types";

/* The wizard is one long scrolling page inside the existing modal: the header,
   then every detail line, then the review. There are no step buttons - the
   scrollbar is the only navigation - so the footer just carries Cancel/Save.
   A step key can still be targeted directly (validation jumps, "edit this line")
   through data-step-id / data-anchor. */
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
}) {
  const contentRef = useRef<HTMLDivElement>(null);

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

  /* An externally requested jump, e.g. save found an error further up. */
  useEffect(() => {
    if (focusStep && open) scrollToStep(focusStep.key);
  }, [focusStep?.nonce, open, scrollToStep, focusStep]);

  /* Start every open at the top so a re-opened form is not left scrolled. */
  useEffect(() => {
    if (open && contentRef.current) contentRef.current.scrollTop = 0;
  }, [open]);

  const errorCount = Object.values(errors).reduce((n, list) => n + (list?.length ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl max-h-[90vh] flex-col overflow-hidden w-[calc(100vw-2rem)] p-0">
        <DialogHeader className="shrink-0 space-y-0 px-6 pt-6 pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div
          ref={contentRef}
          className="wizard-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto border-t border-border px-6 py-4"
        >
          {children}
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
