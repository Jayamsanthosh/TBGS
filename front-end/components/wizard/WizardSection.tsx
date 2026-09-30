"use client";

import { AlertCircle } from "lucide-react";
import type { WizardSectionProps } from "./types";

/* One scrollable section of the page. data-step-id is what a Save-time scroll
   jump targets, so it must match the section key (HDR_STEP, DTL_STEP,
   REVIEW_STEP) exactly. */
export default function WizardSection({
  stepKey,
  title,
  subtitle,
  errors,
  actions,
  children,
}: WizardSectionProps) {
  return (
    <section data-step-id={stepKey} className="scroll-mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {errors && errors.length > 0 ? (
        <ul className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-1">
          {errors.map((message) => (
            <li key={message} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />
              <span>{message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {children}
    </section>
  );
}
