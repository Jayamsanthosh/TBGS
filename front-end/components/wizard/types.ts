import type { ReactNode } from "react";

export interface WizardOption {
  value: string;
  label: string;
}

/* A step is a scrollable section in the content pane. The key is what the
   Next/Back buttons and the scroll-spy use to identify it, so it must match the
   data-step-id rendered by WizardSection. */
export interface WizardStep {
  key: string;
  label: string;
  group: "header" | "lines" | "review";
}

export const HDR_STEP = "hdr";
export const DTL_STEP = "dtl";
export const REVIEW_STEP = "review";
export const lineStepKey = (lineKey: string | number) => `dtl:${lineKey}`;

/* The three scroll sections in page order. Used to report the first problem
   when Save validates the whole record. */
export const SECTION_ORDER = [HDR_STEP, DTL_STEP, REVIEW_STEP] as const;

export type StepErrors = Record<string, string[]>;

export type FieldKind =
  | "text"
  | "number"
  | "date"
  | "select"
  | "searchable"
  | "textarea"
  | "readOnly"
  | "computed";

export interface FieldDescriptor {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
  colSpan?: boolean;
  /* Select choices. A function is used where the options are scoped per line. */
  options?: WizardOption[] | ((row: any) => WizardOption[]);
  /* How a readOnly/computed cell renders itself from the row. */
  display?: (row: any) => any;
  /* Locks an editable cell. A function is used where the lock depends on the
     line, e.g. a reference that is only editable on lines with no source
     document. The value still renders, it just cannot be typed over. */
  disabled?: boolean | ((row: any) => boolean);
  /* Applied to the raw input string before it reaches the row. */
  transform?: (value: string) => any;
}

export interface FieldGroup {
  title: string;
  fields: FieldDescriptor[];
}

export interface ReviewColumn {
  label: string;
  render: (row: any) => any;
  numeric?: boolean;
  emphasis?: boolean;
}

export interface WizardSectionProps {
  stepKey: string;
  title: string;
  subtitle?: string;
  errors?: string[];
  actions?: ReactNode;
  children: ReactNode;
}
