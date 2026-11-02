"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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

const SUBMIT_LABEL = /^\s*submit(?:ting)?(?:\b|\.\.\.)/i;
const TRIGGER_SELECTOR = 'button, input[type="submit"], [role="button"]';

const findSubmitTrigger = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const trigger = target.closest(TRIGGER_SELECTOR) as HTMLElement | null;
  if (!trigger) return null;
  if (trigger.closest("[data-submit-confirmation]")) return null;
  if (trigger.hasAttribute("data-skip-submit-confirm")) return null;
  if (trigger instanceof HTMLButtonElement && trigger.disabled) return null;
  if (trigger.getAttribute("aria-disabled") === "true") return null;

  const labels = [
    trigger.getAttribute("title"),
    trigger.getAttribute("aria-label"),
    trigger instanceof HTMLInputElement ? trigger.value : "",
    trigger.textContent,
  ];

  return labels.some((label) => SUBMIT_LABEL.test(label ?? "")) ? trigger : null;
};

export default function SubmitConfirmation() {
  const pathname = usePathname();
  const bypassRef = useRef<HTMLElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (pathname?.includes("/login")) return;

      const trigger = findSubmitTrigger(event.target);
      if (!trigger) return;

      if (bypassRef.current === trigger) {
        bypassRef.current = null;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setTarget(trigger);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  const confirm = () => {
    const trigger = target;
    setTarget(null);
    if (!trigger?.isConnected) return;
    bypassRef.current = trigger;
    window.setTimeout(() => trigger.click(), 0);
  };

  return (
    <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
      <AlertDialogContent data-submit-confirmation>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit this record?</AlertDialogTitle>
          <AlertDialogDescription>
            The record will be sent for approval. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Submit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
