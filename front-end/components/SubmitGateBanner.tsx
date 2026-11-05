"use client";

import { AlertCircle } from "lucide-react";
import { SUBMIT_BEFORE_ADD_MESSAGE, pendingEntryLabel } from "@/lib/entrySubmit";

/**
 * Amber banner shown on entry screens while a saved row is still waiting to
 * be submitted. Those screens also disable their "Add" action, so the banner
 * explains why the button is unavailable and which reference blocks it.
 */
export default function SubmitGateBanner({
  pendingEntry,
  message,
}: {
  pendingEntry: Record<string, any> | null | undefined;
  message?: string;
}) {
  if (!pendingEntry) return null;
  const ref = pendingEntryLabel(pendingEntry);
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        {message || SUBMIT_BEFORE_ADD_MESSAGE}
        {ref ? ` Pending reference: ${ref}.` : ""}
      </span>
    </div>
  );
}
