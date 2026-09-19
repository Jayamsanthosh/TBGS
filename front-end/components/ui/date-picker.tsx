"use client";

import { useRef } from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/validation";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder, disabled, className }: DatePickerProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative" onClick={() => { if (!disabled) nativeRef.current?.showPicker?.(); }}>
      <Input
        type="text"
        readOnly
        disabled={disabled}
        value={value ? formatDate(value) : ""}
        placeholder={placeholder || "Select date"}
        className={`h-9 text-xs pr-9 cursor-pointer ${className || ""}`}
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        ref={nativeRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      />
    </div>
  );
}
