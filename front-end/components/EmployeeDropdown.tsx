import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { Label } from "@/components/ui/label";

interface EmployeeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  hideLabel?: boolean;
}

export function EmployeeDropdown({
  value,
  onChange,
  label = "Employee ID",
  required = false,
  disabled = false,
  placeholder = "Select employee",
  className,
  hideLabel = false,
}: EmployeeDropdownProps) {
  const { data: employeeRows, loading } = useApiQuery(
    "active-employees",
    async () => {
      const response = await fetch(`${API_URL}/employee-database?status=AC`);
      const json = await response.json();
      return json.data || [];
    }
  );

  const options = useMemo(() => {
    if (!Array.isArray(employeeRows)) return [];
    return employeeRows.map((emp) => {
      const fullName = [emp.FIRST_NAME, emp.MIDDLE_NAME, emp.LAST_NAME]
        .filter(Boolean)
        .join(" ");
      return {
        value: String(emp.EMP_ID),
        label: `${fullName} (#${emp.EMP_ID})`,
      };
    });
  }, [employeeRows]);

  const displayValue = value ? String(value) : "";

  return (
    <div className={className}>
      {!hideLabel && label && (
        <Label className="text-xs mb-2 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select value={displayValue} onValueChange={(v) => onChange(v === "__none__" ? "" : v)} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading employees..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— None —</SelectItem>
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
